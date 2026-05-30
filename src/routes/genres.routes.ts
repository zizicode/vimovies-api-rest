import { Hono } from "hono"

import { GenresController } from "@/controllers/genres.controller"
import { createAuthMiddleware } from "@/utils"

export const genresRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
genresRoutes.use('/admin/*', createAuthMiddleware('admin'))

// POST /admin/genres
genresRoutes.post('/admin', GenresController.create)

// PATCH /admin/genres/:id
genresRoutes.patch('/admin/:id', GenresController.update)

// DELETE /admin/genres/:id
genresRoutes.delete('/admin/:id', GenresController.remove)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /genres
genresRoutes.get('/', GenresController.list)

// GET /genres/:slug/media
genresRoutes.get('/:slug/media', GenresController.getWithMedia)

// GET /genres/:slug (must be last to avoid conflicts)
genresRoutes.get('/:slug', GenresController.getBySlug)
