import { PersonRole, SitemapPriority } from "@/enums";

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

export interface UpsertPersonInput {
    tmdb_id: number
    slug: string
    name: string
    also_known_as?: string[] | null
    birthdate?: string | null
    deathdate?: string | null
    birthplace?: string | null
    biography_es?: string | null
    biography_en?: string | null
    gender?: 0 | 1 | 2 | 3 | null
    profile_path?: string | null
    homepage_url?: string | null
    imdb_id?: string | null
    seo_title_es?: string | null
    seo_title_en?: string | null
    seo_description_es?: string | null
    seo_description_en?: string | null
    og_image_url?: string | null
    canonical_url_es?: string | null
    canonical_url_en?: string | null
    tmdb_popularity?: number | null
    sitemap_priority?: SitemapPriority
    tmdb_last_synced_at?: string | null
}

export interface PersonWithFilmography {
    person: Person
    as_actor: FilmographyItem[]
    as_director: FilmographyItem[]
    as_writer: FilmographyItem[]
}

export interface FilmographyItem {
    id: string
    slug: string
    title_es: string | null
    title_en: string | null
    poster_path: string | null
    release_date: string | null
    tmdb_popularity: number | null
    role: string
    character_name: string | null
}

export interface CreditInput {
    person_id: string
    role: PersonRole
    character_name?: string | null
    cast_order?: number | null
    department?: string | null
    job_title?: string | null
}

export type UpdatePersonInput = Partial<Omit<UpsertPersonInput, 'tmdb_id' | 'slug'>>


export interface PeopleListResult {
    data: Person[]
    total: number
}

