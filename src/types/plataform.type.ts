import { SitemapPriority, PlatformType } from "@/enums";

export interface Platform {
  id: number;
  slug: string;

  name_es: string;
  name_en: string;
  description_es?: string | null;
  description_en?: string | null;

  logo_url?: string | null;
  website_url?: string | null;
  platform_type: PlatformType;

  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  sitemap_priority: SitemapPriority;

  affiliate_url_es?: string | null;
  affiliate_url_en?: string | null;
  affiliate_id?: string | null;

  tmdb_provider_id?: number | null;
  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}

export interface CreatePlatformInput {
  slug:                string
  name_es:             string
  name_en:             string
  description_es?:     string | null
  description_en?:     string | null
  logo_url?:           string | null
  website_url?:        string | null
  platform_type?:      PlatformType
  seo_title_es?:       string | null
  seo_title_en?:       string | null
  seo_description_es?: string | null
  seo_description_en?: string | null
  sitemap_priority?:   SitemapPriority
  affiliate_url_es?:   string | null
  affiliate_url_en?:   string | null
  affiliate_id?:       string | null
  tmdb_provider_id?:   number | null
  is_active?:          boolean
  display_order?:      number
}

export interface PlatformWithCatalog {
  platform: Platform
  media: CatalogItem[]
  total: number
}

export interface CatalogItem {
  id: string
  slug: string
  title_es: string | null
  title_en: string | null
  poster_path: string | null
  release_date: string | null
  tmdb_popularity: number | null
}

export interface WatchProviderInput {
  platform_id:     number
  region_code:     string
  is_streaming?:   boolean
  is_rent?:        boolean
  is_buy?:         boolean
  rent_price_usd?: number | null
  buy_price_usd?:  number | null
  watch_url?:      string | null
}

export type UpdatePlatformInput = Partial<Omit<CreatePlatformInput, 'slug'>>