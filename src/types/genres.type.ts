import { SitemapPriority } from "@/enums";

export interface Genre {
    id: number;
    tmdb_id: number;
    slug: string;
    name_es: string;
    name_en: string;
    seo_title_es?: string | null;
    seo_title_en?: string | null;
    seo_description_es?: string | null;
    seo_description_en?: string | null;
    description_es?: string | null;
    description_en?: string | null;
    cover_image_url?: string | null;
    sitemap_priority: SitemapPriority;
    created_at: string;
    updated_at: string;
}