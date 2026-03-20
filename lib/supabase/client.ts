import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    }
  )
}