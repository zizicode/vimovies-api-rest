import { MediaController } from '@/controllers/media.controller'
import { createAuthMiddleware } from '@/utils/auth.utils'
import { Hono } from 'hono'
export const mediaRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
mediaRoutes.use('/admin/*', createAuthMiddleware('admin'))

// GET /admin/media
mediaRoutes.get('/admin', MediaController.adminList)

// GET /admin/media/:id
mediaRoutes.get('/admin/:id', MediaController.adminGetById)

// PATCH /admin/media/:id
mediaRoutes.patch('/admin/:id', MediaController.updateEditorial)

// PATCH /admin/media/:id/patch  — actualización parcial de cualquier campo individual
mediaRoutes.patch('/admin/:id/patch', MediaController.patch)

// DELETE /admin/media/:id
mediaRoutes.delete('/admin/:id', MediaController.remove)

// POST /admin/media/:id/genres
mediaRoutes.post('/admin/:id/genres', MediaController.syncGenres)

// POST /admin/media/:id/videos
mediaRoutes.post('/admin/:id/videos', MediaController.syncVideos)

// GET /admin/media/:id/videos/list
// mediaRoutes.get('/admin/:id/videos/list', MediaVideosController.getVideos)

// // POST /admin/media/:id/videos/single
// mediaRoutes.post('/admin/:id/videos/single', MediaVideosController.addVideo)

// // DELETE /admin/media/:id/videos/:videoId
// mediaRoutes.delete('/admin/:id/videos/:videoId', MediaVideosController.removeVideo)

// // PATCH /admin/media/:id/videos/:videoId
// mediaRoutes.patch('/admin/:id/videos/:videoId', MediaVideosController.updateVideo)

// // GET /admin/media/:id/credits
// mediaRoutes.get('/admin/:id/credits', MediaCreditsController.getCredits)

// // POST /admin/media/:id/credits
// mediaRoutes.post('/admin/:id/credits', MediaCreditsController.addCredit)

// // DELETE /admin/media/:id/credits/:creditId
// mediaRoutes.delete('/admin/:id/credits/:creditId', MediaCreditsController.removeCredit)

// // PATCH /admin/media/:id/credits/:creditId/order
// mediaRoutes.patch('/admin/:id/credits/:creditId/order', MediaCreditsController.updateCreditOrder)

// // GET /admin/media/:id/providers
// mediaRoutes.get('/admin/:id/providers', MediaWatchProvidersController.getProviders)

// // POST /admin/media/:id/providers
// mediaRoutes.post('/admin/:id/providers', MediaWatchProvidersController.addProvider)

// // DELETE /admin/media/:id/providers/:providerId
// mediaRoutes.delete('/admin/:id/providers/:providerId', MediaWatchProvidersController.removeProvider)

// // PATCH /admin/media/:id/providers/:providerId
// mediaRoutes.patch('/admin/:id/providers/:providerId', MediaWatchProvidersController.updateProvider)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /media
mediaRoutes.get('/', MediaController.list)

// GET /search?q=batman
mediaRoutes.get('/search', MediaController.search)

// GET /media/genre/:genreSlug
mediaRoutes.get('/genre/:genreSlug', MediaController.listByGenre)

// GET /media/:slug (must be last to avoid conflicts)
mediaRoutes.get('/:slug', MediaController.getBySlug)
