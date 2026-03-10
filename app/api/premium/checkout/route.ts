// app/api/premium/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // Récupérer le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, shop_name')
      .eq('id', userId)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vendify-qsom.vercel.app'

    // Créer le paiement GeniusPay
    const response = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'X-API-Key':    process.env.GENIUSPAY_API_KEY!,
        'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 3000,
        currency: 'XOF',
        description: `Vendify Premium - ${(profile as any)?.shop_name || 'Boutique'}`,
        // ← CRITIQUE : user_id dans metadata pour le webhook
        metadata: {
          user_id: userId,
          shop_name: (profile as any)?.shop_name || '',
          plan: 'premium',
        },
        redirect_url: `${appUrl}/premium/success`,
        cancel_url:   `${appUrl}/premium?cancelled=1`,
      }),
    })

    const data = await response.json()
    console.log('💳 GeniusPay response:', JSON.stringify(data))

    if (!data?.data?.checkout_url) {
      console.error('❌ Pas de checkout_url:', data)
      return NextResponse.json({ error: 'Impossible de créer le paiement' }, { status: 500 })
    }

    return NextResponse.json({ checkout_url: data.data.checkout_url })

  } catch (err) {
    console.error('❌ Erreur checkout:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}