import { Hono } from 'hono'

import { CreditsController, MovieController, PersonController } from './controllers'

export const movieRoutes = new Hono()
export const personRoutes = new Hono()
export const creditsRoutes = new Hono()

// GET /tmdb/credits/:id
creditsRoutes.get('/:id', CreditsController.getById)

// GET /tmdb/movies/popular
movieRoutes.get('/popular', MovieController.getPopular)

// GET /tmdb/movies/search
movieRoutes.get('/search', MovieController.search)

// GET /tmdb/movies/:id
movieRoutes.get('/:id', MovieController.getById)

// GET /tmdb/people/:id
personRoutes.get('/:id', PersonController.getPersonById)