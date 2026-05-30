import { Context } from 'hono'

import { supabase } from '@/config/supabase'
import { SyncMoviesService } from '@/services/sync.service'
import {
  RECOMMENDED_GENRES,
  DEFAULT_CREW_JOBS,
  DEFAULT_VIDEO_TYPES,
  DEFAULT_VIDEO_SITES,
  DEFAULT_PROVIDER_REGIONS
} from '@/types/sync.type'
import { ok, serverError, notFound } from '@/utils'

export const SyncController = {
  
  /**
   * POST /admin/sync/movies/start
   * Iniciar una nueva sincronización de películas
   */
  async start(c: Context) {
    try {
      const validatedData = await c.req.json()
      
      // Validaciones adicionales
      if (validatedData.allowedGenres?.length === 0) {
        return c.json({
          success: false,
          error: 'Si especificas allowedGenres, debe contener al menos un género'
        }, 400)
      }
      
      if (validatedData.releaseYearStart && validatedData.releaseYearEnd && 
          validatedData.releaseYearStart > validatedData.releaseYearEnd) {
        return c.json({
          success: false,
          error: 'releaseYearStart no puede ser mayor que releaseYearEnd'
        }, 400)
      }
      
      // Iniciar sincronización
      const jobId = await SyncMoviesService.startSync(validatedData)
      
      return ok(c, {
        jobId,
        message: 'Sincronización iniciada',
        config: validatedData
      }, 202)
      
    } catch (error) {
      return serverError(c, error)
    }
  },
  
  /**
   * GET /admin/sync/movies/:jobId/status
   * Obtener estado de un job de sincronización
   */
  async getStatus(c: Context) {
    try {
      const { jobId } = c.req.param()
      
      if (!jobId) {
        return c.json({
          success: false,
          error: 'Job ID es requerido'
        }, 400)
      }
      
      const jobStatus = SyncMoviesService.getJobStatus(jobId)
      
      if (!jobStatus) {
        return c.json({
          success: false,
          error: `Job no encontrado: ${jobId}`,
          availableJobs: SyncMoviesService.getActiveJobs().map(id => ({ jobId: id }))
        }, 404)
      }
      
      // Determinar estado
      let status: 'running' | 'completed' | 'failed' | 'stopped' = 'running'
      if (!jobStatus.isRunning) {
        status = jobStatus.isStopped ? 'stopped' : 'completed'
      }
      
      const elapsedTime = Date.now() - jobStatus.startedAt
      
      const response = {
        success: true,
        jobId,
        status,
        isRunning: jobStatus.isRunning,
        isPaused: jobStatus.isPaused,
        isStopped: jobStatus.isStopped,
        startedAt: jobStatus.startedAt,
        elapsedTime,
        totalMovies: jobStatus.totalMovies,
        currentMovieIndex: jobStatus.currentMovieIndex,
        processed: jobStatus.processed,
        errors: jobStatus.errors,
        skipped: jobStatus.skipped,
        updated: jobStatus.updated,
        new: jobStatus.new,
        progress: jobStatus.progress,
        results: jobStatus.isRunning ? undefined : jobStatus.results,
        lastUpdated: Date.now()
      }
      
      return c.json(response)
      
    } catch (error) {
      console.error('[SyncController] GetStatus error:', error)
      return c.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }, 500)
    }
  },
  
  /**
   * POST /admin/sync/movies/:jobId/pause
   * Pausar un job de sincronización
   */
  async pause(c: Context) {
    try {
      const { jobId } = c.req.param()
      
      if (!jobId) {
        return notFound(c, 'Job ID es requerido')
      }
      
      const success = SyncMoviesService.pauseJob(jobId)
      
      if (!success) {
        return c.json({
          success: false,
          error: 'No se pudo pausar el job (puede que no exista o ya no esté corriendo)'
        }, 400)
      }
      
      return ok(c, { jobId, message: 'Job pausado' })
      
    } catch (error) {
      return serverError(c, error)
    }
  },
  
  /**
   * POST /admin/sync/movies/:jobId/resume
   * Reanudar un job de sincronización
   */
  async resume(c: Context) {
    try {
      const { jobId } = c.req.param()
      
      if (!jobId) {
        return notFound(c, 'Job ID es requerido')
      }
      
      const success = SyncMoviesService.resumeJob(jobId)
      
      if (!success) {
        return c.json({
          success: false,
          error: 'No se pudo reanudar el job (puede que no exista o no esté pausado)'
        }, 400)
      }
      
      return ok(c, { jobId, message: 'Job reanudado' })
      
    } catch (error) {
      return serverError(c, error)
    }
  },
  
  /**
   * POST /admin/sync/movies/:jobId/stop
   * Detener un job de sincronización
   */
  async stop(c: Context) {
    try {
      const { jobId } = c.req.param()
      
      if (!jobId) {
        return notFound(c, 'Job ID es requerido')
      }
      
      const success = SyncMoviesService.stopJob(jobId)
      
      if (!success) {
        return c.json({
          success: false,
          error: 'No se pudo detener el job (puede que no exista)'
        }, 400)
      }
      
      return ok(c, { jobId, message: 'Job detenido' })
      
    } catch (error) {
      return serverError(c, error)
    }
  },
  
  /**
   * GET /admin/sync/movies/active
   * Listar todos los jobs activos
   */
  async listActive(c: Context) {
    try {
      const activeJobs = SyncMoviesService.getActiveJobs()
      const jobDetails = activeJobs.map(jobId => {
        const status = SyncMoviesService.getJobStatus(jobId)
        return {
          jobId,
          isRunning: status?.isRunning || false,
          isPaused: status?.isPaused || false,
          isStopped: status?.isStopped || false,
          startedAt: status?.startedAt || 0,
          processed: status?.processed || 0,
          errors: status?.errors || 0,
          totalMovies: status?.totalMovies || 0,
          currentMovie: status?.progress?.currentMovie || null
        }
      })
      
      return c.json({
        success: true,
        activeJobs: jobDetails,
        totalActive: activeJobs.length
      })
      
    } catch (error) {
      console.error('[SyncController] ListActive error:', error)
      return c.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }, 500)
    }
  },
  
  /**
   * GET /admin/sync/movies/config
   * Obtener configuración recomendada y géneros disponibles
   */
  async getConfig(c: Context) {
    try {
      return ok(c, {
        recommendedGenres: RECOMMENDED_GENRES,
        defaultCrewJobs: DEFAULT_CREW_JOBS,
        defaultVideoTypes: DEFAULT_VIDEO_TYPES,
        defaultVideoSites: DEFAULT_VIDEO_SITES,
        defaultProviderRegions: DEFAULT_PROVIDER_REGIONS,
        
        // Ejemplos de configuración predefinida
        presets: {
          // Alta calidad - solo películas populares y bien valoradas
          highQuality: {
            movieCount: 50,
            minVoteAverage: 7.0,
            minVoteCount: 1000,
            minPopularity: 20,
            requireSpanishVersion: true,
            maxCast: 20,
            maxCrew: 20,
            defaultStatus: 'published',
            defaultNoindex: false,
            delayBetweenMovies: 1000
          },
          
          // Rápido y masivo - muchas películas sin filtros estrictos
          bulkImport: {
            movieCount: 200,
            searchStrategy: 'multiple_searches',
            maxPagesToSearch: 20,
            minVoteAverage: 5.0,
            requireSpanishVersion: false,
            maxCast: 10,
            maxCrew: 10,
            defaultStatus: 'draft',
            delayBetweenMovies: 200
          },
          
          // SEO optimizado - géneros populares con contenido completo
          seoOptimized: {
            movieCount: 100,
            allowedGenres: [28, 12, 16, 35, 18, 14, 878], // Acción, Aventura, Animación, Comedia, Drama, Fantasía, Sci-Fi
            requireSpanishVersion: true,
            requireEnglishVersion: true,
            syncVideos: true,
            syncWatchProviders: true,
            maxCast: 15,
            maxCrew: 15,
            defaultStatus: 'published',
            defaultNoindex: false,
            includeOfficialVideosOnly: true
          },
          
          // Contenido familiar - seguro para todos los públicos
          familyFriendly: {
            movieCount: 75,
            includeAdult: false,
            allowedGenres: [16, 10751, 12, 14], // Animación, Familia, Aventura, Fantasía
            minVoteAverage: 6.0,
            requireSpanishVersion: true,
            maxCast: 15,
            defaultStatus: 'published',
            defaultNoindex: false
          }
        }
      })
      
    } catch (error) {
      return serverError(c, error)
    }
  },
  
  /**
   * DELETE /admin/sync/movies/cleanup
   * Limpiar jobs completados antiguos
   */
  async cleanup(c: Context) {
    try {
      SyncMoviesService.cleanupCompletedJobs()
      
      return ok(c, {
        message: 'Limpieza de jobs completados realizada'
      })
      
    } catch (error) {
      return serverError(c, error)
    }
  },

  /**
   * GET /admin/sync/movies/recent
   * Obtener últimas películas sincronizadas
   */
  async getRecentSynced(c: Context) {
    try {
      const { page = '1', limit = '10' } = c.req.query()
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)

      const { data, error } = await supabase
        .from('media')
        .select('id, tmdb_id, original_title, title_es, release_date, tmdb_popularity, poster_path, status, tmdb_last_synced_at')
        .eq('media_type', 'movie')
        .order('tmdb_last_synced_at', { ascending: false })
        .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)

      if (error) {
        return serverError(c, error)
      }

      const { count } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'movie')

      return ok(c, {
        movies: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      })
    } catch (error) {
      return serverError(c, error)
    }
  }
}
