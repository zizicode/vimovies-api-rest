import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT || 3000),

  SUPABASE_URL: process.env.SUPABASE_URL || 'https://temp.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'temp_key',

  NODE_ENV: process.env.NODE_ENV || 'development',
}

/**
 * Helper para determinar si el request viene de localhost/desarrollo.
 * En desarrollo permite ver contenido no publicado.
 * En producción solo muestra contenido published.
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper para detectar si un request viene de localhost
 * basado en el header origin o host
 */
export const isLocalhostRequest = (origin?: string | null, host?: string | null): boolean => {
  if (!origin && !host) return isDevelopment
  
  const originOrHost = origin || host || ''
  return originOrHost.includes('localhost') || 
         originOrHost.includes('127.0.0.1') || 
         originOrHost.includes('::1')
}