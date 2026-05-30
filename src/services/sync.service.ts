import { supabase } from '@/config/supabase'
import {
  MediaType,
  ContentStatus,
  SitemapPriority,
  PersonRole,
  VideoSite,
  VideoType,
  RatingSource,
  SupportedLocale
} from '@/enums'
import { MovieRepository, PersonRepository } from '@/module/tmdb/repositories'
import type { MovieDetails, Credits, Cast, Crew } from '@/module/tmdb/tmdb.type'
import {
  broadcastSyncUpdate,
  broadcastSyncStarted,
  broadcastSyncCompleted,
  broadcastSyncError,
  type SyncJobStatus as SocketSyncJobStatus
} from '@/socket'
import type {
  SyncMoviesRequest,
  MovieSyncResult,
  MovieSyncProgress
} from '@/types/sync.type'
import {
  DEFAULT_CREW_JOBS,
  DEFAULT_VIDEO_TYPES,
  DEFAULT_VIDEO_SITES,
  DEFAULT_PROVIDER_REGIONS
} from '@/types/sync.type'

// Extend MovieDetails interface to include videos and watch/providers
interface ExtendedMovieDetails extends MovieDetails {
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string; official: boolean; published_at: string; iso_639_1: string }> }
  'watch/providers'?: { results: Record<string, { link: string; flatrate?: Array<{ provider_id: number }>; rent?: Array<{ provider_id: number }>; buy?: Array<{ provider_id: number }> }> }
}

// Utilidades
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(message: string, jobId?: string): void {
  const timestamp = new Date().toISOString()
  const prefix = jobId ? `[${jobId}] ` : ''
  console.log(`[${timestamp}] SYNC ${prefix}${message}`)
}

function logError(message: string, jobId?: string): void {
  const timestamp = new Date().toISOString()
  const prefix = jobId ? `[${jobId}] ` : ''
  console.error(`[${timestamp}] SYNC ERROR ${prefix}${message}`)
}

// Job state management
interface SyncJobState {
  id: string
  isRunning: boolean
  isPaused: boolean
  isStopped: boolean
  startedAt: number
  processed: number
  errors: number
  skipped: number
  updated: number
  new: number
  totalMovies: number
  currentMovieIndex: number
  progress?: MovieSyncProgress
  results: MovieSyncResult[]
}

const activeJobs = new Map<string, SyncJobState>()

// Mapeo de roles de TMDB a nuestros enums
const JOB_ROLE_MAP: Record<string, PersonRole> = {
  'Director': PersonRole.DIRECTOR,
  'Screenplay': PersonRole.WRITER,
  'Story': PersonRole.WRITER,
  'Producer': PersonRole.PRODUCER,
  'Executive Producer': PersonRole.PRODUCER,
  'Original Music Composer': PersonRole.COMPOSER,
  'Director of Photography': PersonRole.CINEMATOGRAPHER,
  'Editor': PersonRole.EDITOR,
  'Production Design': PersonRole.PRODUCTION_DESIGNER,
  'Art Direction': PersonRole.ART_DIRECTOR,
  'Set Decoration': PersonRole.OTHER,
  'Costume Design': PersonRole.COSTUME_DESIGNER,
  'Sound': PersonRole.SOUND_DESIGNER,
  'Visual Effects': PersonRole.VISUAL_EFFECTS
}

export class SyncMoviesService {
  
  /**
   * Iniciar un nuevo job de sincronización
   */
  static async startSync(request: SyncMoviesRequest): Promise<string> {
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    log(`Starting new sync job: ${jobId}`, jobId)
    
    // Inicializar estado del job
    const state: SyncJobState = {
      id: jobId,
      isRunning: true,
      isPaused: false,
      isStopped: false,
      startedAt: Date.now(),
      processed: 0,
      errors: 0,
      skipped: 0,
      updated: 0,
      new: 0,
      totalMovies: request.movieCount,
      currentMovieIndex: 0,
      progress: {
        currentMovie: {
          tmdbId: 0,
          title: 'Initializing...',
          voteAverage: undefined,
          voteCount: undefined,
          popularity: undefined,
          posterPath: undefined,
          backdropPath: undefined,
          currentStep: 'Preparing sync',
          stepIndex: 0,
          totalSteps: 6
        },
        overall: {
          processed: 0,
          errors: 0,
          total: request.movieCount,
          percentage: 0
        }
      },
      results: []
    }
    
    activeJobs.set(jobId, state)
    
    // Emitir evento de inicio a todos los admins via WebSocket
    const socketStatus = this.convertToSocketStatus(state)
    broadcastSyncStarted(socketStatus)
    
    // Ejecutar el job de forma asíncrona con mejor manejo de errores
    this.executeSync(jobId, request).catch(error => {
      logError(`Job execution failed: ${error.message}`, jobId)
      const finalState = activeJobs.get(jobId)
      if (finalState) {
        finalState.isRunning = false
        finalState.errors++
        
        // Emitir error via WebSocket
        broadcastSyncError(jobId, error.message)
        
        // Emitir estado final
        const finalSocketStatus = this.convertToSocketStatus(finalState)
        broadcastSyncUpdate(finalSocketStatus)
      }
    })
    
    return jobId
  }
  
