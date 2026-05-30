import { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

// ── Tipos ────────────────────────────────────────────────────
interface PaginatedMeta {
  page     : number
  per_page : number
  total    : number
  pages    : number
}

// ── Helpers ──────────────────────────────────────────────────

export const ok = <T>(c: Context, data: T, status: ContentfulStatusCode = 200) =>
  c.json({ success: true, data }, status as 200)

export const paginated = <T>(
  c        : Context,
  data     : T[],
  total    : number,
  page     : number,
  per_page : number,
) => {
  const meta: PaginatedMeta = {
    page,
    per_page,
    total,
    pages: Math.ceil(total / per_page),
  }
  return c.json({ success: true, data, meta }, 200 as const)
}

export const notFound = (c: Context, message = 'Resource not found') =>
  c.json({ success: false, error: message }, 404 as const)

export const serverError = (c: Context, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Internal server error'
  console.error('[ServerError]', error)
  return c.json({ success: false, error: message }, 500 as const)
}