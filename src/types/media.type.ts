import type { ArticleFAQ } from "./articleFaQ.type";
import type { Genre } from "./genres.type";
import type { Person } from "./person.type";

import { ContentStatus, SitemapPriority, MediaType, PersonRole, PlatformType, SupportedLocale, RatingSource, VideoType, VideoSite } from "@/enums";

export interface MediaFilters {
    page?: number
    per_page?: number
    media_type?: MediaType
    status?: ContentStatus
    noindex?: boolean
    search?: string
    genre_id?: number
    sort_by?: 'tmdb_popularity' | 'release_date' | 'editorial_rating' | 'updated_at'
    sort_order?: 'asc' | 'desc'
}

export interface MediaRating {
    media_id: string;
    source: RatingSource;
    score: number;
    vote_count?: number | null;
    raw_score?: string | null;
    fetched_at: string;
}

export interface MediaWatchProvider {
    id: string;
    media_id: string;
    platform_id: number;
    region_code: string;

    is_streaming: boolean;
    is_rent: boolean;
    is_buy: boolean;

    rent_price_usd?: number | null;
    buy_price_usd?: number | null;

    watch_url?: string | null;
    affiliate_url?: string | null;

    tmdb_synced_at?: string | null;
    verified_at?: string | null;

    // Joined
    platform?: PlatformType;
}

export interface Media {
    id: string;   // UUID
    tmdb_id: number;
    imdb_id?: string | null;
    media_type: MediaType;
    slug: string;

    original_title: string;
    original_language: string;
    release_date?: string | null;  // ISO date
    runtime_minutes?: number | null;
    tmdb_popularity?: number | null;

    title_es?: string | null;
    title_en?: string | null;

    synopsis_es?: string | null;
    synopsis_en?: string | null;

    editorial_review_es?: string | null;
    editorial_review_en?: string | null;
    editorial_rating?: number | null;
    editorial_verdict_es?: string | null;
    editorial_verdict_en?: string | null;

    poster_path?: string | null;
    backdrop_path?: string | null;
    logo_path?: string | null;

    seo_title_es?: string | null;
    seo_title_en?: string | null;
    seo_description_es?: string | null;
    seo_description_en?: string | null;
    og_image_url?: string | null;

    status: ContentStatus;
    is_prerendered: boolean;
    sitemap_priority: SitemapPriority;
    noindex: boolean;

    tmdb_last_synced_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface MediaDetail extends Media {
    genres: Genre[];
    credits: MediaCredit[];
    videos: MediaVideo[];
    ratings: MediaRating[];
    watch_providers: MediaWatchProvider[];
    faqs: ArticleFAQ[];
    similar?: Media[];
}

export interface MediaListResult {
  data:  Media[]
  total: number
}

export interface MediaCredit {
    id: string;
    media_id: string;
    person_id: string;
    role: PersonRole;

    character_name?: string | null;
    cast_order?: number | null;

    department?: string | null;
    job_title?: string | null;

    // Joined
    person?: Person;
}

export interface MediaVideo {
    id: string;
    media_id: string;
    locale: SupportedLocale;

    video_type: VideoType;
    video_site: VideoSite;
    external_key: string;
    title?: string | null;
    published_at?: string | null;
    is_official: boolean;
}

export interface UpsertMediaInput {
  tmdb_id:              number
  slug:                 string
  media_type:           MediaType
  original_title:       string
  original_language:    string
  title_es?:            string | null
  title_en?:            string | null
  synopsis_es?:         string | null
  synopsis_en?:         string | null
  release_date?:        string | null
  runtime_minutes?:     number | null
  tmdb_popularity?:     number | null
  poster_path?:         string | null
  backdrop_path?:       string | null
  imdb_id?:             string | null
  noindex?:             boolean
  is_prerendered?:      boolean
  sitemap_priority?:    SitemapPriority
  status?:              ContentStatus
  tmdb_last_synced_at?: string | null
}

export interface PatchMediaInput {
  title_es?:             string | null
  title_en?:             string | null
  synopsis_es?:          string | null
  synopsis_en?:          string | null
  editorial_review_es?:  string | null
  editorial_review_en?:  string | null
  editorial_rating?:     number | null
  editorial_verdict_es?: string | null
  editorial_verdict_en?: string | null
  poster_path?:          string | null
  backdrop_path?:        string | null
  logo_path?:            string | null
  seo_title_es?:         string | null
  seo_title_en?:         string | null
  seo_description_es?:   string | null
  seo_description_en?:   string | null
  og_image_url?:         string | null
  status?:               ContentStatus
  noindex?:              boolean
  is_prerendered?:       boolean
  sitemap_priority?:     SitemapPriority
  canonical_url_es?:     string | null
  canonical_url_en?:     string | null
}

export interface UpdateEditorialInput {
  editorial_review_es?:  string | null
  editorial_review_en?:  string | null
  editorial_rating?:     number | null
  editorial_verdict_es?: string | null
  editorial_verdict_en?: string | null
  seo_title_es?:         string | null
  seo_title_en?:         string | null
  seo_description_es?:   string | null
  seo_description_en?:   string | null
  og_image_url?:         string | null
  status?:               ContentStatus
  noindex?:              boolean
  sitemap_priority?:     SitemapPriority
}

export interface UpsertRatingInput {
  media_id:   string
  source:     RatingSource
  score:      number
  vote_count?: number | null
  raw_score?:  string | null
}

export interface SyncVideoInput {
  locale:       SupportedLocale
  video_type:   VideoType
  video_site:   VideoSite
  external_key: string
  title?:       string | null
  published_at?: string | null
  is_official:  boolean
}