  /**
   * Obtener estado de un job
   */
  static getJobStatus(jobId: string): SyncJobState | null {
    const state = activeJobs.get(jobId)
    if (state) {
      log(`Status requested for job ${jobId}: running=${state.isRunning}, processed=${state.processed}`, jobId)
    } else {
      log(`Status requested for job ${jobId}: NOT FOUND`)
    }
    return state || null
  }
  
  /**
   * Pausar un job
   */
  static pauseJob(jobId: string): boolean {
    const state = activeJobs.get(jobId)
    if (!state?.isRunning) return false
    
    state.isPaused = true
    log(`Job paused`, jobId)
    return true
  }
  
  /**
   * Reanudar un job
   */
  static resumeJob(jobId: string): boolean {
    const state = activeJobs.get(jobId)
    if (!state?.isRunning) return false
    
    state.isPaused = false
    log(`Job resumed`, jobId)
    return true
  }
  
  /**
   * Detener un job
   */
  static stopJob(jobId: string): boolean {
    const state = activeJobs.get(jobId)
    if (!state) return false
    
    state.isStopped = true
    state.isPaused = false
    state.isRunning = false
    log(`Job stopped`, jobId)
    return true
  }
  
  /**
   * Obtener lista de jobs activos
   */
  static getActiveJobs(): string[] {
    return Array.from(activeJobs.keys())
  }

  /**
   * Convertir estado interno a formato de WebSocket
   */
  private static convertToSocketStatus(state: SyncJobState): SocketSyncJobStatus {
    const elapsedTime = Date.now() - state.startedAt
    const percentage = state.totalMovies > 0 ? (state.processed / state.totalMovies) * 100 : 0
    
    return {
      jobId: state.id,
      status: state.isStopped ? 'stopped' : state.isRunning ? 'running' : 'completed',
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      isStopped: state.isStopped,
      startedAt: state.startedAt,
      elapsedTime,
      totalMovies: state.totalMovies,
      currentMovieIndex: state.currentMovieIndex,
      processed: state.processed,
      errors: state.errors,
      skipped: state.skipped,
      updated: state.updated,
      new: state.new,
      progress: {
        currentMovie: state.progress?.currentMovie || {
          tmdbId: 0,
          title: 'Initializing...',
          voteAverage: undefined,
          voteCount: undefined,
          popularity: undefined,
          posterPath: undefined,
          backdropPath: undefined,
          currentStep: 'Preparing',
          stepIndex: 0,
          totalSteps: 6
        },
        overall: {
          processed: state.processed,
          errors: state.errors,
          total: state.totalMovies,
          percentage
        }
      },
      results: state.results,
      lastUpdated: Date.now()
    }
  }

  /**
   * Emitir actualización de estado via WebSocket
   */
  private static emitSyncUpdate(jobId: string) {
    const state = activeJobs.get(jobId)
    if (state) {
      const socketStatus = this.convertToSocketStatus(state)
      broadcastSyncUpdate(socketStatus)
    }
  }

  /**
   * Limpiar jobs completados
   */
  static cleanupCompletedJobs(): void {
    const now = Date.now()
    const TIMEOUT = 30 * 60 * 1000 // 30 minutos
    
    for (const [jobId, state] of activeJobs.entries()) {
      if (!state.isRunning && (now - state.startedAt) > TIMEOUT) {
        activeJobs.delete(jobId)
        log(`Cleaned up completed job: ${jobId}`)
      }
    }
  }
  
