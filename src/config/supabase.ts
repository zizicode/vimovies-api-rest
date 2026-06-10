import { createClient } from '@supabase/supabase-js'

import { env } from './env'

const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_ANON_KEY

let supabaseInstance: any = null

function getSupabaseClient(): any {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()