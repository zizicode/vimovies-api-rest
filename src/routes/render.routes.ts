import { Hono } from 'hono'

import { SupportedLocale, DEFAULT_LOCALE } from '../middleware/locale.middleware'
import { ArticlesService } from '../services/articles.service'
import { CuratedListsService } from '../services/curated-list.service'
import { GenreService } from '../services/genres.service'
import { MediaService } from '../services/media.service'
import { htmlWithCache } from '../utils/response'
import '../types/hono.type'
import { buildStaticBody, buildStaticRenderMeta } from '@/render/static.render'

const routes = new Hono()

// ── Plantilla HTML Base ───────────────────────────────────────

const baseHtml = (title: string, description: string, canonical: string, og: any, twitter: any, alternates: { es: string; en: string }, schema: any, body: string, locale: SupportedLocale = DEFAULT_LOCALE) => `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
<!-- Primary -->
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">

<!-- Open Graph -->
<meta property="og:type"        content="${og.type}">
<meta property="og:site_name"   content="${og.site_name}">
<meta property="og:title"       content="${og.title}">
<meta property="og:description" content="${og.description}">
<meta property="og:image"       content="${og.image}">
<meta property="og:url"         content="${og.url}">

<!-- Twitter / X -->
<meta name="twitter:card"        content="${twitter.card}">
<meta name="twitter:site"        content="${twitter.site}">
<meta name="twitter:title"       content="${twitter.title}">
<meta name="twitter:description" content="${twitter.description}">
<meta name="twitter:image"       content="${twitter.image}">

<!-- hreflang -->
<link rel="alternate" hreflang="es" href="${alternates.es}">
<link rel="alternate" hreflang="en" href="${alternates.en}">
<link rel="alternate" hreflang="x-default" href="${alternates.en}">

  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>${body}</body>
</html>`

// ── Schema.org Generators ───────────────────────────────────

const movieSchema = (media: any, locale: SupportedLocale = DEFAULT_LOCALE) => {
  const isEs = locale === 'es'
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: isEs ? (media.title_es || media.original_title) : (media.title_en || media.original_title),
    description: isEs ? (media.synopsis_es || media.synopsis_en) : (media.synopsis_en || media.synopsis_es),
    datePublished: media.release_date,
    image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
    url: `https://vimovies.com/${isEs ? 'pelicula' : 'movie'}/${media.slug}`,
    contentRating: media.editorial_rating ? `${media.editorial_rating}/10` : '',
    duration: media.runtime_minutes ? `PT${media.runtime_minutes}M` : '',
    genre: media.genres?.map((g: any) => isEs ? g.name_es : g.name_en).filter(Boolean) || [],
    actor: media.credits?.filter((c: any) => c.role === 'actor' && c.cast_order).slice(0, 5).map((c: any) => ({
      '@type': 'Person',
      name: c.person?.name || c.character_name
    })) || [],
    director: media.credits?.filter((c: any) => c.role === 'director').slice(0, 3).map((c: any) => ({
      '@type': 'Person',
      name: c.person?.name
    })) || []
  }
}

const tvSeriesSchema = (media: any, locale: SupportedLocale = DEFAULT_LOCALE) => {
  const isEs = locale === 'es'
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: isEs ? (media.title_es || media.original_title) : (media.title_en || media.original_title),
    description: isEs ? (media.synopsis_es || media.synopsis_en) : (media.synopsis_en || media.synopsis_es),
    datePublished: media.release_date,
    image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
    url: `https://vimovies.com/${isEs ? 'serie' : 'tv-show'}/${media.slug}`,
    contentRating: media.editorial_rating ? `${media.editorial_rating}/10` : '',
    genre: media.genres?.map((g: any) => isEs ? g.name_es : g.name_en).filter(Boolean) || [],
    actor: media.credits?.filter((c: any) => c.role === 'actor' && c.cast_order).slice(0, 5).map((c: any) => ({
      '@type': 'Person',
      name: c.person?.name || c.character_name
    })) || [],
    director: media.credits?.filter((c: any) => c.role === 'director').slice(0, 3).map((c: any) => ({
      '@type': 'Person',
      name: c.person?.name
    })) || []
  }
}

