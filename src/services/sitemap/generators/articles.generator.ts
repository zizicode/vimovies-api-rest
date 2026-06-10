import { buildUrl, buildUrlEntry, wrapUrlset } from '../sitemap.utils'
import { fetchAllArticleSlugs } from '../sitemap.fetchers'

export async function generateArticlesSitemap(base: string): Promise<string> {
  const articles = await fetchAllArticleSlugs()
  const entries: string[] = []

  for (const article of articles) {
    const esUrl = buildUrl(base, `/articulo/${article.slug}`)
    const enUrl = buildUrl(base, `/article/${article.slug}`)

    // Entrada ES
    entries.push(buildUrlEntry({
      loc: esUrl,
      lastmod: article.published_at,
      changefreq: 'monthly',
      priority: 0.7,
      esUrl,
      enUrl
    }))

    // Entrada EN
    entries.push(buildUrlEntry({
      loc: enUrl,
      lastmod: article.published_at,
      changefreq: 'monthly',
      priority: 0.7,
      esUrl,
      enUrl
    }))
  }

  return wrapUrlset(entries)
}
