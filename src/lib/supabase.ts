import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized client to avoid build-time errors when env vars are placeholders
let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    console.warn('[Supabase] Missing or placeholder env vars — Supabase disabled')
    return null
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// Proxy object: supabase.client returns the actual client (or null)
// This lets client code do: if (supabase.client) { ... }
export const supabase = {
  get client() {
    return getSupabaseClient()
  },
}

// Server-side client with service role (for admin operations)
export function createServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey || !supabaseUrl || supabaseUrl.includes('your-project')) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
