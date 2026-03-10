// app/api/premium/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Client admin pour les écritures (contourne RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // ── Auth via cookie session ──
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ── Lire le profil via admin (plus fiable) ──
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('shop_name, full_name, phone, plan')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.plan === 'premium') {
      return NextResponse.json({ error: 'Déjà Premium' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vendify-n7yj.vercel.app'

    // ── Créer le paiement GeniusPay ──
    const geniusPayload = {
      amount: 3000,
      description: `Vendify Premium - Abonnement mensuel`,
      customer: {
        name: (profile as any)?.shop_name || (profile as any)?.full_name || 'Vendeur',
        email: user.email,
        phone: (profile as any)?.phone || '',
      },
      // ← CRITIQUE : user_id ici pour que le webhook sache qui activer
      metadata: {
        user_id: user.id,
        plan: 'premium',
        email: user.email,
      },
      success_url: `${appUrl}/premium/success`,
      error_url:   `${appUrl}/premium/erreur`,
      cancel_url:  `${appUrl}/premium`,
    }

    console.log('💳 Création paiement GeniusPay pour:', user.id)

    const response = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'X-API-Key':    process.env.GENIUSPAY_API_KEY!,
        'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geniusPayload),
    })

    const data = await response.json()
    console.log('📦 GeniusPay response:', JSON.stringify(data).slice(0, 300))

    if (!response.ok || !data?.data?.checkout_url) {
      console.error('❌ GeniusPay error:', data)
      return NextResponse.json({ error: 'Erreur GeniusPay', details: data }, { status: 500 })
    }

    // ── Marquer la demande en pending (via admin pour éviter les erreurs RLS) ──
    await supabaseAdmin.from('profiles').update({
      plan_request:        'pending',
      plan_request_method: 'geniuspay',
      plan_request_note:   data?.data?.id || '',
      plan_request_at:     new Date().toISOString(),
    } as any).eq('id', user.id)

    return NextResponse.json({
      checkout_url: data.data.checkout_url,
      payment_id:   data.data.id,
    })

  } catch (err) {
    console.error('❌ Checkout error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}