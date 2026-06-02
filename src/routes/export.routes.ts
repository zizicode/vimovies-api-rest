import { Hono } from 'hono'
import { ExportMoviesController } from '@/controllers/export-movies.controller'
import { createAuthMiddleware } from '@/utils/auth.utils'

export const exportRoutes = new Hono()

// Aplicar middleware de autenticación a todas las rutas de exportación
exportRoutes.use('*', createAuthMiddleware('admin'))

/**
 * POST /admin/export/movies
 * Exportar películas de TMDB en ambos idiomas a un archivo JSON
 */
exportRoutes.post('/movies', ExportMoviesController.exportMovies)
