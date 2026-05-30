import { createClient, SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

import { env } from './env'

let supabaseInstance: SupabaseClient | null = null

const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_ANON_KEY

export function initSupabase(url: string, serviceRoleKey: string) {
    supabaseInstance = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        realtime: {
            transport: ws as any
        }
    })
    return supabaseInstance
}

export function getSupabase(): SupabaseClient {
    if(!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            realtime: {
                transport: ws as any
            }
        })
    }
    return supabaseInstance
}

export const supabase = createClient(supabaseUrl, supabaseKey)