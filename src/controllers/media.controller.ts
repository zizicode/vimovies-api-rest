import type { Context } from 'hono'

import { ContentStatus, MediaType, SitemapPriority } from '@/enums'
import { MediaService } from '@/services/media.service'
import { notFound, ok, paginated, serverError } from '@/utils'
import { supabase } from '@/config/supabase'

export const MediaController = {
    // Get /media
    async list(c: Context) {
        try {
            const page = Number(c.req.query('page') ?? 1)
            const per_page = Number(c.req.query('per_page') ?? 20)
            const media_type = c.req.query('media_type') as MediaType | undefined
            const sort_by = (c.req.query('sort_by') as 'tmdb_popularity' | 'release_date' | 'editorial_rating' | undefined) ?? 'tmdb_popularity'
            const sort_order = (c.req.query('sort_order') as 'asc' | 'desc' | undefined) ?? 'desc'
            const status = c.req.query('status') as ContentStatus | undefined
            const genre_id = c.req.query('genre_id') ? Number(c.req.query('genre_id')) : undefined
            const search = c.req.query('search')

            const filters: any = { page, per_page, sort_by, sort_order }
            if (status) filters.status = status
            if (genre_id) filters.genre_id = genre_id
            if (search) filters.search = search
            if (media_type) filters.media_type = media_type

            const { data, total } = await MediaService.findAll(filters)

            // Cargar FAQs para cada película
            const { MediaFaqsService } = await import('@/services/media-faqs.service')

            const mediaWithFaqs = await Promise.all(
                data.map(async (media: any) => {
                    const faqs = await MediaFaqsService.getFaqs(media.id)
                    return {
                        ...media,
                        faqs: faqs || []
                    }
                })
            )

            return paginated(c, mediaWithFaqs, total, page, per_page, 'medium')
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /media/:slug
    async getBySlug(c: Context) {
        try {
            const { slug } = c.req.param()
            if (!slug) return notFound(c, 'Película/Serie')
            const region = (c.req.query('region')) ?? 'ES'

            // Obtener media con todas las relaciones (incluye FAQs de findBySlugFull)
            const media = await MediaService.findBySlugFull(slug, region)
            if (!media) return notFound(c, 'Película/Serie')

            // Sobrescribir solo videos y watch providers (FAQs ya vienen de findBySlugFull)
            const [
                { MediaVideosService },
                { MediaWatchProvidersService },
            ] = await Promise.all([
                import('@/services/media-videos.service'),
                import('@/services/media-watch-providers.service'),
            ])

            const [videos, watchProviders] = await Promise.all([
                MediaVideosService.getVideos(media.id),
                MediaWatchProvidersService.getWatchProviders(media.id, region),
            ])

            const mediaWithRelations = {
                ...media,
                videos,
                watch_providers: watchProviders,
                faqs: media.faqs || [], // Asegurar que faqs siempre sea un array
            }

            return ok(c, mediaWithRelations, 200, 'long')
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

            // Cargar FAQs para cada película
            const { MediaFaqsService } = await import('@/services/media-faqs.service')

            const mediaWithFaqs = await Promise.all(
                data.map(async (media: any) => {
                    const faqs = await MediaFaqsService.getFaqs(media.id)
                    return {
                        ...media,
                        faqs: faqs || []
                    }
                })
            )

            return paginated(c, mediaWithFaqs, total, page, per_page, 'medium')
        } catch (err) {
            return serverError(c, err)
        }
    },

    // GET /search?q=batman
    async search(c: Context) {
        try {
            const q = c.req.query('q') ?? ''
            const limit = Number(c.req.query('limit') ?? 10)
            if (!q.trim()) return ok(c, [], 200, 'short')

            const results = await MediaService.search(q, limit)

            // Cargar FAQs para cada resultado
            const { MediaFaqsService } = await import('@/services/media-faqs.service')

            const resultsWithFaqs = await Promise.all(
                results.map(async (media: any) => {
                    const faqs = await MediaFaqsService.getFaqs(media.id)
                    return {
                        ...media,
                        faqs: faqs || []
                    }
                })
            )

            return ok(c, resultsWithFaqs, 200, 'short')
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
            const search = c.req.query('search')
            const genre_id = c.req.query('genre_id') ? Number(c.req.query('genre_id')) : undefined
            const media_type = c.req.query('media_type')
            const sort_by = c.req.query('sort_by')
            const sort_order = c.req.query('sort_order')

            const filters: any = { page, per_page }
            if (status !== undefined) filters.status = status
            if (noindex !== undefined) filters.noindex = noindex
            if (search !== undefined) filters.search = search
            if (genre_id !== undefined) filters.genre_id = genre_id
            if (media_type !== undefined) filters.media_type = media_type
            if (sort_by !== undefined) filters.sort_by = sort_by
            if (sort_order !== undefined) filters.sort_order = sort_order

            const { data, total } = await MediaService.findAll(filters)

            // Cargar FAQs para cada película
            const { MediaFaqsService } = await import('@/services/media-faqs.service')

            const mediaWithFaqs = await Promise.all(
                data.map(async (media: any) => {
                    const faqs = await MediaFaqsService.getFaqs(media.id)
                    return {
                        ...media,
                        faqs: faqs || []
                    }
                })
            )

            return paginated(c, mediaWithFaqs, total, page, per_page, 'medium')
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

            // Cargar relaciones por separado
            const [
                { MediaVideosService },
                { MediaWatchProvidersService },
                { MediaFaqsService },
            ] = await Promise.all([
                import('@/services/media-videos.service'),
                import('@/services/media-watch-providers.service'),
                import('@/services/media-faqs.service'),
            ])

            const [videos, watchProviders, faqs] = await Promise.all([
                MediaVideosService.getVideos(media.id),
                MediaWatchProvidersService.getWatchProviders(media.id),
                MediaFaqsService.getFaqs(media.id),
            ])

            const mediaWithRelations = {
                ...media,
                videos,
                watch_providers: watchProviders,
                faqs: faqs || [], // Asegurar que faqs siempre sea un array
            }

            return ok(c, mediaWithRelations, 200, 'long')
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
            return ok(c, media, 200, 'long')
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
            return ok(c, media, 200, 'long')
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

    async importFromJson(c: Context) {
    try {
        const movie = await c.req.json()

        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
        const slug = movie.original_title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        const finalSlug = year ? `${slug}-${year}` : slug

        const mediaData = {
            tmdb_id: movie.tmdb_id,
            imdb_id: movie.imdb_id || null,
            media_type: MediaType.Movie,
            slug: finalSlug,
            original_title: movie.original_title,
            original_language: movie.original_language,
            release_date: movie.release_date || null,
            runtime_minutes: movie.runtime_minutes || null,
            tmdb_popularity: movie.tmdb_popularity || 0,
            title_es: movie.title_es || null,
            title_en: movie.title_en || null,
            synopsis_es: movie.synopsis_es || null,
            synopsis_en: movie.synopsis_en || null,
            poster_path: movie.poster_path || null,
            backdrop_path: movie.backdrop_path || null,
            status: ContentStatus.Archived,
            noindex: true,
            sitemap_priority: SitemapPriority.Medium,
            tmdb_last_synced_at: new Date().toISOString()
        }

        const result = await MediaService.upsertFromSync(mediaData)

        // Sincronizar géneros
        if (movie.genres && movie.genres.length > 0) {
            await MediaService.syncGenres(result.id, movie.genres.map((g: any) => g.id))
        }

        // Sincronizar videos (formato TMDB)
        if (movie.videos && movie.videos.length > 0) {
            await MediaService.syncVideos(result.id, movie.videos.map((v: any) => ({
                locale: v.locale || v.iso_639_1,
                video_type: v.type.toLowerCase(),
                video_site: v.site.toLowerCase(),
                external_key: v.key,
                title: v.name,
                published_at: v.published_at,
                is_official: v.official
            })))
        }

        return ok(c, {
            id: result.id,
            slug: result.slug,
            message: 'Película importada exitosamente con géneros y videos'
        })
    } catch (err) {
        return serverError(c, err)
    }
},

    // POST /admin/media/:id/faqs
    async syncFaqs(c: Context) {
        try {
            const { id } = c.req.param()
            if (!id) return notFound(c, 'Película/Serie')

            const faqs = await c.req.json()

            // Primero eliminar FAQs existentes
            await supabase
                .from('article_faqs')
                .delete()
                .eq('media_id', id)

            // Insertar nuevas FAQs
            if (faqs && Array.isArray(faqs) && faqs.length > 0) {
                const faqsWithMediaId = faqs.map((faq: any, index: number) => ({
                    media_id: id,
                    question_es: faq.question_es || null,
                    question_en: faq.question_en || null,
                    answer_es: faq.answer_es || null,
                    answer_en: faq.answer_en || null,
                    display_order: faq.display_order !== undefined ? faq.display_order : index
                }))

                const { error } = await supabase
                    .from('article_faqs')
                    .insert(faqsWithMediaId)

                if (error) throw error
            }

            return ok(c, { message: 'FAQs sincronizadas correctamente' })
        } catch (err) {
            return serverError(c, err)
        }
    }
}
