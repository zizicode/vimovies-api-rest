import { CuratedListsService } from "@/services/curated-list.service"
import { notFound, ok, paginated, serverError } from "@/utils"
import { Context } from "hono"

export const CuratedListsController = {

  // GET /lists
  async list(c: Context) {
    try {
      const page     = Number(c.req.query('page')     ?? 1)
      const per_page = Number(c.req.query('per_page') ?? 20)
      const { data, total } = await CuratedListsService.findAll(page, per_page)
      return paginated(c, data, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /lists/:slug
  async getBySlug(c: Context) {
    try {
      const { slug } = c.req.param()
      if (!slug) return notFound(c, 'Lista')
      const list     = await CuratedListsService.findBySlug(slug)
      if (!list) return notFound(c, 'Lista')
      return ok(c, list)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  // POST /admin/lists
  async create(c: Context) {
    try {
      const body = await c.req.json()
      const list = await CuratedListsService.create(body)
      return ok(c, list, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/lists/:id
  async update(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Lista')
      const body   = await c.req.json()
      const list   = await CuratedListsService.update(id, body)
      if (!list) return notFound(c, 'Lista')
      return ok(c, list)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/lists/:id
  async remove(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Lista')
      await CuratedListsService.remove(id)
      return ok(c, { message: 'Lista eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PUT /admin/lists/:id/items  — reemplaza todos (drag & drop)
  async syncItems(c: Context) {
    try {
      const { id }    = c.req.param()
      if (!id) return notFound(c, 'Lista')
      const { items } = await c.req.json()
      await CuratedListsService.syncItems(id, items)
      return ok(c, { message: 'Items sincronizados' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/lists/:id/items
  async addItem(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Lista')
      const body   = await c.req.json()
      const item   = await CuratedListsService.addItem(id, body)
      return ok(c, item, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/lists/:id/items/:mediaId
  async removeItem(c: Context) {
    try {
      const { id, mediaId } = c.req.param()
      if (!id || !mediaId) return notFound(c, 'Lista')
      await CuratedListsService.removeItem(id, mediaId)
      return ok(c, { message: 'Item eliminado de la lista' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
