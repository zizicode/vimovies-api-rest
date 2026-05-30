import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT || 3000),

  SUPABASE_URL: process.env.SUPABASE_URL || 'https://temp.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'temp_key',

  NODE_ENV: process.env.NODE_ENV || 'development',
}