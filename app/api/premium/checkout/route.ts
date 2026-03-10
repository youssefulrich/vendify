import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('shop_name, full_name, phone, plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'premium') {
      return NextResponse.json({ error: 'Déjà Premium' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const payload = {
      amount: 3000,
      description: `Vendify Premium - Abonnement mensuel`,
      customer: {
        name: profile?.shop_name || profile?.full_name || 'Vendeur',
        email: user.email,
        phone: profile?.phone || '',
      },
      metadata: {
        user_id: user.id,
        plan: 'premium',
      },
      success_url: `${appUrl}/premium/success`,
      error_url: `${appUrl}/premium/erreur`,
      cancel_url: `${appUrl}/premium`,
    }

    const response = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.GENIUSPAY_API_KEY!,
        'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data?.data?.checkout_url) {
      console.error('GeniusPay error:', data)
      return NextResponse.json({ error: 'Erreur GeniusPay', details: data }, { status: 500 })
    }

    // Enregistrer la demande en pending dans Supabase
    await (supabase as any).from('profiles').update({
      plan_request: 'pending',
      plan_request_method: 'geniuspay',
      plan_request_note: data?.data?.id || '',
      plan_request_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json({
      checkout_url: data.data.checkout_url,
      payment_id: data.data.id,
    })

  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}