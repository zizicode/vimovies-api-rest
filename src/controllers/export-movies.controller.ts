import { Context } from 'hono'
import { MovieRepository } from '@/module/tmdb/repositories'
import { buildTmdbEndpoint, TmdbEndpoint } from '@/module/tmdb/tmdb.enums'
import type { MovieDetails } from '@/module/tmdb/tmdb.type'
import { ok, serverError, httpRequest } from '@/utils'
import { promises as fs } from 'fs'
import path from 'path'

interface TMDBProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

interface TMDBWatchProviderData {
  link?: string
  flatrate?: TMDBProvider[]
  rent?: TMDBProvider[]
  buy?: TMDBProvider[]
}

interface ExtendedMovieDetails extends MovieDetails {
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string; official: boolean; published_at: string; iso_639_1: string }> }
  'watch/providers'?: { results: Record<string, TMDBWatchProviderData> }
}

interface ExportRequest {
  movieCount?: number
  minVoteAverage?: number
  minVoteCount?: number
  minPopularity?: number
  includeAdult?: boolean
  originalLanguage?: string
  releaseYearStart?: number
  releaseYearEnd?: number
  allowedGenres?: number[]
  requireAllGenres?: boolean
  maxCast?: number
  maxCrew?: number
  maxWatchProviders?: number
  startPage?: number
  randomPage?: boolean
}

interface TmdbDiscoverResponse {
  page: number
  results: any[]
  total_pages: number
  total_results: number
}

interface ExportedMovie {
  tmdb_id: number
  original_title: string
  original_language: string
  release_date?: string
  runtime_minutes?: number
  tmdb_popularity?: number
  vote_average?: number
  vote_count?: number
  poster_path?: string
  backdrop_path?: string
  imdb_id?: string
  
  // Datos en español
  title_es?: string
  synopsis_es?: string
  tagline_es?: string
  
  // Datos en inglés
  title_en?: string
  synopsis_en?: string
  tagline_en?: string
  
  // Géneros
  genres?: Array<{
    id: number
    name_es: string
    name_en: string
  }>
  
  // Créditos
  credits?: {
    cast?: Array<{
      tmdb_id: number
      name: string
      character?: string
      order: number
      profile_path?: string
    }>
    crew?: Array<{
      tmdb_id: number
      name: string
      job: string
      department: string
      profile_path?: string
    }>
  }
  
  // Videos
  videos?: Array<{
    id: string
    locale: string
    video_type: string
    video_site: string
    external_key: string
    title: string
    published_at?: string
    is_official: boolean
  }>
  
  // Watch providers
  watch_providers?: Array<{
    locale: string
    provider_name: string
    provider_id: number
    provider_type: string
    link?: string
  }>
}

