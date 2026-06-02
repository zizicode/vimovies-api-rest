import { Hono } from 'hono'

import { SupportedLocale, DEFAULT_LOCALE } from '../middleware/locale.middleware'
import { ArticlesService } from '../services/articles.service'
import { CuratedListsService } from '../services/curated-list.service'
import { GenreService } from '../services/genres.service'
import { MediaService } from '../services/media.service'
import { htmlWithCache } from '../utils/response'
import '../types/hono.type'

const routes = new Hono()

// ── Plantilla HTML Base ───────────────────────────────────────

const baseHtml = (title: string, description: string, ogData: any, schema: any, body: string, locale: SupportedLocale = DEFAULT_LOCALE) => `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${ogData.title}">
  <meta property="og:description" content="${ogData.description}">
  <meta property="og:image" content="${ogData.image}">
  <meta property="og:type" content="${ogData.type}">
  <meta property="og:url" content="${ogData.url}">
  <meta property="og:locale" content="${locale === 'es' ? 'es_ES' : 'en_US'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogData.title}">
  <meta name="twitter:description" content="${ogData.description}">
  <meta name="twitter:image" content="${ogData.image}">
  <link rel="canonical" href="${ogData.url}">
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
  const [section, slug] = pathParts
  const locale = c.get('locale') || DEFAULT_LOCALE
  const region = c.req.query('region') ?? 'ES'

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
      const ogData = {
        title,
        description,
        image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
        type: 'video.movie',
        url: `https://vimovies.com/${isEs ? 'pelicula' : 'movie'}/${media.slug}`
      }
      const schema = movieSchema(media, locale)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData, schema, body, locale), 'long')
    }

    // Series
    if (section === 'serie' && slug) {
      console.log(`[Render] Looking for series with slug: ${slug}`)
      const media = await MediaService.findBySlugFull(slug)
      console.log(`[Render] Found media:`, media ? `${media.title_es || media.title_en} (type: ${media.media_type})` : 'null')
      
      if (media?.media_type !== 'series') {
        console.log(`[Render] Series not found or wrong type. media_type: ${media?.media_type}, expected: series`)
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = media.seo_title_es || media.title_es || media.original_title
      const description = media.seo_description_es || media.synopsis_es || media.synopsis_en || ''
      const ogData = {
        title,
        description,
        image: media.poster_path ? `https://image.tmdb.org/t/p/w780${media.poster_path}` : '',
        type: 'video.tv_show',
        url: `https://vimovies.com/serie/${media.slug}`
      }
      const schema = tvSeriesSchema(media)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData, schema, body), 'long')
    }

    // Artículos
    if (section === 'articulo' && slug) {
      const article = await ArticlesService.findBySlug(slug)
      if (!article) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = article.seo_title_es || article.title_es || article.title_en || 'Sin título'
      const description = article.seo_description_es || article.excerpt_es || article.excerpt_en || ''
      const ogData = {
        title,
        description,
        image: article.cover_image_url || '',
        type: 'article',
        url: `https://vimovies.com/articulo/${article.slug}`
      }
      const schema = articleSchema(article)
      const body = `<main><article><h1>${title}</h1><p>${description}</p></article></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData, schema, body), 'long')
    }

    // Géneros
    if (section === 'genero' && slug) {
      const genre = await GenreService.findBySlug(slug)
      if (!genre) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = `${genre.name_es} - Películas y Series`
      const description = `Las mejores películas y series de ${genre.name_es}. Descubre títulos, ratings y recomendaciones.`
      const ogData = {
        title,
        description,
        image: '',
        type: 'website',
        url: `https://vimovies.com/genero/${genre.slug}`
      }
      const schema = itemListSchema({ title, description, slug: genre.slug, items: [] })
      const body = `<main><section><h1>${genre.name_es}</h1><p>${description}</p></section></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData, schema, body), 'long')
    }

    // Rankings
    if (section === 'ranking' && slug) {
      const list = await CuratedListsService.findBySlug(slug)
      if (!list) {
        return htmlWithCache(c, notFoundHtml(), 'none')
      }

      const title = list.seo_title_es || list.title_es
      const description = list.seo_description_es || list.description_es || ''
      const ogData = {
        title,
        description,
        image: list.cover_image_url || '',
        type: 'website',
        url: `https://vimovies.com/ranking/${list.slug}`
      }
      const schema = itemListSchema(list)
      const body = `<main><section><h1>${title}</h1><p>${description}</p></section></main>`

      return htmlWithCache(c, baseHtml(title, description, ogData, schema, body), 'long')
    }

    return htmlWithCache(c, notFoundHtml(), 'none')

  } catch (error) {
    console.error('[Render] Error:', error)
    return htmlWithCache(c, notFoundHtml(), 'none')
  }
})

export default routes
