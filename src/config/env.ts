import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT || 3000),

  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
}