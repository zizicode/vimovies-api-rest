import { Hono } from "hono"

import { CuratedListsController } from "@/controllers/curated-list.controller"
import { createAuthMiddleware } from "@/utils"

export const curatedListsRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
curatedListsRoutes.use('/admin/*', createAuthMiddleware('admin'))

// POST /admin/lists
curatedListsRoutes.post('/admin', CuratedListsController.create)

// PATCH /admin/lists/:id
curatedListsRoutes.patch('/admin/:id', CuratedListsController.update)

// DELETE /admin/lists/:id
curatedListsRoutes.delete('/admin/:id', CuratedListsController.remove)

// PUT /admin/lists/:id/items
curatedListsRoutes.put('/admin/:id/items', CuratedListsController.syncItems)

// POST /admin/lists/:id/items
curatedListsRoutes.post('/admin/:id/items', CuratedListsController.addItem)

// DELETE /admin/lists/:id/items/:mediaId
curatedListsRoutes.delete('/admin/:id/items/:mediaId', CuratedListsController.removeItem)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /lists
curatedListsRoutes.get('/', CuratedListsController.list)

// GET /lists/:slug (must be last to avoid conflicts)
curatedListsRoutes.get('/:slug', CuratedListsController.getBySlug)
