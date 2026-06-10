import type { Context } from 'hono'
import { z } from 'zod'

import { MovieRepository, PersonRepository, CreditsRepository } from './repositories'
import type { MovieDetails, Credits } from './tmdb.type'

import { ApiResponse } from '@/utils'


const PersonIdSchema = z.coerce.number().int().positive()

export class MovieController {
    static async getById(c: Context) {
        try {
            const id = Number(c.req.param('id'))

            if (!id || Number.isNaN(id)) {
                return c.json(
                    {
                        success: false,
                        error: 'Invalid movie id',
                    },
                    400
                )
            }

            const movie = await MovieRepository.getById(id) as unknown as ApiResponse<MovieDetails>;
            return c.json(movie, movie.success ? 200 : movie.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Internal server error',
                },
                500
            )
        }
    }

    static async getPopular(c: Context) {
        try {
            const page = Number(c.req.query('page') ?? 1)

            const movies = await MovieRepository.getPopular(page)
            return c.json(movies, movies.success ? 200 : movies.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Internal server error',
                },
                500
            )
        }
    }

    static async search(c: Context) {
        try {
            const query = c.req.query('query')

            if (!query) {
                return c.json(
                    {
                        success: false,
                        error: 'Query parameter is required',
                    },
                    400
                )
            }

            const page = Number(c.req.query('page') ?? 1)

            const result = await MovieRepository.search(query, page)

            return c.json(result, result.success ? 200 : result.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Internal server error',
                },
                500
            )
        }
    }
}

export class PersonController {
    static async getPersonById(c: Context): Promise<any> {
        try {
            const id = PersonIdSchema.parse(c.req.param('id'))
            const person = await PersonRepository.getPersonById(id);
            console.log(person.data?.place_of_birth)
            return c.json(person, person.success ? 200 : person.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof z.ZodError
                            ? 'Invalid person id'
                            : error instanceof Error
                                ? error.message
                                : 'Internal server error',
                },
                error instanceof z.ZodError ? 400 : 500
            )
        }
    }
}

export class CreditsController {
    static async getById(c: Context) {
        try {
            const id = Number(c.req.param('id'))

            if (!id || Number.isNaN(id)) {
                return c.json(
                    {
                        success: false,
                        error: 'Invalid movie id',
                    },
                    400
                )
            }

            const movie = await CreditsRepository.getCreditsById(id) as ApiResponse<Credits>;
            return c.json(movie, movie.success ? 200 : movie.status as 500)
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Internal server error',
                },
                500
            )
        }
    }
}