import { Media } from "./media.type";

import { ContentStatus, SitemapPriority } from "@/enums";

export type CuratedListType = 'ranking' | 'collection' | 'seasonal' | 'thematic';
  
  export interface CuratedList {
    id:   string;
    slug: string;
  
    title_es:       string;
    title_en?:      string | null;
    description_es?: string | null;
    description_en?: string | null;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    cover_image_url?:     string | null;
  
    list_type:       CuratedListType;
    is_auto_updated: boolean;
    status:          ContentStatus;
  
    author_id?: string | null;
    genre_id?:  number | null;
  
    sitemap_priority: SitemapPriority;
    published_at?:    string | null;
    created_at:       string;
    updated_at:       string;
  
    items?: CuratedListItem[];
  }
  
  export interface CuratedListItem {
    list_id:       string;
    media_id:      string;
    rank_position: number;
    note_es?:      string | null;
    note_en?:      string | null;
    media?: Media;
  }

export interface CreateListInput {
  slug:                string
  title_es:            string
  title_en?:           string | null
  description_es?:     string | null
  description_en?:     string | null
  seo_title_es?:       string | null
  seo_title_en?:       string | null
  seo_description_es?: string | null
  seo_description_en?: string | null
  cover_image_url?:    string | null
  list_type:           CuratedListType
  is_auto_updated?:    boolean
  status?:             ContentStatus
  author_id?:          string | null
  genre_id?:           number | null
  sitemap_priority?:   SitemapPriority
  published_at?:       string | null
}

export type UpdateListInput = Partial<Omit<CreateListInput, 'slug'>>

export interface ListItemInput {
  media_id:       string
  rank_position:  number
  note_es?:       string | null
  note_en?:       string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ListsResult {
  data:  CuratedList[]
  total: number
}
