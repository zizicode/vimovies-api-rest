import { PlatformsService } from "@/services/platfroms.service"
import { notFound, ok, serverError } from "@/utils"
import { Context } from "hono"

export const PlatformsController = {

  // GET /platforms
  async list(c: Context) {
    try {
      const data = await PlatformsService.findAll(true)
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /platforms/:slug
  async getBySlug(c: Context) {
    try {
      const { slug } = c.req.param()
      if (!slug) return notFound(c, 'Plataforma')
      const region   = c.req.query('region') ?? 'ES'
      const page     = Number(c.req.query('page')     ?? 1)
      const per_page = Number(c.req.query('per_page') ?? 20)
      const result   = await PlatformsService.findBySlugWithCatalog(slug, region, page, per_page)
      if (!result) return notFound(c, 'Plataforma')
      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  // GET /admin/platforms
  async adminList(c: Context) {
    try {
      const data = await PlatformsService.findAll(false) // incluye inactivas
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/platforms
  async create(c: Context) {
    try {
      const body     = await c.req.json()
      const platform = await PlatformsService.create(body)
      return ok(c, platform, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/platforms/:id
  async update(c: Context) {
    try {
      const id       = Number(c.req.param('id'))
      const body     = await c.req.json()
      const platform = await PlatformsService.update(id, body)
      if (!platform) return notFound(c, 'Plataforma')
      return ok(c, platform)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/platforms/:id
  async remove(c: Context) {
    try {
      const id = Number(c.req.param('id'))
      await PlatformsService.remove(id)
      return ok(c, { message: 'Plataforma eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/media/:mediaId/providers/sync
  async syncProviders(c: Context) {
    try {
      const { mediaId }  = c.req.param()
      const { providers } = await c.req.json()
      await PlatformsService.syncWatchProviders(mediaId!, providers)
      return ok(c, { message: 'Providers sincronizados' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/providers/:id/affiliate
  async updateAffiliate(c: Context) {
    try {
      const { id }          = c.req.param()
      const { affiliate_url } = await c.req.json()
      const result          = await PlatformsService.updateAffiliateUrl(id!, affiliate_url)
      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },
}
