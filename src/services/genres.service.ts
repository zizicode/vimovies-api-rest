
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
   * Busca un género por su slug.
   * Uso: pillar page /genero/:slug
   */
  async findBySlug(slug: string): Promise<Genre | null> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as Genre
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
   * Género + N películas más populares de ese género.
   * Uso: renderizar la pillar page completa /genero/:slug
   */
  async findBySlugWithMedia(slug: string, limit = 20): Promise<GenreWithMedia | null> {
    const genre = await GenreService.findBySlug(slug)
    if (!genre) return null

    const { data: mediaData, error: mediaError } = await supabase
      .from('media_genres')
      .select(`
        media (
          id, slug, title_es, title_en,
          poster_path, backdrop_path,
          release_date, tmdb_popularity,
          editorial_rating, status, noindex
        )
      `)
      .eq('genre_id', genre.id)
      .eq('media.status', 'published')
      .eq('media.noindex', false)
      .order('media(tmdb_popularity)', { ascending: false })
      .limit(limit)

    if (mediaError) throw mediaError

    return {
      genre,
      media: (mediaData ?? []).map((row: any) => row.media).filter(Boolean),
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
}