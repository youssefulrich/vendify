import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vendify-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      cookieOptions: {
        name: 'vendify-auth',
        lifetime: 60 * 60 * 24 * 7, // 7 jours
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}