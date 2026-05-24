import { SitemapPriority } from "@/enums";

export interface Person {
    id: string;  // UUID
    tmdb_id: number;
    slug: string;

    name: string;
    also_known_as?: string[] | null;
    birthdate?: string | null;
    deathdate?: string | null;
    birthplace?: string | null;
    biography_es?: string | null;
    biography_en?: string | null;
    gender?: 0 | 1 | 2 | 3 | null;

    profile_path?: string | null;
    homepage_url?: string | null;
    imdb_id?: string | null;

    seo_title_es?: string | null;
    seo_title_en?: string | null;
    seo_description_es?: string | null;
    seo_description_en?: string | null;

    tmdb_popularity?: number | null;
    sitemap_priority: SitemapPriority;

    tmdb_last_synced_at?: string | null;
    created_at: string;
    updated_at: string;
}