
// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// Sólo los campos que el exterior puede enviar al crear/editar.
// Los campos que genera la DB (id, created_at, updated_at) nunca van aquí.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/config/supabase"
import { SitemapPriority } from "@/enums"
import { Genre } from "@/types"

export interface GenreFilters {
  page?:     number
  per_page?: number
}

export interface CreateGenreInput {
  tmdb_id:             number
  slug:                string
  name_es:             string
  name_en:             string
  seo_title_es?:       string | null
  seo_title_en?:       string | null
  seo_description_es?: string | null
  seo_description_en?: string | null
  description_es?:     string | null
  description_en?:     string | null
  cover_image_url?:    string | null
  sitemap_priority?:   SitemapPriority
}

// Al actualizar, el slug y tmdb_id son inmutables
export type UpdateGenreInput = Partial<Omit<CreateGenreInput, 'tmdb_id' | 'slug'>>

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// Lo que devuelve cada método del servicio
// ─────────────────────────────────────────────────────────────────────────────

export interface GenreListResult {
  data:  Genre[]
  total: number
}

export interface GenreWithMedia {
  genre: Genre
  media: Array<{
    id:               string
    slug:             string
    title_es:         string | null
    title_en:         string | null
    poster_path:      string | null
    backdrop_path:    string | null
    release_date:     string | null
    tmdb_popularity:  number | null
    editorial_rating: number | null
    status:           string
    noindex:          boolean
  }>
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export interface GenreStats {
  genre_id: number
  slug: string
  name_es: string
  name_en: string
  media_count: number
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const GenreService = {

  /**
   * Lista todos los géneros paginados, ordenados alfabéticamente en español.
   * Uso: menú de géneros, página de exploración.
   */
  async findAll({ page = 1, per_page = 50 }: GenreFilters = {}): Promise<GenreListResult> {
    const from = (page - 1) * per_page
    const to   = from + per_page - 1

    const { data, error, count } = await supabase
      .from('genres')
      .select('*', { count: 'exact' })
      .order('name_es', { ascending: true })
      .range(from, to)

    if (error) throw error
    return { data: (data ?? []) as Genre[], total: count ?? 0 }
  },

  /**
   * Busca un género por su slug (en español o inglés).
   * Uso: pillar page /genero/:slug
   */
  async findBySlug(slug: string): Promise<Genre | null> {
    console.log('[GenreService] findBySlug called with:', slug)
    // Primero buscar por slug exacto (español)
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('slug', slug)
      .single()

    console.log('[GenreService] First query result:', { data, error })
    if (!error && data) return data as Genre

    // Si no encuentra, buscar por nombre en inglés convertido a slug
    const { data: dataByEn, error: errorByEn } = await supabase
      .from('genres')
      .select('*')
      .ilike('name_en', slug.replace(/-/g, ' '))
      .single()

    console.log('[GenreService] Second query result:', { dataByEn, errorByEn })
    if (errorByEn) return null
    return dataByEn as Genre
  },

  /**
   * Busca un género por su id interno (número).
   * Uso: referencias internas, dashboard.
   */
  async findById(id: number): Promise<Genre | null> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Genre
  },

  /**
   * Género + N películas más populares de ese género con paginación y búsqueda.
   * Uso: renderizar la pillar page completa /genero/:slug
   */
  async findBySlugWithMedia(
    slug: string,
    page = 1,
    per_page = 20,
    search?: string
  ): Promise<GenreWithMedia | null> {
    const genre = await GenreService.findBySlug(slug)
    if (!genre) return null

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    // Filter by genre through media_genres relationship
    const { data: genreRelations } = await supabase
      .from('media_genres')
      .select('media_id')
      .eq('genre_id', genre.id)

    const mediaIds = genreRelations?.map((r: any) => r.media_id) || []
    if (mediaIds.length === 0) {
      // No media for this genre
      return {
        genre,
        media: [],
        pagination: { page, per_page, total: 0, pages: 0 }
      }
    }

    // Query media table directly with genre filter
    let query = supabase
      .from('media')
      .select(`
        id, slug, title_es, title_en,
        poster_path, backdrop_path,
        release_date, tmdb_popularity,
        editorial_rating, status, noindex
      `, { count: 'exact' })
      .eq('status', 'published')
      .in('id', mediaIds)

    // Aplicar búsqueda si se proporciona (ANTES de order y range)
    if (search) {
      query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,original_title.ilike.%${search}%`)
    }

    const { data: mediaData, error: mediaError, count } = await query
      .order('tmdb_popularity', { ascending: false })
      .range(from, to)

    if (mediaError) throw mediaError

    const media = mediaData ?? []
    const total = count ?? 0
    const pages = Math.ceil(total / per_page)

    return {
      genre,
      media,
      pagination: {
        page,
        per_page,
        total,
        pages
      }
    }
  },

  /**
   * Crea un nuevo género.
   * Uso: seed manual o cuando TMDB agrega un nuevo género.
   */
  async create(input: CreateGenreInput): Promise<Genre> {
    const { data, error } = await supabase
      .from('genres')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as Genre
  },

  /**
   * Actualiza campos editables de un género (descripción, SEO, imagen).
   * No permite cambiar slug ni tmdb_id.
   */
  async update(id: number, input: UpdateGenreInput): Promise<Genre> {
    const { data, error } = await supabase
      .from('genres')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Genre
  },

  /**
   * Elimina un género.
   * ⚠️ Supabase eliminará en cascada los registros de media_genres.
   */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Estadísticas de géneros: cuántas películas tiene cada género.
   * Uso: mostrar contadores en el slider de géneros.
   */
  async getStats(): Promise<GenreStats[]> {
    const { data, error } = await supabase
      .from('genres')
      .select(`
        id,
        slug,
        name_es,
        name_en,
        media_genres(count)
      `)
      .order('name_es', { ascending: true })

    if (error) throw error

    return (data ?? []).map((g: any) => ({
      genre_id: g.id,
      slug: g.slug,
      name_es: g.name_es,
      name_en: g.name_en,
      media_count: g.media_genres?.[0]?.count ?? 0
    }))
  },
}