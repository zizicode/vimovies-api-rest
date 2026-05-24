import { ArticlesController } from "@/controllers/articles.controller"
import { createAuthMiddleware } from "@/utils"
import { Hono } from "hono"

export const articlesRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
articlesRoutes.use('/admin/*', createAuthMiddleware('admin'))

// GET /admin/articles/tags (must be before /:id to avoid conflicts)
articlesRoutes.get('/admin/tags', ArticlesController.getAllTags)

// POST /admin/articles/tags/seed
articlesRoutes.post('/admin/tags/seed', ArticlesController.seedTags)

// GET /admin/articles
articlesRoutes.get('/admin', ArticlesController.adminList)

// GET /admin/articles/:id
articlesRoutes.get('/admin/:id', ArticlesController.adminGetById)

// POST /admin/articles
articlesRoutes.post('/admin', ArticlesController.create)

// PATCH /admin/articles/:id
articlesRoutes.patch('/admin/:id', ArticlesController.update)

// POST /admin/articles/:id/publish
articlesRoutes.post('/admin/:id/publish', ArticlesController.publish)

// POST /admin/articles/:id/archive
articlesRoutes.post('/admin/:id/archive', ArticlesController.archive)

// DELETE /admin/articles/:id
articlesRoutes.delete('/admin/:id', ArticlesController.remove)

// POST /admin/articles/:id/faqs
articlesRoutes.post('/admin/:id/faqs', ArticlesController.createFAQ)

// PATCH /admin/faqs/:id
articlesRoutes.patch('/admin/faqs/:id', ArticlesController.updateFAQ)

// DELETE /admin/faqs/:id
articlesRoutes.delete('/admin/faqs/:id', ArticlesController.deleteFAQ)

// PUT /admin/articles/:id/mentions
articlesRoutes.put('/admin/:id/mentions', ArticlesController.syncMentions)

// PUT /admin/articles/:id/tags
articlesRoutes.put('/admin/:id/tags', ArticlesController.syncTags)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /articles
articlesRoutes.get('/', ArticlesController.list)

// GET /articles/:slug (must be last to avoid conflicts)
articlesRoutes.get('/:slug', ArticlesController.getBySlug)
