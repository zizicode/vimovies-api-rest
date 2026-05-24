import { supabase } from "@/config/supabase"
import { CreateListInput, CuratedList, CuratedListItem, ListItemInput, ListsResult, UpdateListInput } from "@/types"

export const CuratedListsService = {

  /**
   * Lista paginada de listas curadas publicadas.
   * Uso: página /ranking o /listas del sitio web.
   */
  async findAll(page = 1, perPage = 20): Promise<ListsResult> {
    const from = (page - 1) * perPage

    const { data, error, count } = await supabase
      .from('curated_lists')
      .select(
        'id, slug, title_es, title_en, cover_image_url, list_type, status, published_at, sitemap_priority',
        { count: 'exact' }
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(from, from + perPage - 1)

    if (error) throw error
    return { data: (data ?? []) as CuratedList[], total: count ?? 0 }
  },

  /**
   * Lista curada completa con todos sus items y datos de cada película.
   * Los items vienen ordenados por rank_position.
   * Uso: renderizar /ranking/:slug o /listas/:slug
   */
  async findBySlug(slug: string): Promise<CuratedList | null> {
    const { data, error } = await supabase
      .from('curated_lists')
      .select(`
        *,
        authors(id, slug, display_name, avatar_url),
        genres(id, slug, name_es, name_en),
        curated_list_items(
          rank_position, note_es, note_en,
          media(id, slug, title_es, title_en, poster_path, backdrop_path, release_date, tmdb_popularity, editorial_rating)
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) return null

    // Ordenar los items por rank_position (1, 2, 3...)
    if (data.curated_list_items) {
      data.curated_list_items.sort((a: any, b: any) => a.rank_position - b.rank_position)
    }

    return data as CuratedList
  },

  /**
   * Lista curada por UUID (sin relaciones).
   * Uso: dashboard edit.
   */
  async findById(id: string): Promise<CuratedList | null> {
    const { data, error } = await supabase
      .from('curated_lists')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as CuratedList
  },

  /**
   * Crea una nueva lista curada.
   * El slug debe generarse con generateSlug(title_es) antes de llamar aquí.
   */
  async create(input: CreateListInput): Promise<CuratedList> {
    const { data, error } = await supabase
      .from('curated_lists')
      .insert({
        ...input,
        status:          input.status          ?? 'draft',
        is_auto_updated: input.is_auto_updated ?? false,
        sitemap_priority: input.sitemap_priority ?? 'medium',
      })
      .select()
      .single()

    if (error) throw error
    return data as CuratedList
  },

  /**
   * Actualiza los campos de una lista curada.
   * El slug no se puede cambiar una vez publicado.
   */
  async update(id: string, input: UpdateListInput): Promise<CuratedList> {
    const { data, error } = await supabase
      .from('curated_lists')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CuratedList
  },

  /**
   * Elimina una lista y todos sus items (cascada).
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('curated_lists')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ── Items ─────────────────────────────────────────────────────────────────

  /**
   * Reemplaza todos los items de una lista en una sola operación.
   * Uso principal: drag & drop para reordenar desde el dashboard.
   * También se usa en el cron de auto-actualización (is_auto_updated = true).
   *
   * El array debe contener todos los items con su rank_position final.
   */
  async syncItems(listId: string, items: ListItemInput[]): Promise<void> {
    // Borrar todos los items actuales
    await supabase
      .from('curated_list_items')
      .delete()
      .eq('list_id', listId)

    if (!items.length) return

    const { error } = await supabase
      .from('curated_list_items')
      .insert(items.map(item => ({ ...item, list_id: listId })))

    if (error) throw error
  },

  /**
   * Agrega un único item al final de la lista.
   * El rank_position debe calcularse antes de llamar
   * (generalmente es el máximo actual + 1).
   */
  async addItem(listId: string, item: ListItemInput): Promise<CuratedListItem> {
    const { data, error } = await supabase
      .from('curated_list_items')
      .insert({ ...item, list_id: listId })
      .select()
      .single()

    if (error) throw error
    return data as CuratedListItem
  },

  /**
   * Quita una película específica de una lista.
   */
  async removeItem(listId: string, mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('curated_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('media_id', mediaId)

    if (error) throw error
  },
}