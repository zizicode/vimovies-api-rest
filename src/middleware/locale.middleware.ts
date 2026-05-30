import { MiddlewareHandler , Context, Next } from 'hono'

// Idiomas soportados
export const SUPPORTED_LOCALES = ['es', 'en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// Locale por defecto
export const DEFAULT_LOCALE: SupportedLocale = 'es'

// Mapeo de regiones a locale
const REGION_TO_LOCALE: Record<string, SupportedLocale> = {
  'ES': 'es',    // España
  'MX': 'es',    // México
  'AR': 'es',    // Argentina
  'CO': 'es',    // Colombia
  'US': 'en',    // Estados Unidos
  'GB': 'en',    // Reino Unido
  'CA': 'en',    // Canadá
  'AU': 'en',    // Australia
  'NZ': 'en',    // Nueva Zelanda
  'IE': 'en',    // Irlanda
  'ZA': 'en',    // Sudáfrica
}

// User-Agent patterns para detectar idioma
const LOCALE_PATTERNS = {
  'es': [
    /es[-_][A-Z]{2}/i,           // es-ES, es-MX, etc.
    /spanish/i,
    /español/i,
    /googlebot\.es/i,
    /bingbot\.es/i
  ],
  'en': [
    /en[-_][A-Z]{2}/i,           // en-US, en-GB, etc.
    /english/i,
    /googlebot/i,                // Default googlebot es inglés
    /bingbot/i                   // Default bingbot es inglés
  ]
}

// Detectar idioma desde Accept-Language header
function detectFromAcceptLanguage(acceptLanguage: string): SupportedLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  
  // Extraer idiomas preferidos (ej: "es-ES,es;q=0.9,en;q=0.8")
  const languages = acceptLanguage.split(',').map(lang => {
    const [locale] = lang.trim().split(';')
    return locale?.toLowerCase() || ''
  })
  
  // Buscar primer idioma soportado
  for (const lang of languages) {
    if (lang.startsWith('es')) return 'es'
    if (lang.startsWith('en')) return 'en'
  }
  
  return DEFAULT_LOCALE
}

// Detectar idioma desde User-Agent
function detectFromUserAgent(userAgent: string): SupportedLocale {
  if (!userAgent) return DEFAULT_LOCALE
  
  const ua = userAgent.toLowerCase()
  
  // Revisar patterns específicos
  for (const [locale, patterns] of Object.entries(LOCALE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(ua)) {
        return locale as SupportedLocale
      }
    }
  }
  
  return DEFAULT_LOCALE
}

// Detectar idioma desde URL path
function detectFromPath(path: string): SupportedLocale | null {
  const match = path.match(/^\/(es|en)\//)
  return match ? match[1] as SupportedLocale : null
}

export const localeMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
  const path = c.req.path
  const userAgent = c.req.header('user-agent') || ''
  const acceptLanguage = c.req.header('accept-language') || ''
  const queryRegion = c.req.query('region')
  
  let detectedLocale: SupportedLocale = DEFAULT_LOCALE
  let source: string = 'default'
  
  // 1. Prioridad: Path (/es/pelicula/inception, /en/pelicula/inception)
  const pathLocale = detectFromPath(path)
  if (pathLocale) {
    detectedLocale = pathLocale
    source = 'path'
  }
  // 2. Segunda: Query param (?region=ES, ?region=US)
  else if (queryRegion) {
    const localeFromRegion = REGION_TO_LOCALE[queryRegion.toUpperCase()]
    if (localeFromRegion) {
      detectedLocale = localeFromRegion
      source = 'query'
    }
  }
  // 3. Tercera: Accept-Language header
  else {
    detectedLocale = detectFromAcceptLanguage(acceptLanguage)
    source = 'accept-language'
  }
  
  // 4. Para bots, priorizar User-Agent sobre Accept-Language
  if (userAgent.includes('bot')) {
    const uaLocale = detectFromUserAgent(userAgent)
    if (uaLocale !== DEFAULT_LOCALE) {
      detectedLocale = uaLocale
      source = 'user-agent'
    }
  }
  
  // Almacenar en contexto para uso posterior
  c.set('locale', detectedLocale)
  c.set('localeSource', source)
  
  console.log(`[Locale] Detected: ${detectedLocale} (source: ${source})`)
  
  await next()
}
