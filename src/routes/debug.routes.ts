import { Hono } from 'hono'

import { supabase } from '../config/supabase'

const routes = new Hono()

// Endpoint temporal para debug de películas
routes.get('/media', async (c) => {
  try {
    // Verificar todas las películas
    const { data: movies, error: moviesError } = await supabase
      .from('media')
      .select('slug, title_es, original_title, media_type, status')
      .eq('media_type', 'movie')
      .limit(20)
    
    if (moviesError) {
      return c.json({ error: moviesError.message }, 500)
    }
    
    // Verificar series
    const { data: series, error: seriesError } = await supabase
      .from('media')
      .select('slug, title_es, original_title, media_type, status')
      .eq('media_type', 'series')
      .limit(20)
    
    if (seriesError) {
      return c.json({ error: seriesError.message }, 500)
    }
    
    return c.json({
      movies: movies || [],
      series: series || [],
      total_movies: movies?.length || 0,
      total_series: series?.length || 0
    })
    
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

// Buscar slug específico
routes.get('/media/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      return c.json({ 
        found: false, 
        error: error.message,
        slug 
      })
    }
    
    return c.json({ 
      found: true, 
      media: data,
      slug 
    })
    
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})

export default routes
