import { buildUrl, buildUrlEntry, wrapUrlset } from '../sitemap.utils'

// Rutas estáticas verificadas contra web/src/router/index.tsx
const STATIC_PAGES = [
  // Home (misma URL para ambos idiomas)
  { esPath: '/', enPath: '/', priority: 1.0, changefreq: 'daily' },

  // Listados
  { esPath: '/peliculas', enPath: '/movies', priority: 0.9, changefreq: 'daily' },
  { esPath: '/actores', enPath: '/actors', priority: 0.8, changefreq: 'weekly' },
  { esPath: '/generos', enPath: '/genres', priority: 0.7, changefreq: 'monthly' },
  { esPath: '/articulos', enPath: '/articles', priority: 0.8, changefreq: 'daily' },

  // Informativas
  { esPath: '/sobre-nosotros', enPath: '/about-us', priority: 0.5, changefreq: 'yearly' },
  { esPath: '/contacto', enPath: '/contacto', priority: 0.5, changefreq: 'yearly' },

  // Legales
  { esPath: '/terminos', enPath: '/terms', priority: 0.3, changefreq: 'yearly' },
  { esPath: '/privacidad', enPath: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { esPath: '/cookies', enPath: '/cookies', priority: 0.3, changefreq: 'yearly' },
]

export async function generateStaticSitemap(base: string): Promise<string> {
  const entries: string[] = []

  for (const page of STATIC_PAGES) {
    const esUrl = buildUrl(base, page.esPath)
    const enUrl = buildUrl(base, page.enPath)

    // Generar entrada ES
    entries.push(buildUrlEntry({
      loc: esUrl,
      changefreq: page.changefreq,
      priority: page.priority,
      esUrl,
      enUrl
    }))

    // Generar entrada EN si es diferente de ES
    if (page.enPath !== page.esPath) {
      entries.push(buildUrlEntry({
        loc: enUrl,
        changefreq: page.changefreq,
        priority: page.priority,
        esUrl,
        enUrl
      }))
    }
  }

  return wrapUrlset(entries)
}