const articleSchema = (article: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.excerpt || '',
  datePublished: article.published_at,
  dateModified: article.updated_at || article.published_at,
  author: {
    '@type': 'Organization',
    name: 'Vimovies'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Vimovies'
  },
  url: `https://vimovies.com/articulo/${article.slug}`
})

const itemListSchema = (list: any) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: list.title,
  description: list.description || '',
  url: `https://vimovies.com/ranking/${list.slug}`,
  numberOfItems: list.items?.length || 0
})

// ── Helper para endpoints espejo en inglés ─────────────────────

async function renderEnglishMirror(
  c: any,
  section: string,
  slug: string,
  spanishSection: string,
  _englishSection: string
): Promise<Response> {
  const locale = 'en' as SupportedLocale
  const region = c.req.query('region') ?? 'US'

  console.log(`[Render EN] Request: section=${section}, slug=${slug}, locale=${locale}, region=${region}`)

  try {
    let html: string

    // Películas
    if (spanishSection === 'pelicula') {
      const media = await MediaService.findBySlugFull(slug)
      if (!media || media.media_type !== 'movie') {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = media.seo_title_en || media.title_en || media.original_title
      const description = media.seo_description_en || media.synopsis_en || media.synopsis_es || ''
      const canonical = `https://vimovies.com/movie/${media.slug}`
      const ogData = {
        title,
        description,
        image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
        type: 'video.movie',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/pelicula/${media.slug}`,
        en: `https://vimovies.com/movie/${media.slug}`
      }
      const schema = movieSchema(media, locale)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      html = baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale)
    }
    // Series
    else if (spanishSection === 'serie') {
      const media = await MediaService.findBySlugFull(slug)
      if (!media || media.media_type !== 'series') {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = media.seo_title_en || media.title_en || media.original_title
      const description = media.seo_description_en || media.synopsis_en || media.synopsis_es || ''
      const canonical = `https://vimovies.com/tv-show/${media.slug}`
      const ogData = {
        title,
        description,
        image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
        type: 'video.tv_show',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/serie/${media.slug}`,
        en: `https://vimovies.com/tv-show/${media.slug}`
      }
      const schema = tvSeriesSchema(media, locale)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      html = baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale)
    }
    // Artículos
    else if (spanishSection === 'articulo') {
      const article = await ArticlesService.findBySlug(slug)
      if (!article) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = article.seo_title_en || article.title_en || article.title_es || 'Sin título'
      const description = article.seo_description_en || article.excerpt_en || article.excerpt_es || ''
      const canonical = `https://vimovies.com/article/${article.slug}`
      const ogData = {
        title,
        description,
        image: article.cover_image_url || '',
        type: 'article',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/articulo/${article.slug}`,
        en: `https://vimovies.com/article/${article.slug}`
      }
      const schema = articleSchema(article)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      html = baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale)
    }
    // Géneros
    else if (spanishSection === 'genero') {
      const genre = await GenreService.findBySlug(slug)
      if (!genre) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = `${genre.name_en} - Movies and TV Shows`
      const description = `The best ${genre.name_en} movies and TV shows. Discover titles, ratings and recommendations.`
      const canonical = `https://vimovies.com/genre/${genre.slug}`
      const ogData = {
        title,
        description,
        image: '',
        type: 'website',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/genero/${genre.slug}`,
        en: `https://vimovies.com/genre/${genre.slug}`
      }
      const schema = itemListSchema({ title, description, slug: genre.slug, items: [] })
      const body = `<main><section><h1>${genre.name_en}</h1><p>${description}</p></section></main>`

      html = baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale)
    }
    // Rankings/Lists
    else if (spanishSection === 'ranking') {
      const list = await CuratedListsService.findBySlug(slug)
      if (!list) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = list.seo_title_en || list.title_en || list.title_es
      const description = list.seo_description_en || list.description_en || list.description_es || ''
      const canonical = `https://vimovies.com/list/${list.slug}`
      const ogData = {
        title,
        description,
        image: list.cover_image_url || '',
        type: 'website',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/ranking/${list.slug}`,
        en: `https://vimovies.com/list/${list.slug}`
      }
      const schema = itemListSchema(list)
      const body = `<main><section><h1>${title}</h1><p>${description}</p></section></main>`

      html = baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale)
    }
    else {
      return htmlWithCache(c, notFoundHtml(), 'none')
    }

    return htmlWithCache(c, html, 'long')

  } catch (error) {
    console.error('[Render EN] Error:', error)
    return htmlWithCache(c, notFoundHtml(), 'none')
  }
}

