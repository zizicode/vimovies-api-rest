import type { Server } from 'node:http'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { env } from './config/env'
import { botMiddleware } from './middleware/bot.middleware'
import { localeMiddleware } from './middleware/locale.middleware'
import { router as routes } from './routes'
import imageRoutes from './routes/image.routes'
import renderRoutes from './routes/render.routes'
import sitemapRoutes from './routes/sitemap.routes'
import { initializeSocket } from './socket'
import seoRoutes from './routes/seo.routes'

const app = new Hono()

app.use('*', cors({
  origin: [
    // 'https://www.vimovies.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true
}))

// Middleware de detección de idioma (primero)
app.use('*', localeMiddleware)

// Middleware de detección de bots
app.use('*', botMiddleware)

// Rutas SEO (antes de las rutas de API)
app.route('/render', renderRoutes)
app.route('/', sitemapRoutes) // sitemap.xml y robots.txt en raíz
app.route('/image', imageRoutes)

// Rutas de API existentes
app.route('/api', routes)

// Health check保持
app.route('/', seoRoutes)

const server = serve({
  fetch: app.fetch,
  port: env.PORT
}, (info) => {
  console.log(`[API] Running on http://localhost:${info.port}/api`)
})

initializeSocket(server as Server)
