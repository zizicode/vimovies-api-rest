import { supabase } from "@/config/supabase"

/**
 * Servicio para gestionar watch providers individuales de películas.
 * Separado de media.service.ts para mejor organización.
 */
export const MediaWatchProvidersService = {
  /**
   * Obtiene los watch providers de una película con la información de las plataformas.
   */
  async getWatchProviders(mediaId: string, region?: string): Promise<any[]> {
    let query = supabase
      .from('media_watch_providers')
      .select(`
        id, media_id, platform_id, region_code, is_streaming, is_rent, is_buy,
        rent_price_usd, buy_price_usd, watch_url, affiliate_url,
        platform:platforms(id, slug, name_es, name_en, logo_url, platform_type, affiliate_url_es, affiliate_url_en)
      `)
      .eq('media_id', mediaId)

    if (region) {
      query = query.eq('region_code', region)
    }

    const { data, error } = await query.order('platform_id', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Agrega un watch provider a una película.
   */
  async addWatchProvider(mediaId: string, provider: {
    platform_id: number
    region_code: string
    is_streaming?: boolean
    is_rent?: boolean
    is_buy?: boolean
    rent_price_usd?: number | null
    buy_price_usd?: number | null
    watch_url?: string | null
    affiliate_url?: string | null
  }): Promise<void> {
    const { error } = await supabase
      .from('media_watch_providers')
      .insert({ ...provider, media_id: mediaId })

    if (error) throw error
  },

  /**
   * Elimina un watch provider de una película.
   */
  async removeWatchProvider(providerId: string): Promise<void> {
    const { error } = await supabase
      .from('media_watch_providers')
      .delete()
      .eq('id', providerId)

    if (error) throw error
  },

  /**
   * Actualiza un watch provider.
   */
  async updateWatchProvider(providerId: string, updates: {
    is_streaming?: boolean
    is_rent?: boolean
    is_buy?: boolean
    rent_price_usd?: number | null
    buy_price_usd?: number | null
    watch_url?: string | null
    affiliate_url?: string | null
  }): Promise<void> {
    const { error } = await supabase
      .from('media_watch_providers')
      .update(updates)
      .eq('id', providerId)

    if (error) throw error
  },
}
