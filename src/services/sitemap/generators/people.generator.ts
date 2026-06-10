import { buildUrl, buildUrlEntry, wrapUrlset } from '../sitemap.utils'
import { fetchAllPersonSlugs } from '../sitemap.fetchers'

export async function generatePeopleSitemap(base: string): Promise<string> {
  const people = await fetchAllPersonSlugs()
  const entries: string[] = []

  for (const person of people) {
    const esUrl = buildUrl(base, `/actor/${person.slug}`)
    const enUrl = buildUrl(base, `/person/${person.slug}`)

    // Entrada ES
    entries.push(buildUrlEntry({
      loc: esUrl,
      lastmod: person.updated_at,
      changefreq: 'monthly',
      priority: 0.7,
      esUrl,
      enUrl
    }))

    // Entrada EN
    entries.push(buildUrlEntry({
      loc: enUrl,
      lastmod: person.updated_at,
      changefreq: 'monthly',
      priority: 0.7,
      esUrl,
      enUrl
    }))
  }

  return wrapUrlset(entries)
}
