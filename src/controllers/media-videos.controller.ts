import { Context } from "hono"

import { MediaVideosService } from "@/services/media-videos.service"
import { notFound, ok, serverError } from "@/utils"

export const MediaVideosController = {
  /**
   * GET /admin/media/:id/videos
   * Obtiene los videos de una película
   */
  async getVideos(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const videos = await MediaVideosService.getVideos(id)
      return ok(c, videos)
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * POST /admin/media/:id/videos/single
   * Agrega un video a una película
   */
  async addVideo(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Película/Serie')
      const video = await c.req.json()
      await MediaVideosService.addVideo(id, video)
      return ok(c, { message: 'Video agregado' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * DELETE /admin/media/videos/:videoId
   * Elimina un video de una película
   */
  async removeVideo(c: Context) {
    try {
      const { videoId } = c.req.param()
      if (!videoId) return serverError(c, new Error('ID de video no proporcionado'))
      await MediaVideosService.removeVideo(videoId)
      return ok(c, { message: 'Video eliminado' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * PATCH /admin/media/videos/:videoId
   * Actualiza un video
   */
  async updateVideo(c: Context) {
    try {
      const { videoId } = c.req.param()
      if (!videoId) return serverError(c, new Error('ID de video no proporcionado'))
      const updates = await c.req.json()
      await MediaVideosService.updateVideo(videoId, updates)
      return ok(c, { message: 'Video actualizado' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
