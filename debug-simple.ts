import { createClient } from '@supabase/supabase-js'

// Crear cliente sin WebSocket
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  {
    realtime: {
      ws: undefined
    }
  }
)

async function debugMedia() {
  console.log('=== Debug Media ===')
  
  // Verificar todas las películas
  const { data: movies, error: moviesError } = await supabase
    .from('media')
    .select('slug, title_es, original_title, media_type, status')
    .eq('media_type', 'movie')
    .limit(10)
  
  if (moviesError) {
    console.error('Error fetching movies:', moviesError)
    return
  }
  
  console.log('Movies found:', movies?.length || 0)
  movies?.forEach(movie => {
    console.log(`- ${movie.slug} (${movie.title_es || movie.original_title})`)
  })
  
  // Verificar series
  const { data: series, error: seriesError } = await supabase
    .from('media')
    .select('slug, title_es, original_title, media_type, status')
    .eq('media_type', 'series')
    .limit(10)
  
  if (seriesError) {
    console.error('Error fetching series:', seriesError)
    return
  }
  
  console.log('Series found:', series?.length || 0)
  series?.forEach(serie => {
    console.log(`- ${serie.slug} (${serie.title_es || serie.original_title})`)
  })
  
  // Buscar slugs específicos que están fallando
  const testSlugs = ['inception', 'Saul']
  
  for (const slug of testSlugs) {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('slug', slug)
      .single()
    
    console.log(`\nTesting slug "${slug}":`)
    if (error) {
      console.log(`- Error: ${error.message}`)
    } else if (data) {
      console.log(`- Found: ${data.title_es || data.original_title} (${data.media_type})`)
    } else {
      console.log(`- Not found`)
    }
  }
}

debugMedia().catch(console.error)
