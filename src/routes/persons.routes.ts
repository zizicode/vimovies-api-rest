import { Hono } from "hono"

import { PeopleController } from "@/controllers/person.controller"
import { createAuthMiddleware } from "@/utils"

export const peopleRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
peopleRoutes.use('/admin/*', createAuthMiddleware('admin'))

// GET /admin/people
peopleRoutes.get('/admin', PeopleController.adminList)

// GET /admin/people/:id
peopleRoutes.get('/admin/:id', PeopleController.adminGetById)

// PATCH /admin/people/:id
peopleRoutes.patch('/admin/:id', PeopleController.update)

// DELETE /admin/people/:id
peopleRoutes.delete('/admin/:id', PeopleController.remove)

// ── Public Routes ────────────────────────────────────────────────────────

// GET /people — Listado público para sitemap
peopleRoutes.get('/', PeopleController.list)

// GET /people/search
peopleRoutes.get('/search', PeopleController.search)

// GET /people/:slug (must be last to avoid conflicts)
peopleRoutes.get('/:slug', PeopleController.getBySlug)
