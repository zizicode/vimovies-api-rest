import { ArticleFAQ } from "./articleFaQ.type"
import { Media } from "./media.type"

import { ContentStatus, ArticleIntent, SupportedLocale, SitemapPriority } from "@/enums"

export interface ArticleFilters {
  page?: number
  per_page?: number
  status?: ContentStatus
  category_slug?: string
  intent?: ArticleIntent
  author_id?: string
}


export interface ArticleListResult {
  data: Article[]
  total: number
}


export interface Article {
  id: string;
  slug: string;
  author_id: string;
  category_id: number;

  title_es: string;
  title_en?: string | null;

  excerpt_es: string;
  excerpt_en?: string | null;

  content_es: string;
  content_en?: string | null;

  cover_image_url?: string | null;
  cover_image_alt_es?: string | null;
  cover_image_alt_en?: string | null;

  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  og_image_url?: string | null;
  canonical_url_es?: string | null;
  canonical_url_en?: string | null;

  intent: ArticleIntent;
  primary_keyword_es?: string | null;
  primary_keyword_en?: string | null;
  secondary_keywords?: string[] | null;

  status: ContentStatus;
  locale: SupportedLocale;
  has_en_version: boolean;
  published_at?: string | null;
  scheduled_at?: string | null;

  word_count_es?: number | null;
  word_count_en?: number | null;
  reading_time_minutes?: number | null;

  sitemap_priority: SitemapPriority;
  noindex: boolean;

  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  slug: string;

  display_name: string;
  email: string;
  bio_es?: string | null;
  bio_en?: string | null;
  avatar_url?: string | null;
  twitter_handle?: string | null;
  website_url?: string | null;

  expertise_es?: string | null;
  expertise_en?: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleCategory {
  id: number;
  slug: string;

  name_es: string;
  name_en: string;
  description_es?: string | null;
  description_en?: string | null;

  genre_id?: number | null;
  parent_category_id?: number | null;
  display_order: number;
}

export interface ArticleMediaMention {
  article_id: string;
  media_id: string;
  mention_type: 'primary' | 'supporting' | 'mentioned';
  display_order: number;
  media?: Media;
}

export interface ArticleDetail extends Article {
  author: Author;
  category: ArticleCategory;
  faqs: ArticleFAQ[];
  media_mentions: ArticleMediaMention[];
  tags: Tag[];
}

export interface CreateArticleInput {
  slug:                  string
  author_id:             string
  category_id:           number
  title_es:              string
  title_en?:             string | null
  excerpt_es:            string
  excerpt_en?:           string | null
  content_es:            string
  content_en?:           string | null
  cover_image_url?:      string | null
  cover_image_alt_es?:   string | null
  cover_image_alt_en?:   string | null
  seo_title_es?:         string | null
  seo_title_en?:         string | null
  seo_description_es?:   string | null
  seo_description_en?:   string | null
  og_image_url?:         string | null
  canonical_url_es?:     string | null
  canonical_url_en?:     string | null
  intent?:               ArticleIntent
  primary_keyword_es?:   string | null
  primary_keyword_en?:   string | null
  secondary_keywords?:   string[] | null
  status?:               ContentStatus
  locale?:               SupportedLocale
  has_en_version?:       boolean
  published_at?:         string | null
  scheduled_at?:         string | null
  word_count_es?:        number | null
  word_count_en?:        number | null
  reading_time_minutes?: number | null
  sitemap_priority?:     SitemapPriority
  noindex?:              boolean
}

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'slug'>>

export interface CreateFAQInput {
  article_id?:    string | null
  media_id?:      string | null
  question_es:    string
  question_en?:   string | null
  answer_es:      string
  answer_en?:     string | null
  display_order?: number
}

export type UpdateFAQInput = Partial<Omit<CreateFAQInput, 'article_id' | 'media_id'>>

export interface MentionInput {
  media_id:      string
  mention_type:  'primary' | 'supporting' | 'mentioned'
  display_order: number
}

export interface CreateCategoryInput {
  slug:               string
  name_es:            string
  name_en:            string
  description_es?:    string | null
  description_en?:    string | null
  genre_id?:          number | null
  parent_category_id?: number | null
  display_order?:     number
}

export interface Tag {
  id: number;
  slug: string;
  name_es: string;
  name_en: string;
}
