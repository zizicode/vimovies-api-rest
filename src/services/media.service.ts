import { supabase } from "@/config/supabase"
import { Media, MediaDetail, MediaFilters, MediaListResult, PatchMediaInput, SyncVideoInput, UpdateEditorialInput, UpsertMediaInput, UpsertRatingInput } from "@/types"

/**
 * Enriquece los créditos con los datos de las personas
 */
async function enrichCreditsWithPeople(credits: any[]): Promise<any[]> {
    if (credits.length === 0) return []

    // Obtener todos los person_id únicos
    const personIds = [...new Set(credits.map(c => c.person_id))]

    // Obtener todas las personas en una sola query
    const { data: people } = await supabase
        .from('people')
        .select('id, tmdb_id, slug, name, profile_path, tmdb_popularity, gender, sitemap_priority, created_at, updated_at')
        .in('id', personIds)

    // Crear mapa para búsqueda rápida
    const peopleMap = new Map((people ?? []).map((p: any) => [p.id, p]))

    // Enriquecer cada crédito con su persona
    return credits.map((credit: any) => ({
        ...credit,
        person: peopleMap.get(credit.person_id) || null
    }))
}

export const MediaService = {
    /**
     * Lista paginada de películas/series para la web pública.
     * Por defecto: publicadas, ordenadas por popularidad descendente.
     * En desarrollo (localhost): permite ver contenido no publicado.
     * En producción: solo muestra contenido 'published'.
     */

    async findAll(filters: MediaFilters = {}): Promise<any> {
        const {
            page = 1,
            per_page = 20,
            media_type,
            status,
            noindex,
            search,
            genre_id,
            sort_by = 'tmdb_popularity',
            sort_order = 'desc',
        } = filters
        const from = (page - 1) * per_page
        const to = from + per_page - 1

        // Si se filtra por género, utilice un enfoque de consulta diferente.
        if (genre_id) {
            const { data: gereRelations, error: gereRelationsError } = await supabase
                .from('media_genres')
                .select('media_id')
                .eq('genre_id', genre_id)
                .range(from, to)
            if (gereRelationsError) {
                throw gereRelationsError
            }
            const mediaIds = gereRelations?.map((r: any) => r.media_id) || []

            if (mediaIds.length === 0) {
                return { data: [], total: 0 }
            }

            // Ahora obtén los archivos multimedia con esos identificadores.
            let query = supabase
                .from('media')
                .select(
                    'id, tmdb_id, slug, media_type, original_title, release_date, runtime_minutes, tmdb_popularity, title_es, title_en, synopsis_es, synopsis_en, editorial_rating, poster_path, backdrop_path, status, noindex, media_genres(genre_id)',
                    { count: 'exact' }
                )
                .in('id', mediaIds)

            if (status) query = query.eq('status', status)
            // Default to draft if no status specified
            if (!status) query = query.eq('status', 'published')
            if (media_type) query = query.eq('media_type', media_type)
            if (noindex !== undefined) query = query.eq('noindex', noindex)

            // Buscar Filtros
            if (search) {
                query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,original_title.ilike.%${search}%`)
            }

            // No apliques la paginación todavía; primero obtén todos los resultados, luego ordena y pagina.
            const { data, error, count } = await query
            if (error) throw error

            const transformedData = (data ?? []).map((media: any) => ({
                ...media,
                genre_ids: media.media_genres?.map((mg: any) => mg.genre_id) || [],
                media_genres: undefined,
            }))

            // Ordenar en JavaScript
            transformedData.sort((a: any, b: any) => {
                let aVal: any, bVal: any;

                switch (sort_by) {
                    case 'tmdb_popularity':
                        aVal = a.tmdb_popularity || 0;
                        bVal = b.tmdb_popularity || 0;
                        break;
                    case 'release_date':
                        aVal = a.release_date || '';
                        bVal = b.release_date || '';
                        break;
                    case 'editorial_rating':
                        aVal = a.editorial_rating || 0;
                        bVal = b.editorial_rating || 0;
                        break;
                    default:
                        return 0;
                }

                if (sort_order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });

            // Aplicar paginación después de ordenar
            const paginatedData = transformedData.slice(from, to + 1);

            return { data: paginatedData as Media[], total: count ?? 0 }
        }

        // Consulta normal sin filtro de género
        let query = supabase
            .from('media')
            .select(
                'id, tmdb_id, slug, media_type, original_title, release_date, runtime_minutes, tmdb_popularity, title_es, title_en, synopsis_es, synopsis_en, editorial_rating, poster_path, backdrop_path, status, noindex, media_genres(genre_id)',
                { count: 'exact' }
            )
            .order(sort_by, { ascending: sort_order === 'asc', nullsFirst: false })

        if (status) query = query.eq('status', status)
        // Default to draft if no status specified
        if (!status) query = query.eq('status', 'published')
        if (media_type) query = query.eq('media_type', media_type)
        if (noindex !== undefined) query = query.eq('noindex', noindex)

        // Filtro de búsqueda (buscar en title_es, title_en o original_title)
        if (search) {
            query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,original_title.ilike.%${search}%`)
        }

        // Aplicar paginación después de los filtros
        query = query.range(from, to)

        const { data, error, count } = await query
        if (error) throw error

        // Transformar media_genres en un array de genre_ids
        const transformedData = (data ?? []).map((media: any) => ({
            ...media,
            genre_ids: media.media_genres?.map((mg: any) => mg.genre_id) || [],
            media_genres: undefined, // Remove the nested structure
        }))

        return { data: transformedData as Media[], total: count ?? 0 }
    },
    /**
  * Busca una media por su slug.
  * Uso: cualquier resolución interna de slug → entidad.
  */
    async findBySlug(slug: string): Promise<Media | null> {
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) return null
        return data as Media
    },

    /**
     * Busca una media por su UUID interno.
     * Uso: referencias internas, dashboard edit.
     */
    async findById(id: string): Promise<Media | null> {
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return data as Media
    },

    /**
     * Página completa de una película: todos los datos relacionados en una sola llamada.
     * Uso: renderizar /pelicula/:slug o /serie/:slug
     *
     * Carga en paralelo: géneros, créditos, videos, ratings, providers y FAQs.
     * El parámetro region filtra los watch providers por país (ES, MX, AR, CO, US).
     */
    async findBySlugFull(slug: string, region = 'ES'): Promise<MediaDetail | null> {
        const media = await MediaService.findBySlug(slug)
        if (!media) return null

        const [
            { data: genres },
            { data: credits },
            { data: videos },
            { data: ratings },
            { data: providers },
            { data: faqs },
        ] = await Promise.all([
            supabase
                .from('media_genres')
                .select('genres(id, slug, name_es, name_en, sitemap_priority)')
                .eq('media_id', media.id),

            supabase
                .from('media_credits')
                .select('id, media_id, person_id, role, character_name, cast_order, department, job_title')
                .eq('media_id', media.id)
                .order('cast_order', { ascending: true, nullsFirst: false }),

            supabase
                .from('media_videos')
                .select('id, media_id, locale, video_type, video_site, external_key, title, published_at, is_official')
                .eq('media_id', media.id)
                .order('is_official', { ascending: false }),

            supabase
                .from('media_ratings')
                .select('media_id, source, score, vote_count, raw_score, fetched_at')
                .eq('media_id', media.id),

            supabase
                .from('media_watch_providers')
                .select(`
          id, media_id, platform_id, region_code, is_streaming, is_rent, is_buy,
          rent_price_usd, buy_price_usd, watch_url, affiliate_url,
          platform:platforms(id, slug, name_es, name_en, logo_url, platform_type, affiliate_url_es, affiliate_url_en)
        `)
                .eq('media_id', media.id)
                .eq('region_code', region),

            supabase
                .from('article_faqs')
                .select('id, question_es, question_en, answer_es, answer_en, display_order')
                .eq('media_id', media.id)
                .order('display_order', { ascending: true }),
        ])

        return {
            ...media,
            genres: (genres ?? []).map((g: any) => g.genres).filter(Boolean),
            credits: await enrichCreditsWithPeople(credits ?? []),
            videos: (videos ?? []),
            ratings: (ratings ?? []),
            watch_providers: (providers ?? []).map((p: any) => ({
                id: p.id,
                media_id: p.media_id,
                platform_id: p.platform_id,
                region_code: p.region_code,
                is_streaming: p.is_streaming,
                is_rent: p.is_rent,
                is_buy: p.is_buy,
                rent_price_usd: p.rent_price_usd,
                buy_price_usd: p.buy_price_usd,
                watch_url: p.watch_url,
                affiliate_url: p.affiliate_url,
                tmdb_synced_at: p.tmdb_synced_at,
                verified_at: p.verified_at,
                platform: p.platform?.[0],
            })),
            faqs: faqs ?? [],
        }
    },

    /**
     * Películas de un género específico paginadas.
     * Uso: sección de películas dentro de /genero/:slug
     */
    async findByGenre(genreSlug: string, page = 1, perPage = 20): Promise<MediaListResult> {
        const from = (page - 1) * perPage

        const { data: genre } = await supabase
            .from('genres')
            .select('id')
            .eq('slug', genreSlug)
            .single()

        if (!genre) return { data: [], total: 0 }

        const { data, error, count } = await supabase
            .from('media_genres')
            .select(
                'media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity, editorial_rating)',
                { count: 'exact' }
            )
            .eq('genre_id', (genre as any).id)
            .eq('media.status', 'draft')
            .order('media(tmdb_popularity)', { ascending: false })
            .range(from, from + perPage - 1)

        if (error) throw error
        return {
            data: (data ?? []).map((r: any) => r.media).filter(Boolean) as Media[],
            total: count ?? 0,
        }
    },

    /**
     * Búsqueda de texto sobre títulos.
     * Usa ilike (case-insensitive LIKE). Para producción con pg_trgm
     * se puede cambiar a textSearch para mejor rendimiento.
     */
    async search(q: string, limit = 10): Promise<Media[]> {
        const { data, error } = await supabase
            .from('media')
            .select('id, slug, title_es, title_en, poster_path, release_date, media_type, tmdb_popularity')
            .or(`title_es.ilike.%${q}%,title_en.ilike.%${q}%,original_title.ilike.%${q}%`)
            .order('tmdb_popularity', { ascending: false, nullsFirst: false })
            .limit(limit)

        if (error) throw error
        return (data ?? []) as Media[]
    },

    // ── Sync desde TMDB ───────────────────────────────────────────────────────

    /**
     * Inserta o actualiza una película desde el sync de TMDB.
     * Usa onConflict: 'tmdb_id' — si ya existe ese tmdb_id, actualiza.
     * Devuelve el id y slug de la fila guardada.
     */
    async upsertFromSync(input: UpsertMediaInput): Promise<{ id: string; slug: string }> {
        const { data, error } = await supabase
            .from('media')
            .upsert(input, { onConflict: 'tmdb_id' })
            .select('id, slug')
            .single()

        if (error) throw error
        return data
    },

    /**
     * Sincroniza los géneros de una película.
     * Borra los existentes y los reinserta para evitar duplicados.
     */
    async syncGenres(mediaId: string, tmdbGenreIds: number[]): Promise<void> {
        // 1. Buscar los id internos de los géneros por su tmdb_id
        const { data: genres, error: genresError } = await supabase
            .from('genres')
            .select('id, tmdb_id')
            .in('tmdb_id', tmdbGenreIds)

        if (genresError) throw genresError

        // 2. Borrar relaciones actuales
        await supabase.from('media_genres').delete().eq('media_id', mediaId)

        if (!genres?.length) return

        // 3. Insertar las nuevas relaciones
        const { error } = await supabase
            .from('media_genres')
            .insert(genres.map((g: any) => ({ media_id: mediaId, genre_id: g.id })))

        if (error) throw error
    },

    /**
     * Sincroniza los videos (trailers) de una película.
     * Borra los existentes y los reinserta.
     */
    async syncVideos(mediaId: string, videos: SyncVideoInput[]): Promise<void> {
        await supabase.from('media_videos').delete().eq('media_id', mediaId)
        if (!videos.length) return

        const { error } = await supabase
            .from('media_videos')
            .insert(videos.map(v => ({ ...v, media_id: mediaId })))

        if (error) throw error
    },

    /**
     * Inserta o actualiza el rating de una fuente específica (tmdb, imdb...).
     * La clave de conflicto es (media_id, source).
     */
    async upsertRating(input: UpsertRatingInput): Promise<void> {
        const { error } = await supabase
            .from('media_ratings')
            .upsert(
                { ...input, fetched_at: new Date().toISOString() },
                { onConflict: 'media_id,source' }
            )

        if (error) throw error
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /**
     * Actualiza solo los campos editoriales de una película.
     * El sync de TMDB NUNCA llama a este método.
     */
    async updateEditorial(id: string, input: UpdateEditorialInput): Promise<Media> {
        const { data, error } = await supabase
            .from('media')
            .update(input)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Media
    },

    /**
     * Actualización parcial de campos individuales (admin only).
     * Permite editar cualquier campo sin enviar todo el objeto.
     * Uso: PATCH /api/admin/media/:id con solo los campos a modificar.
     */
    async patch(id: string, input: PatchMediaInput): Promise<Media> {
        const { data, error } = await supabase
            .from('media')
            .update(input)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Media
    },

    /**
     * Elimina una película de la base de datos.
     * Cascada eliminará media_genres, media_credits, media_videos,
     * media_ratings, media_watch_providers y article_faqs asociadas.
     */
    async remove(id: string): Promise<void> {
        const { error } = await supabase
            .from('media')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}