  /**
   * Ejecución principal del job
   */
  private static async executeSync(jobId: string, request: SyncMoviesRequest): Promise<void> {
    const state = activeJobs.get(jobId)
    if (!state) {
      logError(`Job state not found: ${jobId}`)
      return
    }
    
    log(`Starting sync with strategy: ${request.searchStrategy}`, jobId)
    
    try {
      let moviesToProcess: Array<{ id: number; title: string }> = []
      
      if (request.searchStrategy === 'single_search') {
        moviesToProcess = await this.searchMoviesSingleBatch(request, jobId)
      } else {
        moviesToProcess = await this.searchMoviesMultiplePages(request, jobId)
      }
      
      state.totalMovies = moviesToProcess.length
      log(`Found ${moviesToProcess.length} movies to process`, jobId)
      
      if (moviesToProcess.length === 0) {
        state.isRunning = false
        log(`No movies found to process, ending job`, jobId)
        return
      }
      
      for (let i = 0; i < moviesToProcess.length; i++) {
        const currentState = activeJobs.get(jobId)
        if (!currentState || currentState.isStopped) {
          log(`Job stopped by user`, jobId)
          break
        }
        
        // Esperar si está pausado
        while (currentState.isPaused && !currentState.isStopped) {
          await sleep(100)
        }
        
        if (currentState.isStopped) break
        
        currentState.currentMovieIndex = i
        const movie = moviesToProcess[i]

        if (!movie) {
          log(`Movie at index ${i} is undefined, skipping`, jobId)
          continue
        }

        // Actualizar progreso
        currentState.progress = {
          currentMovie: {
            tmdbId: movie.id,
            title: movie.title,
            voteAverage: undefined,
            voteCount: undefined,
            popularity: undefined,
            posterPath: undefined,
            backdropPath: undefined,
            currentStep: 'Iniciando',
            stepIndex: 0,
            totalSteps: 6
          },
          overall: {
            processed: currentState.processed,
            errors: currentState.errors,
            total: moviesToProcess.length,
            percentage: Math.round((i / moviesToProcess.length) * 100)
          }
        }
        
        // Actualizar película actual ANTES de procesar
        state.progress!.currentMovie = {
          tmdbId: movie.id,
          title: movie.title,
          voteAverage: undefined,
          voteCount: undefined,
          popularity: undefined,
          posterPath: undefined,
          backdropPath: undefined,
          currentStep: 'Fetching details...',
          stepIndex: 1,
          totalSteps: 6
        }
        
        // Emitir actualización antes de procesar
        this.emitSyncUpdate(jobId)
        
        log(`Processing movie ${i + 1}/${moviesToProcess.length}: ${movie.title} (${movie.id})`, jobId)
        
        const result = await this.syncMovie(movie.id, request, jobId)
        currentState.results.push(result)
        
        // Actualizar estado después de procesar
        state.progress!.currentMovie.currentStep = result.success ? 'Completed' : 'Failed'
        state.progress!.currentMovie.stepIndex = result.success ? 6 : 0
        
        if (result.success) {
          if (result.updated) {
            currentState.updated++
          } else {
            currentState.new++
          }
          currentState.processed++
          log(`✅ Success: ${movie.title} - ${result.updated ? 'Updated' : 'New'}`, jobId)
        } else if (result.skipped) {
          currentState.skipped++
          log(`⏭️  Skipped: ${movie.title} - ${result.error}`, jobId)
        } else {
          currentState.errors++
          logError(`❌ Error: ${movie.title} - ${result.error}`, jobId)
        }
        
        // Emitir actualización via WebSocket después de cada película
        this.emitSyncUpdate(jobId)
        
        // Delay entre películas
        if (request.delayBetweenMovies && i < moviesToProcess.length - 1) {
          await sleep(request.delayBetweenMovies)
        }
      }
      
      state.isRunning = false
      log(`✅ Sync completed - Processed: ${state.processed}, New: ${state.new}, Updated: ${state.updated}, Errors: ${state.errors}, Skipped: ${state.skipped}`, jobId)
      
      // Emitir evento de completado via WebSocket
      const finalSocketStatus = this.convertToSocketStatus(state)
      broadcastSyncCompleted(finalSocketStatus)
      
    } catch (error) {
      state.isRunning = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`❌ Sync failed: ${errorMessage}`, jobId)
    }
  }
  
  /**
   * Búsqueda en una sola página
   */
  private static async searchMoviesSingleBatch(request: SyncMoviesRequest, jobId: string): Promise<Array<{ id: number; title: string }>> {
    const randomPage = Math.floor(Math.random() * 100) + 1 // Reducir a 100 para evitar páginas muy altas
    log(`Searching movies on page ${randomPage}`, jobId)
    
    const response = await MovieRepository.getPopular(randomPage)
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch movies: ${response.error}`)
    }
    
    let movies = response.data.results || []
    log(`Found ${movies.length} movies on page ${randomPage}`, jobId)
    
    // Aplicar filtros
    movies = this.applyFilters(movies, request, jobId)
    
    // Limitar a la cantidad solicitada
    return movies.slice(0, request.movieCount)
  }
  
  /**
   * Búsqueda en múltiples páginas hasta obtener la cantidad deseada
   */
  private static async searchMoviesMultiplePages(request: SyncMoviesRequest, jobId: string): Promise<Array<{ id: number; title: string }>> {
    const allMovies: Array<{ id: number; title: string }> = []
    const maxPages = request.maxPagesToSearch || 10
    const startPage = Math.floor(Math.random() * 100) + 1 // Reducir a 100 para evitar páginas muy altas
    const maxAllowedPage = 500 // Límite máximo de páginas de TMDB
    let currentPage = startPage
    let pagesWithoutResults = 0 // Contador de páginas sin resultados
    const maxPagesWithoutResults = 5 // Detener después de 5 páginas sin resultados
    
    while (allMovies.length < request.movieCount && 
           currentPage <= startPage + maxPages - 1 && 
           currentPage <= maxAllowedPage &&
           pagesWithoutResults < maxPagesWithoutResults) {
      
      log(`Searching movies on page ${currentPage}, found so far: ${allMovies.length}`, jobId)
      
      const response = await MovieRepository.getPopular(currentPage)
      if (!response.success || !response.data) {
        logError(`Failed to fetch page ${currentPage}: ${response.error}`, jobId)
        pagesWithoutResults++
        currentPage++
        continue
      }
      
      let movies = response.data.results || []
      
      // Si no hay películas en esta página, incrementar contador
      if (movies.length === 0) {
        pagesWithoutResults++
        currentPage++
        continue
      }
      
      // Resetear contador si encontramos películas
      pagesWithoutResults = 0
      
      movies = this.applyFilters(movies, request, jobId)
      
      if (movies.length > 0) {
        allMovies.push(...movies)
        log(`Found ${movies.length} valid movies on page ${currentPage}`, jobId)
      }
      
      if (allMovies.length >= request.movieCount) {
        break
      }
      
      currentPage++
    }
    
    log(`Total movies found after searching ${currentPage - startPage} pages: ${allMovies.length}`, jobId)
    return allMovies.slice(0, request.movieCount)
  }
  
  /**
   * Aplicar filtros a las películas
   */
  private static applyFilters(movies: Array<any>, request: SyncMoviesRequest, _jobId: string): Array<any> {
    return movies.filter(movie => {
      // Filtros de calidad
      if (request.minVoteAverage && (movie.vote_average || 0) < request.minVoteAverage) {
        return false
      }
      if (request.minVoteCount && (movie.vote_count || 0) < request.minVoteCount) {
        return false
      }
      if (request.minPopularity && (movie.popularity || 0) < request.minPopularity) {
        return false
      }
      
      // Filtros de contenido
      if (!request.includeAdult && movie.adult) {
        return false
      }
      if (request.originalLanguage && movie.original_language !== request.originalLanguage) {
        return false
      }
      
      // Filtro por año
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear()
        if (request.releaseYearStart && year < request.releaseYearStart) {
          return false
        }
        if (request.releaseYearEnd && year > request.releaseYearEnd) {
          return false
        }
      }
      
      // Filtro por géneros
      if (request.allowedGenres && request.allowedGenres.length > 0) {
        const movieGenres = movie.genre_ids || []
        if (request.requireAllGenres) {
          // Debe tener TODOS los géneros especificados
          const hasAllGenres = request.allowedGenres.every(genreId => 
            movieGenres.includes(genreId)
          )
          if (!hasAllGenres) return false
        } else {
          // Debe tener AL MENOS UNO de los géneros especificados
          const hasAnyGenre = request.allowedGenres.some(genreId => 
            movieGenres.includes(genreId)
          )
          if (!hasAnyGenre) return false
        }
      }
      
      return true
    })
  }
  
  /**
   * Sincronizar una película individual
   */
  private static async syncMovie(tmdbId: number, request: SyncMoviesRequest, jobId: string): Promise<MovieSyncResult> {
    const steps: string[] = []
    const updateProgress = (stepName: string) => {
      steps.push(stepName)
      const state = activeJobs.get(jobId)
      if (state?.progress) {
        state.progress.currentMovie.currentStep = stepName
        state.progress.currentMovie.stepIndex = steps.length
      }
    }
    
    try {
      updateProgress('Obteniendo datos de TMDB')
      
      // Obtener datos de la película
      const movieResponse = await MovieRepository.getById(tmdbId)
      if (!movieResponse.success || !movieResponse.data) {
        return {
          tmdbId,
          title: 'Unknown',
          success: false,
          error: movieResponse.error || 'Failed to fetch from TMDB',
          stepsCompleted: steps
        }
      }
      
      const movieEs = movieResponse.data.es as ExtendedMovieDetails
      const movieEn = movieResponse.data.en as ExtendedMovieDetails
      
      // Validar idiomas requeridos
      if (request.requireSpanishVersion && !movieEs) {
        return {
          tmdbId,
          title: movieEn?.original_title || 'Unknown',
          success: false,
          skipped: true,
          error: 'Spanish version required but not available',
          stepsCompleted: steps
        }
      }
      
      if (request.requireEnglishVersion && !movieEn) {
        return {
          tmdbId,
          title: movieEs?.original_title || 'Unknown',
          success: false,
          skipped: true,
          error: 'English version required but not available',
          stepsCompleted: steps
        }
      }
      
      const movie = movieEs || movieEn
      const title = movie.original_title || movie.title || 'Unknown'
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined
      
      // Actualizar progreso con datos de la película
      const state = activeJobs.get(jobId)
      if (state?.progress) {
        state.progress.currentMovie = {
          tmdbId: movie.id,
          title,
          voteAverage: movie.vote_average,
          voteCount: movie.vote_count,
          popularity: movie.popularity,
          posterPath: movie.poster_path || undefined,
          backdropPath: movie.backdrop_path || undefined,
          currentStep: 'Verificando existencia',
          stepIndex: 2,
          totalSteps: 6
        }
        this.emitSyncUpdate(jobId)
      }
      
      updateProgress('Verificando existencia')
      
      // Verificar si ya existe
      let existing: any = null
      try {
        const { data } = await supabase
          .from('media')
          .select('id, status, editorial_review_es, editorial_review_en, editorial_rating, editorial_verdict_es, editorial_verdict_en, seo_title_es, seo_title_en, seo_description_es, seo_description_en, og_image_url, is_prerendered, noindex, sitemap_priority')
          .eq('tmdb_id', tmdbId)
          .single()
        existing = data
      } catch {
        existing = null
      }
      
      // Si existe y no se debe actualizar
      if (existing && !request.updateExisting) {
        return {
          tmdbId,
          title,
          success: false,
          skipped: true,
          error: 'Movie exists and update is disabled',
          stepsCompleted: steps
        }
      }
      
      updateProgress('Guardando datos básicos')
      
      // Preparar datos de la película
      const mediaData = this.prepareMediaData(movie, movieEs, movieEn, existing, request)
      
      let mediaId: string
      let isUpdated = false
      
      if (existing) {
        // Actualizar existente
        const { data: updated } = await supabase
          .from('media')
          .update(mediaData)
          .eq('id', existing.id)
          .select('id')
          .single()
        
        mediaId = updated?.id
        isUpdated = true
      } else {
        // Crear nueva
        const { data: created } = await supabase
          .from('media')
          .insert(mediaData)
          .select('id')
          .single()
        
        mediaId = created?.id
      }
      
      if (!mediaId) {
        throw new Error('Failed to save media')
      }
      
      // Sincronizar relaciones
      if (movie.genres && movie.genres.length > 0) {
        updateProgress('Sincronizando géneros')
        await this.syncGenres(mediaId, movie.genres)
      }
      
      updateProgress('Sincronizando rating')
      await this.syncRating(mediaId, movie.vote_average || 0, movie.vote_count || 0)
      
      if (movieEs?.credits && request.maxCrew && request.maxCrew > 0) {
        updateProgress('Sincronizando créditos')
        await this.syncCredits(mediaId, movieEs.credits, request)
      }
      
      if (movieEs?.videos && request.syncVideos !== false) {
        updateProgress('Sincronizando videos')
        await this.syncVideos(mediaId, movieEs.videos, request)
      }
      
      if (movieEs?.['watch/providers'] && request.syncWatchProviders !== false) {
        updateProgress('Sincronizando plataformas')
        await this.syncWatchProviders(mediaId, movieEs['watch/providers'], request)
      }
      
      updateProgress('Completado')
      
      return {
        tmdbId,
        title,
        year,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        popularity: movie.popularity,
        posterPath: movie.poster_path ?? undefined,
        backdropPath: movie.backdrop_path ?? undefined,
        success: true,
        updated: isUpdated,
        stepsCompleted: steps
      }
      
    } catch (error) {
      return {
        tmdbId,
        title: 'Unknown',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stepsCompleted: steps
      }
    }
  }
  
  /**
   * Preparar datos de la película
   */
  private static prepareMediaData(movie: any, movieEs: ExtendedMovieDetails | null, movieEn: ExtendedMovieDetails | null, existing: any, request: SyncMoviesRequest) {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const popularity = movie.popularity || 0
    
    // Generar slug (usar utilidad existente o implementar aquí)
    const slug = this.generateSlug(movie.original_title, year)
    
    return {
      tmdb_id: movie.id,
      imdb_id: movie.imdb_id || null,
      media_type: MediaType.Movie,
      slug,
      original_title: movie.original_title,
      original_language: movie.original_language,
      release_date: movie.release_date || null,
      runtime_minutes: movie.runtime || null,
      tmdb_popularity: popularity,
      title_es: movieEs?.title || null,
      title_en: movieEn?.title || null,
      synopsis_es: movieEs?.overview || null,
      synopsis_en: movieEn?.overview || null,
      poster_path: movie.poster_path || null,
      backdrop_path: movie.backdrop_path || null,
      status: existing?.status || request.defaultStatus || ContentStatus.Draft,
      noindex: existing?.noindex ?? request.defaultNoindex ?? true,
      sitemap_priority: existing?.sitemap_priority || request.defaultSitemapPriority || SitemapPriority.Medium,
      tmdb_last_synced_at: new Date().toISOString(),
      editorial_review_es: (existing && request.preserveEditorial) ? existing.editorial_review_es : null,
      editorial_review_en: (existing && request.preserveEditorial) ? existing.editorial_review_en : null,
      editorial_rating: (existing && request.preserveEditorial) ? existing.editorial_rating : null,
      editorial_verdict_es: (existing && request.preserveEditorial) ? existing.editorial_verdict_es : null,
      editorial_verdict_en: (existing && request.preserveEditorial) ? existing.editorial_verdict_en : null,
      seo_title_es: (existing && request.preserveSeo) ? existing.seo_title_es : null,
      seo_title_en: (existing && request.preserveSeo) ? existing.seo_title_en : null,
      seo_description_es: (existing && request.preserveSeo) ? existing.seo_description_es : null,
      seo_description_en: (existing && request.preserveSeo) ? existing.seo_description_en : null,
      og_image_url: existing?.og_image_url || null,
      is_prerendered: existing?.is_prerendered || false
    }
  }
  
  /**
   * Generar slug simple
   */
  private static generateSlug(title: string, year?: number | null): string {
    if (!title) return ''
    
    let slug = title
      .toLowerCase()
      .replace(/[áàäâã]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôõ]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-]+|[-]+$/g, '')
    
    if (year && !slug.includes(year.toString())) {
      slug += `-${year}`
    }
    
    return slug
  }
  
  /**
   * Sincronizar géneros
   */
  private static async syncGenres(mediaId: string, genres: Array<{ id: number; name: string }>): Promise<void> {
    await supabase.from('media_genres').delete().eq('media_id', mediaId)
    
    for (const genre of genres) {
      // Buscar o crear género
      let genreData: { id: string } | null = null
      
      const { data: existing } = await supabase
        .from('genres')
        .select('id')
        .eq('tmdb_id', genre.id)
        .single()
      
      if (existing) {
        genreData = existing
      } else {
        const { data: created } = await supabase
          .from('genres')
          .insert({
            tmdb_id: genre.id,
            slug: this.generateSlug(genre.name),
            name_es: genre.name,
            name_en: genre.name,
            sitemap_priority: SitemapPriority.Medium
          })
          .select('id')
          .single()
        genreData = created
      }
      
      if (genreData) {
        await supabase.from('media_genres').insert({
          media_id: mediaId,
          genre_id: genreData.id
        })
      }
    }
  }
  
  /**
   * Sincronizar rating
   */
  private static async syncRating(mediaId: string, voteAverage: number, voteCount: number): Promise<void> {
    await supabase.from('media_ratings').upsert({
      media_id: mediaId,
      source: RatingSource.TMDB,
      score: voteAverage,
      vote_count: voteCount,
      raw_score: `${voteAverage}/10`,
      fetched_at: new Date().toISOString()
    }, {
      onConflict: 'media_id,source'
    })
  }
  
  /**
   * Sincronizar créditos
   */
  private static async syncCredits(mediaId: string, credits: Credits, request: SyncMoviesRequest): Promise<void> {
    await supabase.from('media_credits').delete().eq('media_id', mediaId)
    
    const maxCast = request.maxCast || 15
    const maxCrew = request.maxCrew || 15
    const crewJobs = request.crewJobs || DEFAULT_CREW_JOBS
    
    const actorsToSync = credits.cast?.slice(0, maxCast) || []
    const crewToSync = credits.crew?.filter((c) => crewJobs.includes(c.job)).slice(0, maxCrew) || []
    
    const uniquePeople = new Map<number, Cast | Crew>()
    
    for (const actor of actorsToSync) {
      uniquePeople.set(actor.id, actor)
    }
    
    for (const crew of crewToSync) {
      uniquePeople.set(crew.id, crew)
    }
    
    for (const [tmdbId, _personData] of uniquePeople) {
      const personId = await this.syncPerson(tmdbId)
      if (!personId) continue
      
      const actor = actorsToSync.find((a) => a.id === tmdbId)
      const crew = crewToSync.find((c) => c.id === tmdbId)
      
      if (actor) {
        await supabase.from('media_credits').insert({
          media_id: mediaId,
          person_id: personId,
          role: PersonRole.ACTOR,
          character_name: actor.character || null,
          cast_order: actor.order || null,
          department: null,
          job_title: null
        })
      }
      
      if (crew) {
        const role = JOB_ROLE_MAP[crew.job] || PersonRole.ACTOR
        await supabase.from('media_credits').insert({
          media_id: mediaId,
          person_id: personId,
          role,
          character_name: null,
          cast_order: null,
          department: crew.department || null,
          job_title: crew.job || null
        })
      }
    }
  }
  
  /**
   * Sincronizar persona
   */
  private static async syncPerson(tmdbId: number): Promise<string | null> {
    try {
      const [esData, enData] = await Promise.allSettled([
        PersonRepository.getPersonById_Es(tmdbId),
        PersonRepository.getPersonById_En(tmdbId)
      ])
      
      const personEs = esData.status === 'fulfilled' && esData.value.success ? esData.value.data : null
      const personEn = enData.status === 'fulfilled' && enData.value.success ? enData.value.data : null
      
      if (!personEs && !personEn) {
        return null
      }
      
      const person = personEs || personEn!
      const slug = this.generateSlug(person.name)
      
      const personData = {
        tmdb_id: tmdbId,
        slug,
        name: person.name,
        also_known_as: person.also_known_as || null,
        birthdate: person.birthday || null,
        deathdate: person.deathday || null,
        birthplace: person.place_of_birth || null,
        biography_es: personEs?.biography || null,
        biography_en: personEn?.biography || null,
        gender: person.gender || null,
        profile_path: person.profile_path || null,
        homepage_url: person.homepage || null,
        imdb_id: person.imdb_id || null,
        tmdb_popularity: person.popularity || null,
        sitemap_priority: SitemapPriority.Low,
        tmdb_last_synced_at: new Date().toISOString()
      }
      
      const { data: upserted } = await supabase
        .from('people')
        .upsert(personData, {
          onConflict: 'tmdb_id'
        })
        .select('id')
        .single()
      
      return upserted?.id || null
      
    } catch (error) {
      return null
    }
  }
  
  /**
   * Sincronizar videos
   */
  private static async syncVideos(mediaId: string, videos: any, request: SyncMoviesRequest): Promise<void> {
    if (!videos?.results) {
      log('No videos data available', '')
      return
    }
    
    await supabase.from('media_videos').delete().eq('media_id', mediaId)
    
    const videoTypes = request.videoTypes || DEFAULT_VIDEO_TYPES
    const videoSites = request.videoSites || DEFAULT_VIDEO_SITES
    const includeOfficialOnly = request.includeOfficialVideosOnly || false
    
    log(`Found ${videos.results.length} total videos`, '')
    
    // Debug: Mostrar primeros videos para ver qué estamos recibiendo
    if (videos.results.length > 0) {
      log(`Sample video data:`, '')
      log(`  - First video: ${JSON.stringify(videos.results[0], null, 2)}`, '')
      log(`  Available sites: ${[...new Set(videos.results.map((v: any) => v.site))].join(', ')}`, '')
      log(`  Available types: ${[...new Set(videos.results.map((v: any) => v.type))].join(', ')}`, '')
      log(`  Looking for sites: ${videoSites.join(', ')}`, '')
      log(`  Looking for types: ${videoTypes.join(', ')}`, '')
      log(`  Include official only: ${includeOfficialOnly}`, '')
    }
    
    const validVideos = videos.results.filter((v: any) => {
      // Convertir a minúsculas para comparar con enums
      const siteMatch = videoSites.includes(v.site.toLowerCase() as VideoSite)
      const typeMatch = videoTypes.includes(v.type.toLowerCase() as VideoType)
      const officialMatch = !includeOfficialOnly || v.official === true
      
      return siteMatch && typeMatch && officialMatch
    })
    
    log(`Filtered to ${validVideos.length} valid videos`, '')
    
    // Debug: Mostrar videos filtrados
    if (validVideos.length > 0) {
      log(`Sample valid video: ${JSON.stringify(validVideos[0], null, 2)}`, '')
    } else {
      log(`No videos passed filtering. Checking each filter:`, '')
      videos.results.slice(0, 3).forEach((v: any, i: number) => {
        log(`  Video ${i + 1}: ${v.name} - Site: ${v.site} (${v.site.toLowerCase()}) - Type: ${v.type} (${v.type.toLowerCase()}) - Official: ${v.official}`, '')
      })
    }
    
    if (validVideos.length === 0) {
      log('No valid videos found after filtering', '')
      return
    }
    
    for (const video of validVideos) {
      const locale = video.iso_639_1 === 'es' ? SupportedLocale.ES : SupportedLocale.EN
      const publishedDate = video.published_at ? video.published_at.split('T')[0] : null
      
      try {
        await supabase.from('media_videos').insert({
          media_id: mediaId,
          locale,
          video_type: video.type.toLowerCase() as VideoType,
          video_site: video.site.toLowerCase() as VideoSite,
          external_key: video.key,
          title: video.name || null,
          published_at: publishedDate,
          is_official: video.official || false
        })
        
        log(`✅ Added video: ${video.name} (${video.type} from ${video.site})`, '')
      } catch (error) {
        logError(`❌ Failed to add video: ${video.name} - ${error}`, '')
      }
    }
  }
  
  /**
   * Sincronizar watch providers
   */
  private static async syncWatchProviders(mediaId: string, providers: any, request: SyncMoviesRequest): Promise<void> {
    await supabase.from('media_watch_providers').delete().eq('media_id', mediaId)
    
    const providerRegions = request.providerRegions || DEFAULT_PROVIDER_REGIONS
    
    for (const region of providerRegions) {
      const regionData = providers.results?.[region]
      if (!regionData) continue
      
      const allProviders = [
        ...(regionData.flatrate || []),
        ...(regionData.rent || []),
        ...(regionData.buy || [])
      ]
      
      for (const provider of allProviders) {
        // Buscar o crear plataforma
        let platformData: { id: string } | null = null
        
        const { data: existing } = await supabase
          .from('platforms')
          .select('id')
          .eq('tmdb_provider_id', provider.provider_id)
          .single()
        
        if (existing) {
          platformData = existing
        } else {
          const { data: created } = await supabase
            .from('platforms')
            .insert({
              tmdb_provider_id: provider.provider_id,
              name: `Provider ${provider.provider_id}`,
              slug: this.generateSlug(`provider-${provider.provider_id}`),
              platform_type: 'streaming',
              is_active: true
            })
            .select('id')
            .single()
          platformData = created
        }
        
        if (!platformData) continue
        
        const isStreaming = regionData.flatrate?.some((p: any) => p.provider_id === provider.provider_id) || false
        const isRent = regionData.rent?.some((p: any) => p.provider_id === provider.provider_id) || false
        const isBuy = regionData.buy?.some((p: any) => p.provider_id === provider.provider_id) || false
        
        await supabase.from('media_watch_providers').insert({
          media_id: mediaId,
          platform_id: platformData.id,
          region_code: region,
          is_streaming: isStreaming,
          is_rent: isRent,
          is_buy: isBuy,
          rent_price_usd: null,
          buy_price_usd: null,
          watch_url: regionData.link || null,
          affiliate_url: null,
          tmdb_synced_at: new Date().toISOString(),
          verified_at: null
        })
      }
    }
  }
}
