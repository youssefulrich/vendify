import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('X-Webhook-Signature')
    const timestamp = req.headers.get('X-Webhook-Timestamp')
    const event = req.headers.get('X-Webhook-Event')

    // Vérifier la signature si webhook secret configuré
    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET
    if (webhookSecret && signature && timestamp) {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${body}`)
        .digest('hex')

      if (expectedSig !== signature) {
        return NextResponse.json({ error: 'Signature invalide' }, { status: 403 })
      }
    }

    const payload = JSON.parse(body)

    // Uniquement traiter les paiements réussis
    if (event !== 'payment.success' && payload?.status !== 'completed') {
      return NextResponse.json({ received: true })
    }

    const userId = payload?.metadata?.user_id
    if (!userId) {
      return NextResponse.json({ error: 'user_id manquant' }, { status: 400 })
    }

    const supabase = await createClient()

    // Calculer la date d'expiration (1 mois)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    // Activer le plan Premium
    await (supabase as any).from('profiles').update({
      plan: 'premium',
      plan_expires_at: expiresAt.toISOString(),
      plan_request: 'completed',
      plan_request_note: payload?.id || '',
    }).eq('id', userId)

    console.log(`✅ Premium activé pour user ${userId}`)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}