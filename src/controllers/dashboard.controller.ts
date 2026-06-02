import { Context } from 'hono'

import { supabase } from '@/config/supabase'
import { ok, serverError } from '@/utils'

export const DashboardController = {
  
  /**
   * GET /api/dashboard/stats
   * Obtener estadísticas generales del dashboard
   */
  async getStats(c: Context) {
    try {
      console.log('[Dashboard] Fetching stats...');

      // Obtener conteos de películas por estado
      const { data: mediaStats, error: mediaError } = await supabase
        .from('media')
        .select('status', { count: 'exact' })

      console.log('[Dashboard] Media stats:', mediaStats, 'Error:', mediaError);

      if (mediaError) {
        console.error('Error fetching media stats:', mediaError)
        return serverError(c, mediaError)
      }

      // Contar películas por estado
      const statusCounts = {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
      }

      if (mediaStats) {
        // Si no hay datos, usar valores por defecto
        const allMedia = Array.isArray(mediaStats) ? mediaStats : []

        statusCounts.total = allMedia.length
        statusCounts.published = allMedia.filter((m: any) => m.status === 'published').length
        statusCounts.draft = allMedia.filter((m: any) => m.status === 'draft').length
        statusCounts.archived = allMedia.filter((m: any) => m.status === 'archived').length
      }

      console.log('[Dashboard] Status counts:', statusCounts);

      // Obtener conteos de artículos por estado
      const { data: articleStats, error: articleError } = await supabase
        .from('articles')
        .select('status', { count: 'exact' })

      if (articleError) {
        console.error('Error fetching article stats:', articleError)
        return serverError(c, articleError)
      }

      // Contar artículos por estado
      const articleStatusCounts = {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
      }

      if (articleStats) {
        const allArticles = Array.isArray(articleStats) ? articleStats : []

        articleStatusCounts.total = allArticles.length
        articleStatusCounts.published = allArticles.filter((a: any) => a.status === 'published').length
        articleStatusCounts.draft = allArticles.filter((a: any) => a.status === 'draft').length
        articleStatusCounts.archived = allArticles.filter((a: any) => a.status === 'archived').length
      }

      // Obtener conteos de personas y géneros
      const [peopleCount, genresCount, platformsCount] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('genres').select('id', { count: 'exact', head: true }),
        supabase.from('platforms').select('id', { count: 'exact', head: true })
      ])

      console.log('[Dashboard] Counts - People:', peopleCount.count, 'Genres:', genresCount.count, 'Platforms:', platformsCount.count);

      const response = {
        // Estadísticas de películas
        movies: {
          total: statusCounts.total,
          published: statusCounts.published,
          draft: statusCounts.draft,
          archived: statusCounts.archived
        },

        // Estadísticas de artículos
        articles: {
          total: articleStatusCounts.total,
          published: articleStatusCounts.published,
          draft: articleStatusCounts.draft,
          archived: articleStatusCounts.archived
        },

        // Otros conteos
        people: peopleCount.count || 0,
        genres: genresCount.count || 0,
        platforms: platformsCount.count || 0,

        // Timestamp
        lastUpdated: new Date().toISOString()
      };

      console.log('[Dashboard] Response:', response);

      return ok(c, response)

    } catch (error) {
      console.error('Dashboard stats error:', error)
      return serverError(c, error)
    }
  }
}
