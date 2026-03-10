// app/api/premium/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'   // ← client direct, pas @/lib/supabase/server
import crypto from 'crypto'

// ── Client SERVICE ROLE — contourne RLS, utilisable sans session ──
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← dans Supabase → Settings → API → service_role
)

export async function POST(req: NextRequest) {
  try {
    const body      = await req.text()
    const signature = req.headers.get('X-Webhook-Signature') || req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('X-Webhook-Timestamp') || req.headers.get('x-webhook-timestamp')
    const event     = req.headers.get('X-Webhook-Event')     || req.headers.get('x-webhook-event')

    console.log('📥 Webhook GeniusPay reçu')
    console.log('   Event :', event)
    console.log('   Body  :', body.slice(0, 300))

    // ── Vérifier la signature HMAC ──
    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET
    if (webhookSecret && signature && timestamp) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${body}`)
        .digest('hex')

      if (expected !== signature) {
        console.error('❌ Signature invalide')
        return NextResponse.json({ error: 'Signature invalide' }, { status: 403 })
      }
      console.log('✅ Signature OK')
    }

    const payload = JSON.parse(body)

    // ── Filtrer : uniquement paiements réussis ──
    const isSuccess =
      event === 'payment.success' ||
      payload?.status === 'completed' ||
      payload?.status === 'SUCCESS' ||
      payload?.data?.status === 'SUCCESS'

    if (!isSuccess) {
      console.log('⚠️ Événement ignoré:', event, payload?.status)
      return NextResponse.json({ received: true })
    }

    // ── Extraire user_id depuis metadata ──
    const userId =
      payload?.metadata?.user_id ||
      payload?.data?.metadata?.user_id

    console.log('👤 user_id:', userId)

    if (!userId) {
      console.error('❌ user_id manquant dans payload:', JSON.stringify(payload).slice(0, 500))
      return NextResponse.json({ error: 'user_id manquant' }, { status: 400 })
    }

    // ── Activer Premium dans Supabase (SERVICE ROLE — pas de RLS) ──
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const { error, data } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'premium',
        plan_expires_at: expiresAt.toISOString(),
        plan_request: 'completed',
        plan_request_note: payload?.id || payload?.data?.id || '',
      })
      .eq('id', userId)
      .select('id, plan, plan_expires_at')

    if (error) {
      console.error('❌ Erreur Supabase update:', error)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    console.log('✅ Premium activé :', JSON.stringify(data))
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('❌ Webhook error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}