// ── Endpoints espejo en inglés ───────────────────────────────────

// Película en inglés
routes.get('/movie/:slug', async (c) => {
  const slug = c.req.param('slug')
  return renderEnglishMirror(c, 'movie', slug, 'pelicula', 'movie')
})

// Serie en inglés
routes.get('/tv-show/:slug', async (c) => {
  const slug = c.req.param('slug')
  return renderEnglishMirror(c, 'tv-show', slug, 'serie', 'tv-show')
})

// Artículo en inglés
routes.get('/article/:slug', async (c) => {
  const slug = c.req.param('slug')
  return renderEnglishMirror(c, 'article', slug, 'articulo', 'article')
})

// Género en inglés
routes.get('/genre/:slug', async (c) => {
  const slug = c.req.param('slug')
  return renderEnglishMirror(c, 'genre', slug, 'genero', 'genre')
})

// Lista curada en inglés
routes.get('/list/:slug', async (c) => {
  const slug = c.req.param('slug')
  return renderEnglishMirror(c, 'list', slug, 'ranking', 'list')
})

// ── HTML 404 ─────────────────────────────────────────────────

const notFoundHtml = () => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Página no encontrada | Vimovies</title>
  <meta name="description" content="La página que buscas no existe en Vimovies.">
</head>
<body>
  <main>
    <h1>404 — Página no encontrada</h1>
    <p>La página que buscas no existe o ha sido movida.</p>
    <a href="/">Ir al inicio</a>
  </main>
</body>
</html>`

// ── Router Principal ───────────────────────────────────────────

routes.get('/*', async (c) => {
  const path = c.req.path.replace('/render', '')
  const pathParts = path.split('/').filter(Boolean)
  const locale = c.get('locale') || DEFAULT_LOCALE
  const region = c.req.query('region') ?? 'ES'

  let seo_title_es = "Vimovies - Ver Peliculas Online HD"
  let seo_title_en = "Vimovies - Watch Movies Online in HD"
  let seo_description_es = "Descubre dónde ver películas y series online, consulta sinopsis, reparto, críticas, calificaciones, rankings y las últimas noticias del cine y el streaming. Encuentra información actualizada sobre tus títulos favoritos en Vimovies."
  let seo_description_en = "Discover where to watch movies and TV shows online, check synopses, cast lists, reviews, ratings, rankings, and the latest news about film and streaming. Find up-to-date information about your favorite titles on Vimovies."

  // Si la ruta está vacía después de quitar /render, mostrar página de inicio
  if (pathParts.length === 0) {
    const title = region !== 'EN' ? seo_title_es : seo_title_en
    const description = region !== 'EN' ? seo_description_es : seo_description_en
    const canonical = 'https://vimovies.com/'
    const ogData = {
      title,
      description,
      image: 'https://vimovies.com/og-image.png',
      type: 'website',
      url: canonical
    }
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vimovies',
      url: canonical,
      description,
      publisher: {
        '@type': 'Organization',
        name: 'Vimovies',
        url: canonical
      }
    }
    const alternates = {
      es: 'https://vimovies.com/',
      en: 'https://vimovies.com/en'
    }
    const body = `
<main>
  <section>
    <h1>${region !== 'EN' ? seo_title_es : seo_title_en}</h1>
    <p>${region !== 'EN' ? seo_description_es : seo_description_en}</p>
  </section>
