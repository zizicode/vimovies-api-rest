import { Hono } from 'hono'

import { supabase } from '../config/supabase'

const routes = new Hono()

// ── Helper Functions ───────────────────────────────────────

const getPriorityNumber = (priority: string): number => {
  switch (priority) {
    case 'critical': return 1.0
    case 'high': return 0.9
    case 'medium': return 0.7
    case 'low': return 0.5
    case 'minimal': return 0.3
    default: return 0.7
  }
}

const generateSitemapIndex = (sitemaps: string[]): string => {
  const entries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>https://vimovies.com/${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`
}

const generateUrlSet = (urls: Array<{loc: string, lastmod?: string, priority?: number}>): string => {
  const entries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`
}

// ── Sitemap Index ───────────────────────────────────────────

routes.get('/sitemap.xml', async (c) => {
  const sitemaps = [
    'sitemap-peliculas.xml',
    'sitemap-peliculas-en.xml',
    'sitemap-series.xml',
    'sitemap-series-en.xml',
    'sitemap-actores.xml',
    'sitemap-actores-en.xml',
    'sitemap-generos.xml',
    'sitemap-generos-en.xml',
    'sitemap-articulos.xml',
    'sitemap-articulos-en.xml',
    'sitemap-plataformas.xml',
    'sitemap-plataformas-en.xml',
    'sitemap-listas.xml',
    'sitemap-listas-en.xml'
  ]

  const xml = generateSitemapIndex(sitemaps)
  
  return c.text(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600'
  })
})

// ── Sitemap de Películas ─────────────────────────────────────

routes.get('/sitemap-peliculas.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('slug, updated_at, sitemap_priority')
      .eq('media_type', 'movie')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('tmdb_popularity', { ascending: false })
      .limit(5000)

    if (error) throw error

    const items = (data || []).map(item => ({
      slug: item.slug,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: getPriorityNumber(item.sitemap_priority || 'medium')
    }))

    // Solo versión en español
    const urls = items.map(item => ({
      loc: `https://vimovies.com/pelicula/${item.slug}`,
      lastmod: item.lastmod,
      priority: item.priority
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating movies sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// Sitemap de películas en inglés
routes.get('/sitemap-peliculas-en.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('slug, updated_at, sitemap_priority')
      .eq('media_type', 'movie')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('tmdb_popularity', { ascending: false })
      .limit(5000)

    if (error) throw error

    const items = (data || []).map(item => ({
      slug: item.slug,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: Math.max(0.1, getPriorityNumber(item.sitemap_priority || 'medium') - 0.1)
    }))

    // Solo versión en inglés
    const urls = items.map(item => ({
      loc: `https://vimovies.com/movie/${item.slug}`,
      lastmod: item.lastmod,
      priority: item.priority
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating movies EN sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Series ───────────────────────────────────────

routes.get('/sitemap-series.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('slug, updated_at, sitemap_priority')
      .eq('media_type', 'tv')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('tmdb_popularity', { ascending: false })
      .limit(5000)

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/serie/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: getPriorityNumber(item.sitemap_priority || 'medium')
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating series sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Actores ───────────────────────────────────────

routes.get('/sitemap-actores.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('people')
      .select('slug, updated_at, sitemap_priority')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('popularity', { ascending: false })
      .limit(5000)

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/actor/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: getPriorityNumber(item.sitemap_priority || 'medium')
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating actors sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Géneros ───────────────────────────────────────

routes.get('/sitemap-generos.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('name', { ascending: true })

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/genero/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: 0.8
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating genres sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Artículos ─────────────────────────────────────

routes.get('/sitemap-articulos.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('slug, updated_at, sitemap_priority')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('published_at', { ascending: false })
      .limit(5000)

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/articulo/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: getPriorityNumber(item.sitemap_priority || 'medium')
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating articles sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Plataformas ───────────────────────────────────

routes.get('/sitemap-plataformas.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/plataforma/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: 0.6
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating platforms sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Sitemap de Listas ─────────────────────────────────────────

routes.get('/sitemap-listas.xml', async (c) => {
  try {
    const { data, error } = await supabase
      .from('curated_lists')
      .select('slug, updated_at, sitemap_priority')
      .eq('status', 'published')
      .eq('noindex', false)
      .order('is_featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(5000)

    if (error) throw error

    const urls = (data || []).map(item => ({
      loc: `https://vimovies.com/lista/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      priority: getPriorityNumber(item.sitemap_priority || 'medium')
    }))

    const xml = generateUrlSet(urls)
    
    return c.text(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    })

  } catch (error) {
    console.error('[Sitemap] Error generating lists sitemap:', error)
    return c.text(generateUrlSet([]), 200, {
      'Content-Type': 'application/xml; charset=utf-8'
    })
  }
})

// ── Robots.txt ─────────────────────────────────────────────

routes.get('/robots.txt', (c) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /admin/
Sitemap: https://vimovies.com/sitemap.xml`

  return c.text(robotsTxt, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400'
  })
})

export default routes
