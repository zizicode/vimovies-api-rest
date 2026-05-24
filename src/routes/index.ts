import { Hono } from 'hono'
import { mediaRoutes } from './media.routes'
import { genresRoutes } from './genres.routes'
import { peopleRoutes } from './persons.routes'
import { platformsRoutes } from './platforms.routes'
import { articlesRoutes } from './articles.routes'
import { curatedListsRoutes } from './curated-lists.routes'

// ── Router ───────────────────────────────────────────────────

const routes = new Hono()

routes.route('/movie', mediaRoutes)
routes.route('/genre', genresRoutes)
routes.route('/person', peopleRoutes)
routes.route('/platform', platformsRoutes)
routes.route('/article', articlesRoutes)
routes.route('/list', curatedListsRoutes)

export default routes