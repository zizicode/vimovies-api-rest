import { Context } from "hono"

import { GenreService } from "@/services/genres.service"
import { notFound, ok, paginated, serverError } from "@/utils"

export const GenresController = {

  // GET /genres
  async list(c: Context) {
    try {
      const page     = Number(c.req.query('page')     ?? 1)
      const per_page = Number(c.req.query('per_page') ?? 50)
      const { data, total } = await GenreService.findAll({ page, per_page })
      return paginated(c, data, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /genres/:slug
  async getBySlug(c: Context) {
    try {
      const { slug } = c.req.param()
      if (!slug) return notFound(c, 'Género')
      const genre = await GenreService.findBySlug(slug)
      if (!genre) return notFound(c, 'Género')
      return ok(c, genre)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /genres/:slug/media   — películas de ese género
  async getWithMedia(c: Context) {
    try {
      const { slug } = c.req.param()
      if (!slug) return notFound(c, 'Genero')
      const limit    = Number(c.req.query('limit') ?? 20)
      const result   = await GenreService.findBySlugWithMedia(slug, limit)
      if (!result) return notFound(c, 'Género')
      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/genres
  async create(c: Context) {
    try {
      const body = await c.req.json()
      const genre = await GenreService.create(body)
      return ok(c, genre, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/genres/:id
  async update(c: Context) {
    try {
      const id   = Number(c.req.param('id'))
      const body = await c.req.json()
      const genre = await GenreService.update(id, body)
      if (!genre) return notFound(c, 'Género')
      return ok(c, genre)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/genres/:id
  async remove(c: Context) {
    try {
      const id = Number(c.req.param('id'))
      await GenreService.remove(id)
      return ok(c, { message: 'Género eliminado' })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
