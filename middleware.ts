import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes vraiment publiques — on passe mais on refresh quand même les cookies
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/b/') ||
    pathname.startsWith('/boutiques') ||
    pathname.startsWith('/api/boutique/') ||
    pathname.startsWith('/api/premium/webhook') ||
    pathname.startsWith('/api/premium/checkout') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/livraison') ||
    pathname.startsWith('/devenir-livreur') ||
    pathname.startsWith('/livreur/') 

  // CRITIQUE : toujours créer supabaseResponse via createServerClient
  // même pour les routes publiques — sinon les cookies de session
  // ne sont jamais rafraîchis et l'utilisateur est déconnecté
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Appel obligatoire — c'est lui qui rafraîchit le token de session
  const { data: { user } } = await supabase.auth.getUser()

  // Route publique : laisser passer MAIS retourner supabaseResponse
  // (pas NextResponse.next()) pour que les cookies soient bien écrits
  if (isPublic) {
    return supabaseResponse
  }

  // Route protégée : rediriger si pas connecté
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}