// ============================================================
// seo.routes.ts — Rutas SEO y SSR · Hono · Vimovies
// Agrega estas rutas en tu app principal de Hono
// ============================================================
import { Hono } from 'hono'
import { MediaService } from '@/services/media.service'
import { ContentStatus } from '@/enums'
import type { Media } from '@/types/media.type'

const seo = new Hono()

// ── Tipos ────────────────────────────────────────────────────
// interface Movie {
//   slug: string
//   title_es: string
//   title_en: string
//   seo_title_es: string
//   seo_title_en: string
//   seo_description_es: string
//   seo_description_en: string
//   synopsis_es: string
//   synopsis_en: string
//   editorial_review_es: string
//   editorial_review_en: string
//   editorial_rating: number
//   editorial_verdict_es: string
//   editorial_verdict_en: string
//   release_date: string
//   runtime_minutes: number
//   original_language: string
//   poster_path: string
//   backdrop_path: string
//   og_image_url: string | null
//   noindex: boolean
//   updated_at: string
//   sitemap_priority: 'high' | 'medium' | 'low'
// }

const SITE_URL = 'https://vimovies.com'
const PRIORITY = { high: '1.0', medium: '0.7', low: '0.4' } as const

// ── /robots.txt ──────────────────────────────────────────────
seo.get('/robots.txt', (c) => {
  return c.text(
    `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/

Sitemap: ${SITE_URL}/sitemap.xml`,
    200,
    { 'Content-Type': 'text/plain' },
  )
})

// ── /sitemap.xml ─────────────────────────────────────────────
seo.get('/sitemap.xml', async (c) => {
  const { data: movies } = await MediaService.findAll({
    status: ContentStatus.Published,
    noindex: false,
    per_page: 1000, // Obtener todas para sitemap
    sort_by: 'updated_at',
    sort_order: 'desc'
  })

  if (!movies) return c.text('Error generating sitemap', 500)

  const staticRoutes = [
    { loc: `${SITE_URL}/`,           priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/peliculas`,  priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/series`,     priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/novedades`,  priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE_URL}/top-peliculas`, priority: '0.8', changefreq: 'weekly' },
  ]

  const staticUrls = staticRoutes
    .map(
      (r) => `
  <url>
    <loc>${r.loc}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    )
    .join('')

  const movieUrls = (movies ?? [])
    .map(
      (m: Media) => `
  <url>
    <loc>${SITE_URL}/pelicula/${m.slug}</loc>
    <lastmod>${m.updated_at.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${PRIORITY[m.sitemap_priority as keyof typeof PRIORITY] ?? '0.5'}</priority>
  </url>`,
    )
    .join('')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticUrls}
${movieUrls}
</urlset>`

  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600', // cachea 1 hora
  })
})

// ── /ssr/* — SSR para bots ───────────────────────────────────
// Página de mantenimiento SSR (mientras no haya contenido)
seo.get('/ssr/', (c) => {
  return c.html(maintenanceHtml())
})

