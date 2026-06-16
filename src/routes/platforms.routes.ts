import { Hono } from "hono"

import { PlatformsController } from "@/controllers/platfroms.conroller"
import { createAuthMiddleware } from "@/utils"

export const platformsRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
platformsRoutes.use('/admin/*', createAuthMiddleware('admin'))

// GET /admin/platforms
platformsRoutes.get('/admin', PlatformsController.adminList)

// POST /admin/platforms
platformsRoutes.post('/admin', PlatformsController.create)

// PATCH /admin/platforms/:id
platformsRoutes.patch('/admin/:id', PlatformsController.update)

// DELETE /admin/platforms/:id
platformsRoutes.delete('/admin/:id', PlatformsController.remove)

// POST /admin/media/:mediaId/providers/sync
platformsRoutes.post('/admin/media/:mediaId/providers/sync', PlatformsController.syncProviders)

// PATCH /admin/providers/:id/affiliate
platformsRoutes.patch('/admin/providers/:id/affiliate', PlatformsController.updateAffiliate)

// PATCH /admin/providers/:id/watch-url
platformsRoutes.patch('/admin/providers/:id/watch-url', PlatformsController.updateWatchUrl)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /platforms
platformsRoutes.get('/', PlatformsController.list)

// GET /platforms/:slug (must be last to avoid conflicts)
platformsRoutes.get('/:slug', PlatformsController.getBySlug)
