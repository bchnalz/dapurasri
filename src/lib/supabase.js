import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigError =
  'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local'

if (!isSupabaseConfigured) {
  console.error(supabaseConfigError)
}

const fallbackUrl = 'http://localhost:54321'
const fallbackAnonKey = 'public-anon-key'

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackAnonKey,
)
