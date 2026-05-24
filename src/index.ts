import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from './config/env'
import routes from './routes'
import { initSocket } from './socket'
import { initCronJobs } from './cron/jobs'
import type { Server } from 'node:http'

const app = new Hono()

app.use('*', cors({
  origin: [
    'https://www.vimovies.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}))

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'API running'
  })
})

app.route('/api', routes)

const server = serve({
  fetch: app.fetch,
  port: env.PORT
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
})

initSocket(server as Server)
initCronJobs()