// Detalle de película SSR
seo.get('/ssr/pelicula/:slug', async (c) => {
  const slug = c.req.param('slug')

  const m = await MediaService.findBySlugFull(slug)

  if (!m) return c.notFound()

  const year        = new Date(m.release_date || '').getFullYear()
  const durationISO = `PT${m.runtime_minutes}M`
  const poster      = `https://image.tmdb.org/t/p/w780${m.poster_path}`
  const pageUrl     = `${SITE_URL}/pelicula/${m.slug}`
  const ogImage     = m.og_image_url ?? poster

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Movie',
        name: m.title_es,
        alternateName: m.title_en,
        url: pageUrl,
        image: poster,
        datePublished: m.release_date,
        duration: durationISO,
        inLanguage: m.original_language,
        description: m.synopsis_es,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: m.editorial_rating,
          bestRating: '10',
          worstRating: '1',
          ratingCount: '1',
        },
        review: {
          '@type': 'Review',
          author: { '@type': 'Organization', name: 'Vimovies' },
          reviewBody: m.editorial_review_es,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: m.editorial_rating,
            bestRating: '10',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Películas', item: `${SITE_URL}/peliculas` },
          { '@type': 'ListItem', position: 3, name: m.title_es, item: pageUrl },
        ],
      },
      {
        '@type': 'WebPage',
        url: pageUrl,
        name: m.seo_title_es,
        description: m.seo_description_es,
        publisher: { '@type': 'Organization', name: 'Vimovies', url: SITE_URL },
      },
    ],
  }

  const html = `<!DOCTYPE html>
<html lang="es" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${m.seo_title_es}</title>
  <meta name="description" content="${m.seo_description_es}">
  <link rel="canonical" href="${pageUrl}">
  ${m.noindex
    ? '<meta name="robots" content="noindex,nofollow">'
    : '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">'}

  <meta property="og:type"        content="video.movie">
  <meta property="og:url"         content="${pageUrl}">
  <meta property="og:title"       content="${m.seo_title_es}">
  <meta property="og:description" content="${m.seo_description_es}">
  <meta property="og:image"       content="${ogImage}">
  <meta property="og:image:width" content="780">
  <meta property="og:locale"      content="es_ES">
  <meta property="og:site_name"   content="Vimovies">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${m.seo_title_es}">
  <meta name="twitter:description" content="${m.seo_description_es}">
  <meta name="twitter:image"       content="${ogImage}">

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header>
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="${SITE_URL}">Inicio</a></li>
        <li><a href="${SITE_URL}/peliculas">Películas</a></li>
        <li aria-current="page">${m.title_es}</li>
      </ol>
    </nav>
  </header>
  <main>
    <article itemscope itemtype="https://schema.org/Movie">
      <h1 itemprop="name">${m.title_es} (${year})</h1>
      <img
        src="${poster}"
        alt="Póster oficial de ${m.title_es} (${year})"
        width="780"
        loading="eager"
        itemprop="image"
      >
      <section aria-label="Sinopsis">
        <h2>Sinopsis</h2>
        <p itemprop="description">${m.synopsis_es}</p>
      </section>
      <section aria-label="Ficha técnica">
        <h2>Ficha técnica</h2>
        <dl>
          <dt>Año de estreno</dt>
          <dd><time datetime="${m.release_date}" itemprop="datePublished">${year}</time></dd>
          <dt>Duración</dt>
          <dd itemprop="duration" content="${durationISO}">${m.runtime_minutes} minutos</dd>
          <dt>Idioma original</dt>
          <dd itemprop="inLanguage">${m.original_language.toUpperCase()}</dd>
        </dl>
      </section>
      <section aria-label="Reseña editorial" itemprop="review" itemscope itemtype="https://schema.org/Review">
        <h2>Reseña de Vimovies</h2>
        <p itemprop="reviewBody">${m.editorial_review_es}</p>
        <p>Veredicto: <strong>${m.editorial_verdict_es}</strong></p>
        <p>
          Calificación:
          <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
            <span itemprop="ratingValue">${m.editorial_rating}</span>/<span itemprop="bestRating">10</span>
          </span>
        </p>
      </section>
    </article>
  </main>
</body>
</html>`

  return c.html(html, 200, {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
  })
})

// ── Página de mantenimiento SSR (para bots mientras el sitio no está listo) ──
function maintenanceHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vimovies — Próximamente el mejor catálogo de películas</title>
  <meta name="description" content="Vimovies llegará pronto con el mejor catálogo de películas: trailers, sinopsis, reseñas editoriales y dónde ver tus películas favoritas online.">
  <link rel="canonical" href="${SITE_URL}/">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="Vimovies — Próximamente">
  <meta property="og:description" content="El mejor catálogo de películas está en camino.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:site_name" content="Vimovies">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vimovies',
    url: SITE_URL,
    description: 'Plataforma de recomendaciones de películas con trailers, sinopsis y reseñas.',
    publisher: { '@type': 'Organization', name: 'Vimovies', url: SITE_URL },
  })}</script>
</head>
<body>
  <main>
    <h1>Vimovies — Próximamente</h1>
    <p>
      Vimovies será tu destino definitivo para descubrir cine: accede a trailers exclusivos,
      sinopsis detalladas, reseñas editoriales y toda la información de tus películas favoritas,
      incluyendo dónde verlas online. Un catálogo curado, diseñado para los que viven el cine.
    </p>
  </main>
</body>
</html>`
}

export default seo
