import { Context } from "hono"

import { MediaCreditsService } from "@/services/media-credit.service"
import { notFound, ok, serverError } from "@/utils"

export const MediaCreditsController = {
  /**
   * GET /admin/media/:id/credits
   * Obtiene los créditos de una película
   */
  async getCredits(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const credits = await MediaCreditsService.getCredits(id)
      return ok(c, credits)
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * POST /admin/media/:id/credits
   * Agrega un crédito a una película
   */
  async addCredit(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const credit = await c.req.json()
      await MediaCreditsService.addCredit(id, credit)
      return ok(c, { message: 'Crédito agregado' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * DELETE /admin/media/credits/:creditId
   * Elimina un crédito de una película
   */
  async removeCredit(c: Context) {
    try {
      const { creditId } = c.req.param()
      if (!creditId) return serverError(c, new Error('ID de crédito no proporcionado'))
      await MediaCreditsService.removeCredit(creditId)
      return ok(c, { message: 'Crédito eliminado' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * PATCH /admin/media/credits/:creditId/order
   * Actualiza el orden de un crédito
   */
  async updateCreditOrder(c: Context) {
    try {
      const { creditId } = c.req.param()
      if (!creditId) return serverError(c, new Error('ID de crédito no proporcionado'))
      const { cast_order } = await c.req.json()
      await MediaCreditsService.updateCreditOrder(creditId, cast_order)
      return ok(c, { message: 'Orden actualizado' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
