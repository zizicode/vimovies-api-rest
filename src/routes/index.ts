import { Hono } from 'hono'

import { articlesRoutes } from './articles.routes'
import authRoutes from './auth.routes'
import { curatedListsRoutes } from './curated-lists.routes'
import { dashboardRoutes } from './dashboard.routes'
import debugRoutes from './debug.routes'
import { genresRoutes } from './genres.routes'
import { mediaRoutes } from './media.routes'
import { peopleRoutes } from './persons.routes'
import { platformsRoutes } from './platforms.routes'
import renderRoutes from './render.routes'
import { syncRoutes } from './sync.routes'
// import { creditsRoutes, movieRoutes, personRoutes } from '../module/tmdb/routes'

// ── Router ───────────────────────────────────────────────────

export const router = new Hono()

// ── Public Routes ───────────────────────────────────────────────

// Media (movies/series)
router.route('/media', mediaRoutes)

// Genres
router.route('/genres', genresRoutes)

// People (actors, directors)
router.route('/people', peopleRoutes)

// Platforms (streaming)
router.route('/platforms', platformsRoutes)

// Articles (SEO content)
router.route('/articles', articlesRoutes)

// Curated Lists (rankings, collections)
router.route('/lists', curatedListsRoutes)

// TMDB API integration
// router.route('/tmdb', movieRoutes)
// router.route('/tmdb', personRoutes)
// router.route('/tmdb', creditsRoutes)

// Authentication routes
router.route('/auth', authRoutes)

// Bot rendering routes (SEO)
router.route('/render', renderRoutes)

// Debug Routes (temporal para testing)
router.route('/debug', debugRoutes)

// ── Admin Routes ────────────────────────────────────────────────

// Dashboard stats
router.route('/admin/dashboard', dashboardRoutes)

// Sync operations
router.route('/admin/sync', syncRoutes)

// Admin media routes (included in mediaRoutes with auth middleware)
// Admin genres routes (included in genresRoutes with auth middleware)
// Admin people routes (included in peopleRoutes with auth middleware)
// Admin platforms routes (included in platformsRoutes with auth middleware)
// Admin articles routes (included in articlesRoutes with auth middleware)
// Admin lists routes (included in curatedListsRoutes with auth middleware)

// ── Health Check ────────────────────────────────────────────────

router.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// ── 404 Handler ───────────────────────────────────────────────────

router.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${c.req.method} ${c.req.path} not found`
  }, 404)
})

// ── Error Handler ───────────────────────────────────────────────────

router.onError((err, c) => {
  console.error('Error:', err)
  
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'Something went wrong'
  }, 500)
})
