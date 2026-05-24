import { supabase } from "@/config/supabase"
import { Person, PersonWithFilmography, FilmographyItem, UpsertPersonInput, PeopleListResult, CreditInput, UpdatePersonInput } from "@/types"

export const PersonService = {
    /**
     * Lista paginada de personas, ordenadas por popularidad.
     * Uso: dashboard de actores, listado de directores.
     */
    async findAll(page = 1, perPage = 20): Promise<PeopleListResult> {
        const from = (page - 1) * perPage

        const { data, error, count } = await supabase
            .from('people')
            .select('id, slug, name, profile_path, tmdb_popularity, sitemap_priority, birthdate, gender', { count: 'exact' })
            .order('tmdb_popularity', { ascending: false, nullsFirst: false })
            .range(from, from + perPage - 1)

        if (error) throw error
        return { data: (data ?? []) as Person[], total: count ?? 0 }
    },

    /**
     * Busca una persona por su slug.
     * Uso: página /actor/:slug o /director/:slug
     */
    async findBySlug(slug: string): Promise<Person | null> {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) return null
        return data as Person
    },

    /**
     * Busca una persona por su UUID interno.
     * Uso: dashboard edit, referencias internas.
     */
    async findById(id: string): Promise<Person | null> {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return data as Person
    },

    /**
     * Persona + su filmografía completa agrupada por rol.
     * Uso: renderizar la página completa de un actor o director.
     */
    async findBySlugWithFilmography(slug: string): Promise<PersonWithFilmography | null> {
        const person = await PersonService.findBySlug(slug)
        if (!person) return null

        const { data: credits, error } = await supabase
            .from('media_credits')
            .select(`
        role, character_name, cast_order,
        media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity)
      `)
            .eq('person_id', person.id)
            .eq('media.status', 'published')
            .order('media(tmdb_popularity)', { ascending: false, nullsFirst: false })

        if (error) throw error

        const mapped = (credits ?? []).map((c: any) => ({
            ...c.media,
            role: c.role,
            character_name: c.character_name,
        })).filter((m: any) => m.id)

        return {
            person,
            as_actor: mapped.filter((m: FilmographyItem) => m.role === 'actor'),
            as_director: mapped.filter((m: FilmographyItem) => m.role === 'director'),
            as_writer: mapped.filter((m: FilmographyItem) => m.role === 'writer'),
        }
    },

    /**
     * Búsqueda de texto por nombre.
     * Uso: buscador global del sitio.
     */
    async search(q: string, limit = 10): Promise<Person[]> {
        const { data, error } = await supabase
            .from('people')
            .select('id, slug, name, profile_path, tmdb_popularity')
            .ilike('name', `%${q}%`)
            .order('tmdb_popularity', { ascending: false, nullsFirst: false })
            .limit(limit)

        if (error) throw error
        return (data ?? []) as Person[]
    },

    // ── Sync desde TMDB ───────────────────────────────────────────────────────

    /**
     * Inserta o actualiza una persona desde el sync de TMDB.
     * Si ya existe el tmdb_id, actualiza todos los campos.
     * Devuelve el UUID interno de la persona (necesario para insertar media_credits).
     */
    async upsertFromSync(input: UpsertPersonInput): Promise<{ id: string }> {
        const { data, error } = await supabase
            .from('people')
            .upsert(input, { onConflict: 'tmdb_id' })
            .select('id')
            .single()

        if (error) throw error
        return data as { id: string }
    },

    /**
     * Sincroniza los créditos (reparto + equipo) de una película.
     * Borra todos los créditos anteriores de esa película y los reinserta.
     * Esto es intencional: es más simple y seguro que hacer upsert por crédito.
     */
    async syncCredits(mediaId: string, credits: CreditInput[]): Promise<void> {
        // Borrar créditos anteriores de esta película
        await supabase
            .from('media_credits')
            .delete()
            .eq('media_id', mediaId)

        if (!credits.length) return

        const { error } = await supabase
            .from('media_credits')
            .insert(credits.map(c => ({ ...c, media_id: mediaId })))

        if (error) throw error
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /**
     * Actualiza campos editables de una persona desde el dashboard.
     * No permite cambiar slug ni tmdb_id.
     */
    async update(id: string, input: UpdatePersonInput): Promise<Person> {
        // Validar que el input no esté vacío
        if (!input || Object.keys(input).length === 0) {
            throw new Error('No se proporcionaron datos para actualizar')
        }

        // Filtrar solo campos definidos para evitar nulls no deseados
        const filteredInput: any = {}
        Object.keys(input).forEach(key => {
            const value = (input as any)[key]
            if (value !== undefined) {
                filteredInput[key] = value
            }
        })

        if (Object.keys(filteredInput).length === 0) {
            throw new Error('No se proporcionaron campos válidos para actualizar')
        }

        const { data, error } = await supabase
            .from('people')
            .update(filteredInput)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating person:', { error, id, filteredInput })
            throw new Error(`Error al actualizar persona: ${error.message}`)
        }

        if (!data) {
            throw new Error('No se encontró la persona para actualizar')
        }

        return data as Person
    },

    /**
     * Elimina una persona.
     * Cascada elimina sus media_credits.
     */
    async remove(id: string): Promise<void> {
        const { error } = await supabase
            .from('people')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}