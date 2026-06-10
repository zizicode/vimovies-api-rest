import { buildUrl, buildUrlEntry, wrapUrlset } from '../sitemap.utils'
import { fetchAllGenreSlugs } from '../sitemap.fetchers'

export async function generateGenresSitemap(base: string): Promise<string> {
  const genres = await fetchAllGenreSlugs()
  const entries: string[] = []

  for (const genre of genres) {
    const esUrl = buildUrl(base, `/genero/${genre.slug}`)
    const enUrl = buildUrl(base, `/genre/${genre.slug}`)

    // Entrada ES
    entries.push(buildUrlEntry({
      loc: esUrl,
      lastmod: genre.updated_at,
      changefreq: 'weekly',
      priority: 0.6,
      esUrl,
      enUrl
    }))

    // Entrada EN
    entries.push(buildUrlEntry({
      loc: enUrl,
      lastmod: genre.updated_at,
      changefreq: 'weekly',
      priority: 0.6,
      esUrl,
      enUrl
    }))
  }

  return wrapUrlset(entries)
}
