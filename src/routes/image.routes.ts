import { Hono } from 'hono'

import { notFound } from '@/utils'

const routes = new Hono()

// Proxy simple de imágenes de TMDB para desarrollo
routes.get('/t/p/:size/:filename', async (c) => {
  const { size, filename } = c.req.param()

  try {
    const tmdbUrl = `https://image.tmdb.org/t/p/${size}/${filename}`

    const response = await fetch(tmdbUrl, {
      headers: {
        'User-Agent': 'Vimovies-Image-Proxy/1.0'
      }
    })

    if (!response.ok) {
      return notFound(c, 'Image not found')
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Image-Proxy': 'tmdb'
      }
    })

  } catch (error) {
    console.error('[Image Proxy] Error:', error)
    return notFound(c, 'Image not found')
  }
})

export default routes
