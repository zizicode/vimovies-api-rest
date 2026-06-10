import { Context } from "hono"

import { PersonService } from "@/services/persons.service"
import { notFound, ok, paginated, serverError } from "@/utils"

export const PeopleController = {

  // GET /people/:slug
  async getBySlug(c: Context) {
    try {
      const { slug } = c.req.param()
      const result   = await PersonService.findBySlugWithFilmography(slug ?? '')
      if (!result) return notFound(c, 'Persona')
      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /people?q=nolan   — se combina con MediaController.search en el route
  async search(c: Context) {
    try {
      const q     = c.req.query('q') ?? ''
      const limit = Number(c.req.query('limit') ?? 10)
      if (!q.trim()) return ok(c, [])
      const results = await PersonService.search(q, limit)
      return ok(c, results)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /people — Listado público para sitemap
  async list(c: Context) {
    try {
      const page     = Number(c.req.query('page')     ?? 1)
      const per_page = Number(c.req.query('per_page') ?? 100)
      const { data, total } = await PersonService.findAll(page, per_page)
      // Solo devolver campos necesarios para sitemap
      const slimData = data.map(p => ({
        slug: p.slug,
        updated_at: p.updated_at
      }))
      return paginated(c, slimData, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  // GET /admin/people
  async adminList(c: Context) {
    try {
      const page     = Number(c.req.query('page')     ?? 1)
      const per_page = Number(c.req.query('per_page') ?? 20)
      const { data, total } = await PersonService.findAll(page, per_page)
      return paginated(c, data, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /admin/people/:id
  async adminGetById(c: Context) {
    try {
      const { id } = c.req.param() 
      const person = await PersonService.findById(id ?? '')
      if (!person) return notFound(c, 'Persona')
      return ok(c, person, 200, 'long')
    } catch (err) {
      console.error('Error en PeopleController.adminGetById:', err)
      return serverError(c, err)
    }
  },

  // PATCH /admin/people/:id
  async update(c: Context) {
    try {
      const { id } = c.req.param()
      
      if (!id) {
        return serverError(c, new Error('ID no proporcionado'))
      }

      let body
      try {
        body = await c.req.json()
      } catch {
        return serverError(c, new Error('JSON inválido en el cuerpo de la solicitud'))
      }

      if (!body || Object.keys(body).length === 0) {
        return serverError(c, new Error('No se proporcionaron datos para actualizar'))
      }

      const person = await PersonService.update(id, body)
      if (!person) return notFound(c, 'Persona')
      return ok(c, person, 200, 'long')
    } catch (err) {
      console.error('Error en PeopleController.update:', err)
      return serverError(c, err)
    }
  },

  // DELETE /admin/people/:id
  async remove(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) {
        return serverError(c, new Error('ID no proporcionado'))
      }
      await PersonService.remove(id)
      return ok(c, { message: 'Persona eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
