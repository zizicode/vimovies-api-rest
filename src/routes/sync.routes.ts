import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { SyncController } from '@/controllers/sync.controller'
import { createAuthMiddleware } from '@/utils/auth.utils'

export const syncRoutes = new Hono()

// Aplicar middleware de autenticación a todas las rutas de sincronización
syncRoutes.use('*', createAuthMiddleware('admin'))

// Validación para iniciar sincronización
const startSyncSchema = z.object({
  movieCount: z.number().min(1).max(1000).default(20),
  searchStrategy: z.enum(['single_search', 'multiple_searches']).default('multiple_searches'),
  
  // Filtros de calidad
  minVoteAverage: z.number().min(0).max(10).optional(),
  minVoteCount: z.number().min(0).optional(),
  minPopularity: z.number().min(0).optional(),
  
  // Filtros de contenido
  includeAdult: z.boolean().default(false),
  originalLanguage: z.string().length(2).optional(),
  releaseYearStart: z.number().min(1900).max(new Date().getFullYear() + 5).optional(),
  releaseYearEnd: z.number().min(1900).max(new Date().getFullYear() + 5).optional(),
  
  // Géneros
  allowedGenres: z.array(z.number()).optional(),
  requireAllGenres: z.boolean().default(false),
  
  // Idiomas requeridos
  requireSpanishVersion: z.boolean().default(true),
  requireEnglishVersion: z.boolean().default(false),
  
  // Límites de relaciones
  maxCast: z.number().min(0).max(100).default(15),
  maxCrew: z.number().min(0).max(100).default(15),
  crewJobs: z.array(z.string()).default([
    'Director', 'Screenplay', 'Story', 'Producer', 'Executive Producer',
    'Original Music Composer', 'Director of Photography', 'Editor',
    'Production Design', 'Art Direction', 'Set Decoration',
    'Costume Design', 'Sound', 'Visual Effects'
  ]),
  
  // Videos y plataformas
  syncVideos: z.boolean().default(true),
  videoTypes: z.array(z.enum(['Trailer', 'Teaser', 'Clip', 'Featurette', 'BehindTheScenes', 'Bloopers'])).default(['Trailer', 'Teaser', 'Clip', 'Featurette', 'BehindTheScenes']),
  includeOfficialVideosOnly: z.boolean().default(false),
  videoSites: z.array(z.enum(['YouTube', 'Vimeo'])).default(['YouTube']),
  
  syncWatchProviders: z.boolean().default(true),
  providerRegions: z.array(z.string().length(2)).default(['ES', 'MX', 'AR', 'CO', 'US']),
  
  // Control de existentes
  updateExisting: z.boolean().default(true),
  preserveEditorial: z.boolean().default(true),
  preserveSeo: z.boolean().default(true),
  
  // Configuración por defecto
  defaultStatus: z.enum(['draft', 'published', 'archived']).default('draft'),
  defaultNoindex: z.boolean().default(true),
  defaultSitemapPriority: z.enum(['high', 'medium', 'low', 'minimal']).default('medium'),
  
  // Control de sincronización
  delayBetweenMovies: z.number().min(0).max(10000).default(500),
  maxPagesToSearch: z.number().min(1).max(50).default(10)
})

// POST /admin/sync/movies/start - Iniciar nueva sincronización
syncRoutes.post('/movies/start', zValidator('json', startSyncSchema), SyncController.start)

// GET /admin/sync/movies/:jobId/status - Obtener estado de job
syncRoutes.get('/movies/:jobId/status', SyncController.getStatus)

// POST /admin/sync/movies/:jobId/pause - Pausar job
syncRoutes.post('/movies/:jobId/pause', SyncController.pause)

// POST /admin/sync/movies/:jobId/resume - Reanudar job
syncRoutes.post('/movies/:jobId/resume', SyncController.resume)

// POST /admin/sync/movies/:jobId/stop - Detener job
syncRoutes.post('/movies/:jobId/stop', SyncController.stop)

// GET /admin/sync/movies/active - Listar jobs activos
syncRoutes.get('/movies/active', SyncController.listActive)

// GET /admin/sync/movies/config - Obtener configuración recomendada
syncRoutes.get('/movies/config', SyncController.getConfig)

// DELETE /admin/sync/movies/cleanup - Limpiar jobs completados
syncRoutes.delete('/movies/cleanup', SyncController.cleanup)

// GET /admin/sync/movies/recent - Obtener últimas películas sincronizadas
syncRoutes.get('/movies/recent', SyncController.getRecentSynced)
