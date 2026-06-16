import { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

// -- Tipos ----------------------------------------------------
interface PaginatedMeta {
  page     : number
  per_page : number
  total    : number
  pages    : number
}

type CacheDuration = 'short' | 'medium' | 'long' | 'none'

const CACHE_HEADERS: Record<CacheDuration, Record<string, string>> = {
  short: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
  medium: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  long: { 'Cache-Control': 'public, max-age=900, s-maxage=900' },
  none: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
}

// -- Helpers --------------------------------------------------

export const ok = <T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
  cache: CacheDuration = 'medium'
) => {
  const headers = CACHE_HEADERS[cache]
  return c.json({ success: true, data }, status as 200, headers)
}

export const paginated = <T>(
  c        : Context,
  data     : T[],
  total    : number,
  page     : number,
  per_page : number,
  cache    : CacheDuration = 'medium'
) => {
  const meta: PaginatedMeta = {
    page,
    per_page,
    total,
    pages: Math.ceil(total / per_page),
  }
  const headers = CACHE_HEADERS[cache]
  return c.json({ success: true, data, meta }, 200 as const, headers)
}

export const notFound = (c: Context, message = 'Resource not found') =>
  c.json({ success: false, error: message }, 404 as const, CACHE_HEADERS.none)

export const serverError = (c: Context, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Internal server error'
  console.error('[ServerError]', error)
  return c.json({ success: false, error: message }, 500 as const, CACHE_HEADERS.none)
}

// Helper específico para HTML renderizado (bots)
export const htmlWithCache = (
  c: Context,
  html: string,
  cache: CacheDuration = 'long',
  status: 200 | 404 = 200
) => {
  const headers = {
    ...CACHE_HEADERS[cache],
    'Content-Type': 'text/html; charset=utf-8'
  }
  return c.html(html, status, headers)
}


