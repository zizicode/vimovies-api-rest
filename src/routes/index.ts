import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const routes = new Hono()

routes.post(
  '/movies',
  zValidator(
    'json',
    z.object({
      title: z.string(),
      year: z.number()
    })
  ),
  async (c) => {
    const body = c.req.valid('json')

    return c.json({
      success: true,
      data: body
    })
  }
)

export default routes