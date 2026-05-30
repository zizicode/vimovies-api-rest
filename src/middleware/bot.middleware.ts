import { MiddlewareHandler , Context, Next } from 'hono'

const BOT_AGENTS = ['googlebot', 'bingbot', 'twitterbot', 'facebookexternalhit', 'linkedinbot']
const CONTENT_ROUTES = ['/pelicula/', '/serie/', '/actor/', '/genero/', '/articulo/', '/ranking/', '/movie/', '/tv-show/', '/genre/']

export const botMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
  const userAgent = c.req.header('user-agent')?.toLowerCase() || ''
  const path = c.req.path
  
  // Detectar si es bot
  const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot))
  
  // Detectar si es ruta de contenido
  const isContentRoute = CONTENT_ROUTES.some(route => path.startsWith(route))
  
  // Si es bot y es ruta de contenido, redirigir a render interno
  if (isBot && isContentRoute) {
    try {
      // Extraer section y slug del path (manejar URLs multiidioma)
      const pathParts = path.split('/').filter(Boolean)
      const [section, slug] = pathParts
      
      if (!section || !slug) {
        return next()
      }
      
      // Normalizar section para render (movie -> pelicula, tv-show -> serie, genre -> genero)
      let normalizedSection = section
      if (section === 'movie') normalizedSection = 'pelicula'
      else if (section === 'tv-show') normalizedSection = 'serie'
      else if (section === 'genre') normalizedSection = 'genero'
      
      // Construir URL de render interno
      const port = process.env.PORT || '3000'
      const region = c.req.query('region') || 'ES'
      const locale = c.get('locale') || 'es'
      const renderUrl = `http://localhost:${port}/render/${normalizedSection}/${slug}?region=${region}`
      
      console.log(`[Bot Middleware] Redirecting bot to: ${renderUrl} (locale: ${locale})`)
      
      // Hacer fetch interno
      const response = await fetch(renderUrl, {
        headers: {
          'User-Agent': c.req.header('user-agent') || '',
          'X-Forwarded-For': c.req.header('x-forwarded-for') || '',
          'X-Real-IP': c.req.header('x-real-ip') || '',
          'X-Bot-Request': 'true',
          'X-Locale': locale
        }
      })
      
      if (!response.ok) {
        console.error(`[Bot Middleware] Render error: ${response.status}`)
        return next()
      }
      
      const html = await response.text()
      return c.html(html)
      
    } catch (error) {
      console.error('[Bot Middleware] Error:', error)
      return next()
    }
  }
  
  // Si no es bot o no es ruta de contenido, continuar normal
  await next()
}
