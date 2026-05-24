import { MediaWatchProvidersService } from "@/services/media-watch-providers.service"
import { notFound, ok, serverError } from "@/utils"
import { Context } from "hono"

export const MediaWatchProvidersController = {
  /**
   * GET /admin/media/:id/providers
   * Obtiene los watch providers de una película
   */
  async getProviders(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const region = c.req.query('region')
      const providers = await MediaWatchProvidersService.getWatchProviders(id, region)
      return ok(c, providers)
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * POST /admin/media/:id/providers
   * Agrega un watch provider a una película
   */
  async addProvider(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const provider = await c.req.json()
      await MediaWatchProvidersService.addWatchProvider(id, provider)
      return ok(c, { message: 'Plataforma agregada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * DELETE /admin/media/providers/:providerId
   * Elimina un watch provider de una película
   */
  async removeProvider(c: Context) {
    try {
      const { providerId } = c.req.param()
      if (!providerId) return serverError(c, new Error('ID de provider no proporcionado'))
      await MediaWatchProvidersService.removeWatchProvider(providerId)
      return ok(c, { message: 'Plataforma eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * PATCH /admin/media/providers/:providerId
   * Actualiza un watch provider
   */
  async updateProvider(c: Context) {
    try {
      const { providerId } = c.req.param()
      if (!providerId) return serverError(c, new Error('ID de provider no proporcionado'))
      const updates = await c.req.json()
      await MediaWatchProvidersService.updateWatchProvider(providerId, updates)
      return ok(c, { message: 'Plataforma actualizada' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
