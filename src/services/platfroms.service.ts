import { supabase } from "@/config/supabase"
import { PlatformType, SitemapPriority } from "@/enums"
import { CatalogItem, CreatePlatformInput, MediaWatchProvider, Platform, PlatformWithCatalog, UpdatePlatformInput, WatchProviderInput } from "@/types"

// Normalizar platform_type: convertir valores antiguos a nuevos valores del enum
function normalizePlatformType(type: string | undefined): PlatformType {
    if (!type) return PlatformType.SVOD
    
    const typeLower = type.toLowerCase()
    
    // Mapeo de valores antiguos a nuevos
    const oldToNew: Record<string, PlatformType> = {
        'streaming': PlatformType.SVOD,
        'svod': PlatformType.SVOD,
        'tv': PlatformType.Broadcast,
        'tvod': PlatformType.TVOD,
        'rental': PlatformType.TVOD,
        'buy': PlatformType.TVOD,
        'cable': PlatformType.Cable,
        'broadcast': PlatformType.Broadcast,
        'avod': PlatformType.AVOD,
    }
    
    // Si el valor ya es válido, retornarlo
    if (Object.values(PlatformType).includes(type as PlatformType)) {
        return type as PlatformType
    }
    
    // Si es un valor antiguo, mapearlo al nuevo
    return oldToNew[typeLower] || PlatformType.SVOD
}

// Normalizar sitemap_priority: convertir valores numéricos a valores del enum
function normalizeSitemapPriority(priority: string | undefined): SitemapPriority {
    if (!priority) return SitemapPriority.Low
    
    // Si el valor ya es válido, retornarlo
    if (Object.values(SitemapPriority).includes(priority as SitemapPriority)) {
        return priority as SitemapPriority
    }
    
    // Mapeo de valores numéricos a enum
    const numericToEnum: Record<string, SitemapPriority> = {
        '1.0': SitemapPriority.Critical,
        '0.9': SitemapPriority.High,
        '0.8': SitemapPriority.Medium,
        '0.7': SitemapPriority.Medium,
        '0.5': SitemapPriority.Low,
        '0.3': SitemapPriority.Minimal,
        '0.1': SitemapPriority.Minimal,
    }
    
    return numericToEnum[priority] || SitemapPriority.Low
}

