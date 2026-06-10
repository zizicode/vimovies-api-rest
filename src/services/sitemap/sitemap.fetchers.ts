import { MediaService } from '../media.service'
import { GenreService } from '../genres.service'
import { ArticlesService } from '../articles.service'
import { PersonService } from '../persons.service'
import { MediaType, ContentStatus } from '@/enums'

// Patrón genérico de paginación
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; total: number }>,
  perPage: number = 100
): Promise<T[]> {
  const results: T[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const { data, total } = await fetchPage(page)
      results.push(...data)
      hasMore = (page * perPage) < total && data.length > 0
      page++
    } catch (error) {
      console.error(`[Sitemap] Error fetching page ${page}:`, error)
      break
    }
  }

  return results
}

// Fetch all movie slugs
export async function fetchAllMovieSlugs(): Promise<Array<{ slug: string; updated_at?: string }>> {
  const movies = await fetchAllPages(
    (page) => MediaService.findAll({
      page,
      per_page: 100,
      media_type: MediaType.Movie,
      status: ContentStatus.Published,
      noindex: false
    }),
    100
  )

  return movies.map((m: any) => ({
    slug: m.slug,
    updated_at: m.updated_at
  }))
}

// Fetch all person slugs
export async function fetchAllPersonSlugs(): Promise<Array<{ slug: string; updated_at?: string }>> {
  const people = await fetchAllPages(
    (page) => PersonService.findAll(page, 100),
    100
  )

  return people.map((p: any) => ({
    slug: p.slug,
    updated_at: p.updated_at
  }))
}

// Fetch all genre slugs
export async function fetchAllGenreSlugs(): Promise<Array<{ slug: string; updated_at?: string }>> {
  const genres = await fetchAllPages(
    (page) => GenreService.findAll({ page, per_page: 100 }),
    100
  )

  return genres.map((g: any) => ({
    slug: g.slug,
    updated_at: g.updated_at
  }))
}

// Fetch all article slugs
export async function fetchAllArticleSlugs(): Promise<Array<{ slug: string; published_at?: string }>> {
  const articles = await fetchAllPages(
    (page) => ArticlesService.findAll({
      page,
      per_page: 100,
      status: ContentStatus.Published
    }),
    100
  )

  return articles.map((a: any) => ({
    slug: a.slug,
    published_at: a.published_at || undefined
  }))
}