export const ExportMoviesController = {
  
  /**
   * POST /admin/export/movies
   * Exportar películas de TMDB en ambos idiomas a un archivo JSON
   */
  async exportMovies(c: Context) {
    try {
      const request: ExportRequest = await c.req.json()
      
      const {
        movieCount = 50,
        minVoteAverage = 0,
        minVoteCount = 0,
        minPopularity = 0,
        // includeAdult = false,
        originalLanguage,
        releaseYearStart,
        releaseYearEnd,
        allowedGenres,
        maxCast = 20,
        maxWatchProviders = 50,
        maxCrew = 15,
        startPage = 1,
        randomPage = false
      } = request
      
      console.log('[ExportMoviesController] Iniciando exportación de películas')
      console.log(`[ExportMoviesController] Cantidad: ${movieCount}`)
      console.log(`[ExportMoviesController] Min vote average: ${minVoteAverage}`)
      console.log(`[ExportMoviesController] Min vote count: ${minVoteCount}`)
      console.log(`[ExportMoviesController] Min popularity: ${minPopularity}`)
      console.log(`[ExportMoviesController] Original language: ${originalLanguage}`)
      console.log(`[ExportMoviesController] Release year: ${releaseYearStart} - ${releaseYearEnd}`)
      console.log(`[ExportMoviesController] Allowed genres: ${allowedGenres?.join(', ')}`)

      // Determinar página inicial (aleatoria o específica)
      let initialPage = startPage
      if (randomPage) {
        // Página aleatoria entre 1 y 500
        initialPage = Math.floor(Math.random() * 500) + 1
        console.log(`[ExportMoviesController] Página aleatoria: ${initialPage}`)
      } else {
        console.log(`[ExportMoviesController] Página inicial: ${initialPage}`)
      }

      // Construir parámetros para el endpoint discover de TMDB
      const discoverParams: Record<string, any> = {
        page: initialPage,
      }

      if (minVoteAverage) discoverParams['vote_average.gte'] = minVoteAverage
      if (minVoteCount) discoverParams['vote_count.gte'] = minVoteCount
      if (originalLanguage) discoverParams['with_original_language'] = originalLanguage
      if (releaseYearStart) discoverParams['primary_release_date.gte'] = `${releaseYearStart}-01-01`
      if (releaseYearEnd) discoverParams['primary_release_date.lte'] = `${releaseYearEnd}-12-31`
      if (allowedGenres && allowedGenres.length > 0) {
        discoverParams['with_genres'] = allowedGenres.join(',')
      }

      console.log('[ExportMoviesController] Parámetros TMDB:', JSON.stringify(discoverParams, null, 2))

      // Obtener películas usando el endpoint discover de TMDB
      // eslint-disable-next-line prefer-const
      let allMovies: any[] = []
      let page = initialPage
      const maxPages = initialPage + 10

      while (allMovies.length < movieCount && page <= maxPages) {
        console.log(`[ExportMoviesController] Obteniendo página ${page} de TMDB (discover)...`)
        discoverParams.page = page

        const discoverResponse = await httpRequest({
          url: buildTmdbEndpoint(TmdbEndpoint.DISCOVER_MOVIE),
          baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
          method: 'GET',
          ...(process.env.TMDB_API_KEY && { token: process.env.TMDB_API_KEY }),
          params: {
            language: 'es-ES',
            ...discoverParams,
          },
        })

        if (!discoverResponse.success || !discoverResponse.data) {
          console.error(`[ExportMoviesController] Error al obtener página ${page}`)
          console.error(`[ExportMoviesController] Response success: ${discoverResponse.success}`)
          console.error(`[ExportMoviesController] Response data:`, discoverResponse.data)
          break
        }

        const tmdbData = discoverResponse.data as TmdbDiscoverResponse
        console.log(`[ExportMoviesController] TMDB response - page: ${tmdbData.page}, total_results: ${tmdbData.total_results}, results count: ${tmdbData.results?.length || 0}`)

        const pageMovies = tmdbData.results || []
        if (pageMovies.length === 0) {
          console.log(`[ExportMoviesController] No más películas en página ${page}`)
          break
        }

        allMovies.push(...pageMovies)
        page++
      }

      console.log(`[ExportMoviesController] Total películas obtenidas: ${allMovies.length}`)

      // Aplicar filtros adicionales que no se pueden hacer en TMDB (como popularity)
      const filteredMovies = allMovies.filter(movie => {
        if (minPopularity && (movie.popularity || 0) < minPopularity) return false
        return true
      })
      
      console.log(`[ExportMoviesController] Películas después de filtros: ${filteredMovies.length}`)
      
      // Limitar a la cantidad solicitada
      const movies = filteredMovies.slice(0, movieCount)
      
      console.log(`[ExportMoviesController] Películas filtradas: ${movies.length}`)
      
      const exportedMovies: ExportedMovie[] = []
      
      // Obtener detalles completos de cada película en ambos idiomas
      for (const movie of movies) {
        console.log(`[ExportMoviesController] Procesando película: ${movie.id} - ${movie.title}`)
        
        try {
          // Obtener detalles en ambos idiomas
          const movieResponse = await MovieRepository.getById(movie.id)
          
          if (!movieResponse.success || !movieResponse.data) {
            console.error(`[ExportMoviesController] Error al obtener detalles de película ${movie.id}`)
            continue
          }
          
          const movieEs = movieResponse.data.es as ExtendedMovieDetails
          const movieEn = movieResponse.data.en as ExtendedMovieDetails
          
          // Usar datos en español como primary, fallback a inglés
          const primaryMovie = movieEs || movieEn
          if (!primaryMovie) {
            console.error(`[ExportMoviesController] No hay datos para película ${movie.id}`)
            continue
          }
          
          const exportedMovie: ExportedMovie = {
            tmdb_id: primaryMovie.id,
            original_title: primaryMovie.original_title,
            original_language: primaryMovie.original_language,
            release_date: primaryMovie.release_date,
            runtime_minutes: primaryMovie.runtime,
            tmdb_popularity: primaryMovie.popularity,
            vote_average: primaryMovie.vote_average,
            vote_count: primaryMovie.vote_count,
            poster_path: primaryMovie.poster_path ?? undefined,
            backdrop_path: primaryMovie.backdrop_path ?? undefined,
            imdb_id: primaryMovie.imdb_id ?? undefined,
            
            title_es: movieEs?.title || movieEn?.title,
            synopsis_es: movieEs?.overview || movieEn?.overview,
            tagline_es: movieEs?.tagline || movieEn?.tagline,
            
            title_en: movieEn?.title || movieEs?.title,
            synopsis_en: movieEn?.overview || movieEs?.overview,
            tagline_en: movieEn?.tagline || movieEs?.tagline,
            
            genres: primaryMovie.genres?.map(g => ({
              id: g.id,
              name_es: g.name,
              name_en: g.name
            })),
            
            credits: {
              cast: primaryMovie.credits?.cast?.slice(0, maxCast).map(c => ({
                tmdb_id: c.id,
                name: c.name,
                character: c.character,
                order: c.order,
                profile_path: c.profile_path ?? undefined
              })),
              crew: primaryMovie.credits?.crew?.slice(0, maxCrew).map(c => ({
                tmdb_id: c.id,
                name: c.name,
                job: c.job,
                department: c.department,
                profile_path: c.profile_path ?? undefined
              }))
            },
            
            videos: primaryMovie.videos?.results?.map(v => ({
              id: v.id,
              locale: v.iso_639_1 || 'en',
              video_type: v.type,
              video_site: v.site,
              external_key: v.key,
              title: v.name,
              published_at: v.published_at,
              is_official: v.official
            })),
            
            watch_providers: primaryMovie['watch/providers']?.results ? 
              Object.entries(primaryMovie['watch/providers'].results).map(([locale, data]: [string, any]) => {
                const providers = []
                if (data.flatrate) providers.push(...data.flatrate.map((p: any) => ({ ...p, provider_type: 'flatrate' })))
                if (data.rent) providers.push(...data.rent.map((p: any) => ({ ...p, provider_type: 'rent' })))
                if (data.buy) providers.push(...data.buy.map((p: any) => ({ ...p, provider_type: 'buy' })))
                return providers.map((p: any) => ({
                  locale,
                  provider_name: p.provider_name,
                  provider_id: p.provider_id,
                  provider_type: p.provider_type,
                  link: data.link
                }))
              }).flat().slice(0, maxWatchProviders) : undefined
          }
          
          exportedMovies.push(exportedMovie)
          console.log(`[ExportMoviesController] Película exportada: ${primaryMovie.title}`)
          
        } catch (error) {
          console.error(`[ExportMoviesController] Error procesando película ${movie.id}:`, error)
          continue
        }
      }
      
      console.log(`[ExportMoviesController] Total películas exportadas: ${exportedMovies.length}`)
      
      // Crear carpeta movie-bot/data/movies si no existe
      const dataDir = path.join(process.cwd(), '..', 'movie-bot', 'data', 'movies')
      await fs.mkdir(dataDir, { recursive: true })
      
      // Generar nombre de archivo con día, fecha y hora
      const now = new Date()
      const dayName = now.toLocaleDateString('es-ES', { weekday: 'long' })
      const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') || '00-00-00'
      const fileName = `${dayName}_${dateStr}_${timeStr}.json`
      const filePath = path.join(dataDir, fileName)
      
      // Guardar archivo JSON
      const exportData = {
        exported_at: now.toISOString(),
        total_movies: exportedMovies.length,
        filters: request,
        movies: exportedMovies
      }
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8')
      
      console.log(`[ExportMoviesController] Archivo guardado: ${filePath}`)
      
      return ok(c, {
        success: true,
        message: 'Películas exportadas exitosamente',
        file_path: filePath,
        file_name: fileName,
        total_movies: exportedMovies.length,
        exported_at: now.toISOString()
      })
      
    } catch (error) {
      console.error('[ExportMoviesController] Error:', error)
      return serverError(c, error)
    }
  }
}
