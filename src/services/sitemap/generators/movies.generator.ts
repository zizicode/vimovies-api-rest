import { buildUrl, buildUrlEntry, wrapUrlset } from '../sitemap.utils'
import { fetchAllMovieSlugs } from '../sitemap.fetchers'

export async function generateMoviesSitemap(base: string): Promise<string> {
  const movies = await fetchAllMovieSlugs()
  const entries: string[] = []

  for (const movie of movies) {
    const esUrl = buildUrl(base, `/pelicula/${movie.slug}`)
    const enUrl = buildUrl(base, `/movie/${movie.slug}`)

    // Entrada ES
    entries.push(buildUrlEntry({
      loc: esUrl,
      lastmod: movie.updated_at,
      changefreq: 'monthly',
      priority: 0.8,
      esUrl,
      enUrl
    }))

    // Entrada EN
    entries.push(buildUrlEntry({
      loc: enUrl,
      lastmod: movie.updated_at,
      changefreq: 'monthly',
      priority: 0.8,
      esUrl,
      enUrl
    }))
  }

  return wrapUrlset(entries)
}