</main>`

    const html = baseHtml(title, description, ogData.url, ogData, {
      card: 'summary_large_image',
      site: '@vimovies',
      title: ogData.title,
      description: ogData.description,
      image: ogData.image
    }, alternates, schema, body, locale)
    return htmlWithCache(c, html, 'long')
  }

  if (pathParts.length === 1) {
  const meta = buildStaticRenderMeta(pathParts[0]!, locale)

  if (meta) {
    const body = buildStaticBody(meta.title, meta.description)
    return htmlWithCache(
      c,
      baseHtml(
        meta.title,
        meta.description,
        meta.og.url,
        meta.og,
        meta.twitter,
        meta.alternates,
        meta.schema,
        body,
        locale
      ),
      'long'
    )
  }
}

  const [section, slug] = pathParts

  console.log(`[Render] Request: section=${section}, slug=${slug}, locale=${locale}, region=${region}`)

  try {
    // Películas
    if (section === 'pelicula' && slug) {
      console.log(`[Render] Looking for movie with slug: ${slug}`)
      const media = await MediaService.findBySlugFull(slug)
      console.log(`[Render] Found media:`, media ? `${media.title_es || media.title_en} (type: ${media.media_type})` : 'null')
      
      if (media?.media_type !== 'movie') {
        console.log(`[Render] Movie not found or wrong type. media_type: ${media?.media_type}, expected: movie`)
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const isEs = locale === 'es'
      const title = isEs
        ? (media.seo_title_es || media.title_es || media.original_title)
        : (media.seo_title_en || media.title_en || media.original_title)
      const description = isEs
        ? (media.seo_description_es || media.synopsis_es || media.synopsis_en || '')
        : (media.seo_description_en || media.synopsis_en || media.synopsis_es || '')
      const canonical = `https://vimovies.com/pelicula/${media.slug}`
      const ogData = {
        title,
        description,
        image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
        type: 'video.movie',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/pelicula/${media.slug}`,
        en: `https://vimovies.com/movie/${media.slug}`
      }
      const schema = movieSchema(media, locale)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale), 'long')
    }

    // Artículos
    if (section === 'articulo' && slug) {
      const article = await ArticlesService.findBySlug(slug)
      if (!article) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = article.seo_title_es || article.title_es || article.title_en || 'Sin título'
      const description = article.seo_description_es || article.excerpt_es || article.excerpt_en || ''
      const canonical = `https://vimovies.com/articulo/${article.slug}`
      const ogData = {
        title,
        description,
        image: article.cover_image_url || '',
        type: 'article',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/articulo/${article.slug}`,
        en: `https://vimovies.com/article/${article.slug}`
      }
      const schema = articleSchema(article)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale), 'long')
    }

    // Géneros
    if (section === 'genero' && slug) {
      const genre = await GenreService.findBySlug(slug)
      if (!genre) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = `${genre.name_es} - Películas y Series`
      const description = `Las mejores películas y series de ${genre.name_es}. Descubre títulos, ratings y recomendaciones.`
      const canonical = `https://vimovies.com/genero/${genre.slug}`
      const ogData = {
        title,
        description,
        image: '',
        type: 'website',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/genero/${genre.slug}`,
        en: `https://vimovies.com/genre/${genre.slug}`
      }
      const schema = itemListSchema({ title, description, slug: genre.slug, items: [] })
      const body = `<main><section><h1>${genre.name_es}</h1><p>${description}</p></section></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale), 'long')
    }

    // Rankings
    if (section === 'ranking' && slug) {
      const list = await CuratedListsService.findBySlug(slug)
      if (!list) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = list.seo_title_es || list.title_es
      const description = list.seo_description_es || list.description_es || ''
      const canonical = `https://vimovies.com/ranking/${list.slug}`
      const ogData = {
        title,
        description,
        image: list.cover_image_url || '',
        type: 'website',
        url: canonical
      }
      const alternates = {
        es: `https://vimovies.com/ranking/${list.slug}`,
        en: `https://vimovies.com/ranking/${list.slug}`
      }
      const schema = itemListSchema(list)
      const body = `<main><section><h1>${title}</h1><p>${description}</p></section></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData.url, ogData, {
        card: 'summary_large_image',
        site: '@vimovies',
        title: ogData.title,
        description: ogData.description,
        image: ogData.image
      }, alternates, schema, body, locale), 'long')
    }

    return htmlWithCache(c, notFoundHtml(), 'none')

  } catch (error) {
    console.error('[Render] Error:', error)
    return htmlWithCache(c, notFoundHtml(), 'none')
  }
})

export default routes
