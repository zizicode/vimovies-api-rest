import { supabase } from "@/config/supabase"

/**
 * Servicio para gestionar créditos individuales de películas.
 * Separado de media.service.ts para mejor organización.
 */
export const MediaCreditsService = {
  /**
   * Obtiene los créditos de una película con la información de las personas.
   */
  async getCredits(mediaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('media_credits')
      .select(`
        id, media_id, person_id, role, character_name, cast_order, department, job_title,
        person:people(id, tmdb_id, slug, name, profile_path, tmdb_popularity, gender, sitemap_priority, created_at, updated_at)
      `)
      .eq('media_id', mediaId)
      .order('cast_order', { ascending: true, nullsFirst: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Agrega un crédito a una película.
   */
  async addCredit(mediaId: string, credit: {
    person_id: string
    role: string
    character_name?: string | null
    cast_order?: number | null
    department?: string | null
    job_title?: string | null
  }): Promise<void> {
    const { error } = await supabase
      .from('media_credits')
      .insert({ ...credit, media_id: mediaId })

    if (error) throw error
  },

  /**
   * Elimina un crédito de una película.
   */
  async removeCredit(creditId: string): Promise<void> {
    const { error } = await supabase
      .from('media_credits')
      .delete()
      .eq('id', creditId)

    if (error) throw error
  },

  /**
   * Actualiza el orden de un crédito (cast_order).
   */
  async updateCreditOrder(creditId: string, castOrder: number): Promise<void> {
    const { error } = await supabase
      .from('media_credits')
      .update({ cast_order: castOrder })
      .eq('id', creditId)

    if (error) throw error
  },
}
