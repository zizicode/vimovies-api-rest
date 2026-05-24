import { Hono } from 'hono'
import { mediaRoutes } from './media.routes'

// ── Router ───────────────────────────────────────────────────

const routes = new Hono()

routes.route('/movie', mediaRoutes)

export default routes