export const PlatformsService = {

    /**
     * Lista todas las plataformas, ordenadas por display_order.
     * Con onlyActive = true devuelve solo las habilitadas (uso público).
     * Con onlyActive = false devuelve todas (uso dashboard).
     */
    async findAll(onlyActive = true): Promise<Platform[]> {
        let query = supabase
            .from('platforms')
            .select('*')
            .order('display_order', { ascending: true })

        if (onlyActive) query = query.eq('is_active', true)

        const { data, error } = await query
        if (error) throw error
        return (data ?? []) as Platform[]
    },

    /**
     * Busca una plataforma por su slug.
     * Uso: página /donde-ver/:slug
     */
    async findBySlug(slug: string): Promise<Platform | null> {
        const { data, error } = await supabase
            .from('platforms')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) return null
        return data as Platform
    },

    /**
     * Busca una plataforma por su id interno.
     * Uso: dashboard edit, referencias internas.
     */
    async findById(id: number): Promise<Platform | null> {
        const { data, error } = await supabase
            .from('platforms')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return data as Platform
    },

    /**
     * Plataforma + catálogo de películas disponibles en streaming para una región.
     * Uso: renderizar la página /donde-ver/:slug
     */
    async findBySlugWithCatalog(
        slug: string,
        region = 'ES',
        page = 1,
        perPage = 20
    ): Promise<PlatformWithCatalog | null> {
        const platform = await PlatformsService.findBySlug(slug)
        if (!platform) return null

        const from = (page - 1) * perPage

        const { data, error, count } = await supabase
            .from('media_watch_providers')
            .select(
                'media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity)',
                { count: 'exact' }
            )
            .eq('platform_id', platform.id)
            .eq('region_code', region)
            .eq('is_streaming', true)
            .eq('media.status', 'published')
            .order('media(tmdb_popularity)', { ascending: false, nullsFirst: false })
            .range(from, from + perPage - 1)

        if (error) throw error

        return {
            platform,
            media: (data ?? []).map((r: any) => r.media).filter(Boolean) as CatalogItem[],
            total: count ?? 0,
        }
    },

    /**
     * Lista los watch providers de una media, opcionalmente filtrados por región.
     * Uso: sección "Dónde ver" dentro de la página de una película.
     */
    async findProvidersByMedia(mediaId: string, region?: string): Promise<MediaWatchProvider[]> {
        let query = supabase
            .from('media_watch_providers')
            .select(`
        id, region_code, is_streaming, is_rent, is_buy,
        rent_price_usd, buy_price_usd, watch_url, affiliate_url,
        platforms(id, slug, name_es, name_en, logo_url, platform_type, affiliate_url_es, affiliate_url_en)
      `)
            .eq('media_id', mediaId)

        if (region) query = query.eq('region_code', region)

        const { data, error } = await query
        if (error) throw error
        return (data ?? []) as unknown as MediaWatchProvider[]
    },

    // ── Sync desde TMDB ───────────────────────────────────────────────────────

    /**
     * Sincroniza los watch providers de una película.
     * Borra todos los providers existentes de esa media y los reinserta.
     *
     * IMPORTANTE: affiliate_url no se toca aquí.
     * Solo se actualiza manualmente desde el dashboard con updateAffiliateUrl().
     */
    async syncWatchProviders(mediaId: string, providers: WatchProviderInput[]): Promise<void> {
        // Borrar providers anteriores de esta película
        await supabase
            .from('media_watch_providers')
            .delete()
            .eq('media_id', mediaId)

        if (!providers.length) return

        const now = new Date().toISOString()

        const { error } = await supabase
            .from('media_watch_providers')
            .insert(
                providers.map(p => ({
                    ...p,
                    media_id: mediaId,
                    is_streaming: p.is_streaming ?? false,
                    is_rent: p.is_rent ?? false,
                    is_buy: p.is_buy ?? false,
                    tmdb_synced_at: now,
                }))
            )

        if (error) throw error
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /**
     * Crea una nueva plataforma.
     * Las plataformas principales ya están en el seed SQL.
     * Este método es para agregar nuevas plataformas desde el dashboard.
     */
    async create(input: CreatePlatformInput): Promise<Platform> {
        // Normalizar valores antes de insertar
        const normalizedInput = {
            ...input,
            platform_type: normalizePlatformType(input.platform_type),
            sitemap_priority: normalizeSitemapPriority(input.sitemap_priority),
        }
        
        const { data, error } = await supabase
            .from('platforms')
            .insert(normalizedInput)
            .select()
            .single()

        if (error) throw error
        return data as Platform
    },

    /**
     * Actualiza una plataforma existente.
     * No permite cambiar el slug.
     */
    async update(id: number, input: UpdatePlatformInput): Promise<Platform> {
        // Normalizar valores antes de actualizar
        const normalizedInput: UpdatePlatformInput = { ...input }
        
        if (input.platform_type) {
            normalizedInput.platform_type = normalizePlatformType(input.platform_type)
        }
        
        if (input.sitemap_priority) {
            normalizedInput.sitemap_priority = normalizeSitemapPriority(input.sitemap_priority)
        }
        
        const { data, error } = await supabase
            .from('platforms')
            .update(normalizedInput)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Platform
    },

    /**
     * Actualiza solo el affiliate_url de un watch provider específico.
     * No se puede hacer desde el sync — solo desde el dashboard.
     */
    async updateAffiliateUrl(providerId: string, affiliateUrl: string): Promise<MediaWatchProvider> {
        const { data, error } = await supabase
            .from('media_watch_providers')
            .update({ affiliate_url: affiliateUrl })
            .eq('id', providerId)
            .select()
            .single()

        if (error) throw error
        return data as MediaWatchProvider
    },

    /**
     * Elimina una plataforma.
     * Cascada eliminará sus media_watch_providers.
     */
    async remove(id: number): Promise<void> {
        const { error } = await supabase
            .from('platforms')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}
