import { Hono } from 'hono'
import { getCached, setCached, invalidateCache } from '../services/sitemap/sitemap.cache'
import { xmlHeaders } from '../services/sitemap/sitemap.utils'
import { generateStaticSitemap } from '../services/sitemap/generators/static.generator'
import { generateMoviesSitemap } from '../services/sitemap/generators/movies.generator'
import { generatePeopleSitemap } from '../services/sitemap/generators/people.generator'
import { generateGenresSitemap } from '../services/sitemap/generators/genres.generator'
import { generateArticlesSitemap } from '../services/sitemap/generators/articles.generator'

const sitemap = new Hono()

// ── Obtener BASE_URL desde variables de entorno ─────────────────────────────
function getBaseUrl(): string {
  const base =
    process.env.SITE_URL ||
    process.env.BASE_URL ||
    process.env.FRONTEND_URL

  if (!base) {
    console.warn('[Sitemap] WARNING: No BASE_URL/SITE_URL env var found. Using fallback.')
    return 'https://vimovies.com'
  }

  return base.replace(/\/$/, '')
}

// ── Helper para manejar errores sin romper el sitemap index ─────────────────
async function safeGenerate(
  key: string,
  generator: (base: string) => Promise<string>,
  base: string
): Promise<string> {
  const cached = getCached(key)
  if (cached) return cached

  try {
    const content = await generator(base)
    setCached(key, content)
    return content
  } catch (error) {
    console.error(`[Sitemap] Error generating ${key}:`, error)
    // Retorna urlset vacío válido — no rompe el sitemap index
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`
  }
}

// ── Invalidar caché (con token de seguridad) ────────────────────────────────
sitemap.get('/sitemap-refresh', (c) => {
  const token = c.req.query('token')
  const secret = process.env.SITEMAP_REFRESH_TOKEN

  if (!secret || token !== secret) {
    return c.text('Unauthorized', 401)
  }

  invalidateCache()
  return c.text('Cache invalidated', 200)
})

// ── robots.txt ───────────────────────────────────────────────────────────────
sitemap.get('/robots.txt', (c) => {
  const base = getBaseUrl()
  const robotsTxt = `User-agent: *
Allow: /

# Rutas que NO deben indexarse
Disallow: /admin/
Disallow: /render/
Disallow: /ssr/

# Sitemaps
Sitemap: ${base}/sitemap.xml`

  return c.text(robotsTxt, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400'
  })
})

// ── Sitemap Index ───────────────────────────────────────────────────────────
sitemap.get('/sitemap.xml', (c) => {
  const base = getBaseUrl()
  const now = new Date().toISOString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${base}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${base}/sitemap-movies.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${base}/sitemap-people.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${base}/sitemap-genres.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${base}/sitemap-articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`

  return c.text(xml, 200, xmlHeaders())
})

// ── Sitemaps individuales ───────────────────────────────────────────────────
sitemap.get('/sitemap-static.xml', async (c) => {
  const base = getBaseUrl()
  const xml = await safeGenerate('static', generateStaticSitemap, base)
  return c.text(xml, 200, xmlHeaders())
})

sitemap.get('/sitemap-movies.xml', async (c) => {
  const base = getBaseUrl()
  const xml = await safeGenerate('movies', generateMoviesSitemap, base)
  return c.text(xml, 200, xmlHeaders())
})

sitemap.get('/sitemap-people.xml', async (c) => {
  const base = getBaseUrl()
  const xml = await safeGenerate('people', generatePeopleSitemap, base)
  return c.text(xml, 200, xmlHeaders())
})

sitemap.get('/sitemap-genres.xml', async (c) => {
  const base = getBaseUrl()
  const xml = await safeGenerate('genres', generateGenresSitemap, base)
  return c.text(xml, 200, xmlHeaders())
})

sitemap.get('/sitemap-articles.xml', async (c) => {
  const base = getBaseUrl()
  const xml = await safeGenerate('articles', generateArticlesSitemap, base)
  return c.text(xml, 200, xmlHeaders())
})

export default sitemap
