import { ArticleIntent, ContentStatus } from "@/enums"
import { ArticlesService } from "@/services/articles.service"
import { notFound, ok, paginated, serverError } from "@/utils"
import { Context } from "hono"

export const ArticlesController = {

  // GET /articles
  async list(c: Context) {
    try {
      const page          = Number(c.req.query('page')     ?? 1)
      const per_page      = Number(c.req.query('per_page') ?? 20)
      const category_slug = c.req.query('category')
      const intent        = c.req.query('intent') as ArticleIntent | undefined

      const filters: any = { page, per_page, status: 'published' as ContentStatus }
      if (category_slug) filters.category_slug = category_slug
      if (intent) filters.intent = intent

      const { data, total } = await ArticlesService.findAll(filters)
      return paginated(c, data, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /articles/:slug
  async getBySlug(c: Context) {
    try {
      const { slug }  = c.req.param()
      if (!slug) return notFound(c, 'Artículo')
      const article   = await ArticlesService.findBySlug(slug)
      if (!article) return notFound(c, 'Artículo')
      return ok(c, article)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  // GET /admin/articles
  async adminList(c: Context) {
    try {
      const page      = Number(c.req.query('page')     ?? 1)
      const per_page  = Number(c.req.query('per_page') ?? 20)
      const status    = c.req.query('status') as ContentStatus | undefined
      const intent    = c.req.query('intent') as ArticleIntent | undefined
      const author_id = c.req.query('author_id')

      const filters: any = { page, per_page }
      if (status) filters.status = status
      if (intent) filters.intent = intent
      if (author_id) filters.author_id = author_id

      const { data, total } = await ArticlesService.findAll(filters)
      return paginated(c, data, total, page, per_page)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /admin/articles/:id
  async adminGetById(c: Context) {
    try {
      const { id }  = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const article = await ArticlesService.findById(id)
      if (!article) return notFound(c, 'Artículo')
      return ok(c, article)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/articles
  async create(c: Context) {
    try {
      const body    = await c.req.json()
      const article = await ArticlesService.create(body)
      return ok(c, article, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/articles/:id
  async update(c: Context) {
    try {
      const { id }  = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const body    = await c.req.json()
      const article = await ArticlesService.update(id, body)
      if (!article) return notFound(c, 'Artículo')
      return ok(c, article)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/articles/:id/publish
  async publish(c: Context) {
    try {
      const { id }  = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const article = await ArticlesService.publish(id)
      if (!article) return notFound(c, 'Artículo')
      return ok(c, article)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/articles/:id/archive
  async archive(c: Context) {
    try {
      const { id }  = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const article = await ArticlesService.archive(id)
      if (!article) return notFound(c, 'Artículo')
      return ok(c, article)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/articles/:id
  async remove(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      await ArticlesService.remove(id)
      return ok(c, { message: 'Artículo eliminado' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/articles/:id/faqs
  async createFAQ(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const body   = await c.req.json()
      const faq    = await ArticlesService.createFAQ({ ...body, article_id: id })
      return ok(c, faq, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /admin/faqs/:id
  async updateFAQ(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'FAQ')
      const body   = await c.req.json()
      const faq    = await ArticlesService.updateFAQ(id, body)
      return ok(c, faq)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /admin/faqs/:id
  async deleteFAQ(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return notFound(c, 'FAQ')
      await ArticlesService.deleteFAQ(id)
      return ok(c, { message: 'FAQ eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PUT /admin/articles/:id/mentions
  async syncMentions(c: Context) {
    try {
      const { id }      = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const { mentions } = await c.req.json()
      await ArticlesService.syncMentions(id, mentions)
      return ok(c, { message: 'Menciones actualizadas' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PUT /admin/articles/:id/tags
  async syncTags(c: Context) {
    try {
      const { id }   = c.req.param()
      if (!id) return notFound(c, 'Artículo')
      const { tag_ids } = await c.req.json()
      await ArticlesService.syncTags(id, tag_ids)
      return ok(c, { message: 'Tags actualizados' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // GET /admin/articles/tags
  async getAllTags(c: Context) {
    try {
      const tags = await ArticlesService.findAllTags()
      return ok(c, tags)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /admin/articles/tags/seed
  async seedTags(c: Context) {
    try {
      const defaultTags = [
        { slug: 'accion', name_es: 'Acción', name_en: 'Action' },
        { slug: 'aventura', name_es: 'Aventura', name_en: 'Adventure' },
        { slug: 'animacion', name_es: 'Animación', name_en: 'Animation' },
        { slug: 'comedia', name_es: 'Comedia', name_en: 'Comedy' },
        { slug: 'crimen', name_es: 'Crimen', name_en: 'Crime' },
        { slug: 'documental', name_es: 'Documental', name_en: 'Documentary' },
        { slug: 'drama', name_es: 'Drama', name_en: 'Drama' },
        { slug: 'fantasia', name_es: 'Fantasía', name_en: 'Fantasy' },
        { slug: 'horror', name_es: 'Terror', name_en: 'Horror' },
        { slug: 'ciencia-ficcion', name_es: 'Ciencia Ficción', name_en: 'Science Fiction' },
        { slug: 'thriller', name_es: 'Thriller', name_en: 'Thriller' },
        { slug: 'romance', name_es: 'Romance', name_en: 'Romance' },
        { slug: 'familia', name_es: 'Familia', name_en: 'Family' },
        { slug: 'musica', name_es: 'Música', name_en: 'Music' },
        { slug: 'misterio', name_es: 'Misterio', name_en: 'Mystery' },
      ];

      const createdTags: any[] = [];
      for (const tag of defaultTags) {
        try {
          const created = await ArticlesService.createTag(tag);
          createdTags.push(created);
        } catch (error) {
          // Tag might already exist, continue
          console.log(`Tag ${tag.slug} might already exist`);
        }
      }

      return ok(c, { message: 'Tags seeded successfully', count: createdTags.length });
    } catch (err) {
      return serverError(c, err)
    }
  },
}