import { SitemapPriority, PlatformType } from "@/enums";

  export interface Platform {
    id:     number;
    slug:   string;
  
    name_es:       string;
    name_en:       string;
    description_es?: string | null;
    description_en?: string | null;
  
    logo_url?:      string | null;
    website_url?:   string | null;
    platform_type:  PlatformType;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    sitemap_priority:     SitemapPriority;
  
    affiliate_url_es?:  string | null;
    affiliate_url_en?:  string | null;
    affiliate_id?:      string | null;
  
    tmdb_provider_id?: number | null;
    is_active:         boolean;
    display_order:     number;
  
    created_at:  string;
    updated_at:  string;
  }