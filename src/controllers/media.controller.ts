import { ContentStatus, MediaType } from '@/enums'
import { MediaService } from '@/services/media.service'
import { notFound, ok, paginated, serverError } from '@/utils'
import type { Context } from 'hono'

export const MediaController = {
    // Get /media
    async list(c: Context) {
        try {
            const page = Number(c.req.query('page') ?? 1)
            const per_page = Number(c.req.query('per_page') ?? 20)
            const media_type = c.req.query('media_type') as MediaType | undefined
            const sort_by = (c.req.query('sort_by') as 'tmdb_popularity' | 'release_date' | 'editorial_rating' | undefined) ?? 'tmdb_popularity'
            const sort_order = (c.req.query('sort_order') as 'asc' | 'desc' | undefined) ?? 'desc'
            const status = c.req.query('status') as ContentStatus | undefined ?? 'published'

            const filters: any = { page, per_page, sort_by, sort_order, status }
            if (media_type) filters.media_type = media_type

            const { data, total } = await MediaService.findAll(filters)
            return paginated(c, data, total, page, per_page)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /media/:slug
    async getBySlug(c: Context) {
        try {
            const { slug } = c.req.param()
            if (!slug) return notFound(c, 'Película/Serie')
            const region = (c.req.query('region') as string | undefined) ?? 'ES'
            const media = await MediaService.findBySlugFull(slug, region)
            if (!media) return notFound(c, 'Película/Serie')
            return ok(c, media)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /media/genre/:genreSlug
    async listByGenre(c: Context) {
        try {
            const { genreSlug } = c.req.param()
            if (!genreSlug) return notFound(c, 'Género')
            const page = Number(c.req.query('page') ?? 1)
            const per_page = Number(c.req.query('per_page') ?? 20)
            const { data, total } = await MediaService.findByGenre(genreSlug, page, per_page)
            return paginated(c, data, total, page, per_page)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /search?q=batman
    async search(c: Context) {
        try {
            const q = c.req.query('q') ?? ''
            const limit = Number(c.req.query('limit') ?? 10)
            if (!q.trim()) return ok(c, [])
            const results = await MediaService.search(q, limit)
            return ok(c, results)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    // GET /admin/media
    async adminList(c: Context) {
        try {
            const page = Number(c.req.query('page') ?? 1)
            const per_page = Number(c.req.query('per_page') ?? 20)
            const status = c.req.query('status') as ContentStatus | undefined
            const noindex = c.req.query('noindex') !== undefined
                ? c.req.query('noindex') === 'true'
                : undefined
            const search = c.req.query('search') as string | undefined
            const genre_id = c.req.query('genre_id') ? Number(c.req.query('genre_id')) : undefined
            const media_type = c.req.query('media_type') as string | undefined
            const sort_by = c.req.query('sort_by') as string | undefined
            const sort_order = c.req.query('sort_order') as string | undefined

            const filters: any = { page, per_page }
            if (status !== undefined) filters.status = status
            if (noindex !== undefined) filters.noindex = noindex
            if (search !== undefined) filters.search = search
            if (genre_id !== undefined) filters.genre_id = genre_id
            if (media_type !== undefined) filters.media_type = media_type
            if (sort_by !== undefined) filters.sort_by = sort_by
            if (sort_order !== undefined) filters.sort_order = sort_order

            const { data, total } = await MediaService.findAll(filters)
            return paginated(c, data, total, page, per_page)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /admin/media/:id
    async adminGetById(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            const media = await MediaService.findById(id)
            if (!media) return notFound(c, 'Película/Serie')
            return ok(c, media)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // PATCH /admin/media/:id  — solo campos editoriales y de estado
    async updateEditorial(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            const body = await c.req.json()
            const media = await MediaService.updateEditorial(id, body)
            if (!media) return notFound(c, 'Película/Serie')
            return ok(c, media)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // PATCH /admin/media/:id/patch  — actualización parcial de cualquier campo individual
    async patch(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            const body = await c.req.json()
            const media = await MediaService.patch(id, body)
            if (!media) return notFound(c, 'Película/Serie')
            return ok(c, media)
        } catch (err) {
            return serverError(c, err)
        }
    },

    // DELETE /admin/media/:id
    async remove(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            await MediaService.remove(id)
            return ok(c, { message: 'Eliminado correctamente' })
        } catch (err) {
            return serverError(c, err)
        }
    },

    // POST /admin/media/:id/genres  — sincronizar géneros de una película
    async syncGenres(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            const { genre_ids } = await c.req.json()
            await MediaService.syncGenres(id, genre_ids)
            return ok(c, { message: 'Géneros sincronizados' })
        } catch (err) {
            return serverError(c, err)
        }
    },

    // POST /admin/media/:id/videos  — sincronizar videos de una película
    async syncVideos(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')
            const { videos } = await c.req.json()
            await MediaService.syncVideos(id, videos)
            return ok(c, { message: 'Videos sincronizados' })
        } catch (err) {
            return serverError(c, err)
        }
    },
}