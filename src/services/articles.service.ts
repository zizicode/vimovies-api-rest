

import { supabase } from "@/config/supabase";
import { ContentStatus } from "@/enums";
import { Article, ArticleCategory, ArticleDetail, ArticleFAQ, ArticleFilters, ArticleListResult, CreateArticleInput, CreateCategoryInput, CreateFAQInput, MentionInput, Tag, UpdateArticleInput, UpdateFAQInput } from "@/types";

export const ArticlesService = {

  /**
   * Lista paginada de artículos.
   * Para la web pública: status = 'published' (default).
   * Para el dashboard: se puede pasar cualquier status o undefined para ver todos.
   */
  async findAll(filters: ArticleFilters = {}): Promise<ArticleListResult> {
    const {
      page          = 1,
      per_page      = 20,
      status        = 'published' as ContentStatus,
      category_slug,
      intent,
      author_id,
    } = filters

    const from = (page - 1) * per_page

    let query = supabase
      .from('articles')
      .select(
        `id, slug, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en,
         cover_image_url, seo_title_es, seo_title_en, seo_description_es, seo_description_en,
         published_at, reading_time_minutes, intent, status, noindex, word_count_es,
         author_id, category_id,
         authors(display_name, avatar_url, slug, expertise_es, expertise_en),
         article_categories(slug, name_es, name_en, description_es, description_en),
         article_tags(tags(id, slug, name_es, name_en)),
         article_faqs(id, question_es, question_en, answer_es, answer_en, display_order),
         article_media_mentions(media_id, mention_type, display_order, media(id, slug, title_es, title_en, poster_path))`,
        { count: 'exact' }
      )
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(from, from + per_page - 1)

    if (status)    query = query.eq('status', status)
    if (intent)    query = query.eq('intent', intent)
    if (author_id) query = query.eq('author_id', author_id)

    // Si se pasa category_slug, resolvemos el id primero
    if (category_slug) {
      const { data: cat } = await supabase
        .from('article_categories')
        .select('id')
        .eq('slug', category_slug)
        .single()

      if (cat) query = query.eq('category_id', (cat as any).id)
    }

    const { data, error, count } = await query
    if (error) throw error
    
    // Transform nested relations to flat structure expected by Article type
    const transformedData = (data ?? []).map((item: any) => ({
      ...item,
      locale: item.locale || 'es',
      has_en_version: item.has_en_version || false,
      sitemap_priority: item.sitemap_priority || 0.5,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }))
    
    return { data: transformedData as unknown as Article[], total: count ?? 0 }
  },

  /**
   * Artículo completo con todas sus relaciones.
   * Uso: renderizar la página de un artículo /articulos/:categoria/:slug
   */
  async findBySlug(slug: string): Promise<ArticleDetail | null> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        authors(id, slug, display_name, avatar_url, expertise_es, expertise_en, twitter_handle),
        article_categories(id, slug, name_es, name_en, genre_id, parent_category_id),
        article_faqs(id, question_es, question_en, answer_es, answer_en, display_order),
        article_media_mentions(
          mention_type, display_order,
          media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity)
        ),
        article_tags(tags(id, slug, name_es, name_en))
      `)
      .eq('slug', slug)
      .single()

    if (error) return null

    // Ordenar FAQs por display_order
    if (data.article_faqs) {
      data.article_faqs.sort((a: any, b: any) => a.display_order - b.display_order)
    }

    return data as ArticleDetail
  },

  /**
   * Artículo por UUID (sin relaciones, para el dashboard).
   */
  async findById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Article
  },

  /**
   * Crea un artículo nuevo en estado 'draft'.
   * El slug debe generarse con generateSlug(title_es) antes de llamar aquí.
   */
  async create(input: CreateArticleInput): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert({ ...input, status: input.status ?? 'draft' })
      .select()
      .single()

    if (error) throw error
    return data as Article
  },

  /**
   * Actualiza cualquier campo de un artículo.
   * El slug no se puede cambiar una vez que está indexado.
   */
  async update(id: string, input: UpdateArticleInput): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Article
  },

  /**
   * Publica un artículo: cambia status a 'published' y fija published_at a ahora.
   * Si ya tenía una fecha de publicación programada, la reemplaza con la actual.
   */
  async publish(id: string): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update({
        status:       'published' as ContentStatus,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Article
  },

  /**
   * Archiva un artículo: cambia status a 'archived'.
   * El artículo deja de aparecer en la web pero sus datos se preservan.
   */
  async archive(id: string): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update({ status: 'archived' as ContentStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Article
  },

  /**
   * Elimina un artículo definitivamente.
   * Cascada elimina sus FAQs, menciones y tags.
   * Preferir archive() en la mayoría de los casos.
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ── FAQs ──────────────────────────────────────────────────────────────────

  /**
   * Crea una FAQ asociada a un artículo o a una página de película.
   * Al menos uno de article_id o media_id debe estar presente.
   */
  async createFAQ(input: CreateFAQInput): Promise<ArticleFAQ> {
    const { data, error } = await supabase
      .from('article_faqs')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as ArticleFAQ
  },

  /**
   * Actualiza el texto de una FAQ.
   */
  async updateFAQ(id: string, input: UpdateFAQInput): Promise<ArticleFAQ> {
    const { data, error } = await supabase
      .from('article_faqs')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ArticleFAQ
  },

  /**
   * Elimina una FAQ.
   */
  async deleteFAQ(id: string): Promise<void> {
    const { error } = await supabase
      .from('article_faqs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ── Media Mentions ────────────────────────────────────────────────────────

  /**
   * Sincroniza las menciones de un artículo.
   * Borra las menciones existentes y las reinserta en el orden dado.
   * Uso: al guardar el artículo desde el editor del dashboard.
   */
  async syncMentions(articleId: string, mentions: MentionInput[]): Promise<void> {
    await supabase
      .from('article_media_mentions')
      .delete()
      .eq('article_id', articleId)

    if (!mentions.length) return

    const { error } = await supabase
      .from('article_media_mentions')
      .insert(mentions.map(m => ({ ...m, article_id: articleId })))

    if (error) throw error
  },

  // ── Tags ──────────────────────────────────────────────────────────────────

  /**
   * Sincroniza los tags de un artículo.
   * Borra los tags existentes y los reinserta.
   * Recibe un array de tag_id (número).
   */
  async syncTags(articleId: string, tagIds: number[]): Promise<void> {
    await supabase
      .from('article_tags')
      .delete()
      .eq('article_id', articleId)

    if (!tagIds.length) return

    const { error } = await supabase
      .from('article_tags')
      .insert(tagIds.map(tag_id => ({ article_id: articleId, tag_id })))

    if (error) throw error
  },

  // ── Categories ────────────────────────────────────────────────────────────

  /**
   * Lista todas las categorías de artículos.
   * Uso: selector de categoría en el editor del dashboard, menú de navegación.
   */
  async findAllCategories(): Promise<ArticleCategory[]> {
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    return (data ?? []) as ArticleCategory[]
  },

  /**
   * Crea una nueva categoría.
   */
  async createCategory(input: CreateCategoryInput): Promise<ArticleCategory> {
    const { data, error } = await supabase
      .from('article_categories')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as ArticleCategory
  },

  // ── Tags CRUD ─────────────────────────────────────────────────────────────

  /**
   * Lista todos los tags disponibles.
   * Uso: selector de tags en el editor del dashboard.
   */
  async findAllTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name_es', { ascending: true })

    if (error) throw error
    return (data ?? []) as Tag[]
  },

  /**
   * Crea un nuevo tag.
   */
  async createTag(input: { slug: string; name_es: string; name_en: string }): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  },
}