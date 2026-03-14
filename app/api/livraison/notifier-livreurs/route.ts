// app/api/livraison/notifier-livreurs/route.ts
// Appelée automatiquement quand une livraison est créée
// Envoie push notification + prépare messages WhatsApp

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Génère les clés VAPID (à faire une seule fois)
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:contact@vendify.ci'

export async function POST(request: NextRequest) {
  try {
    const { delivery_id } = await request.json()
    if (!delivery_id) return NextResponse.json({ error: 'delivery_id requis' }, { status: 400 })

    // 1. Récupérer la livraison
    const { data: livraison } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', delivery_id)
      .single()

    if (!livraison) return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 })

    // 2. Récupérer les livreurs disponibles dans la ville
    const { data: livreurs } = await supabase
      .from('delivery_drivers')
      .select('id, full_name, whatsapp, phone, ville')
      .eq('ville', livraison.ville)
      .eq('actif', true)

    if (!livreurs || livreurs.length === 0) {
      return NextResponse.json({ success: true, notified: 0, message: 'Aucun livreur disponible' })
    }

    // 3. Récupérer les abonnements push de ces livreurs
    const driverIds = livreurs.map(d => d.id)
    const { data: subscriptions } = await supabase
      .from('driver_push_subscriptions')
      .select('*')
      .in('driver_id', driverIds)

    // 4. Envoyer les push notifications
    let pushSent = 0
    if (subscriptions && subscriptions.length > 0) {
      // Import dynamique de web-push
      const webpush = await import('web-push')
      webpush.default.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

      const payload = JSON.stringify({
        title:       '🛵 Nouvelle livraison disponible !',
        body:        `${livraison.ville}${livraison.quartier ? ` — ${livraison.quartier}` : ''} · ${livraison.description || 'Colis à livrer'}`,
        tag:         `livraison-${delivery_id}`,
        delivery_id: delivery_id,
        driver_id:   null, // sera remplacé par driver_id de l'abonnement
        url:         `/livreur/`,
      })

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            // Personnaliser l'URL avec l'ID du livreur
            const personalPayload = JSON.stringify({
              ...JSON.parse(payload),
              driver_id: sub.driver_id,
              url:       `/livreur/${sub.driver_id}`,
            })

            await webpush.default.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              },
              personalPayload
            )
            pushSent++
          } catch (err: any) {
            // Abonnement expiré — le supprimer
            if (err.statusCode === 410) {
              await supabase.from('driver_push_subscriptions').delete().eq('id', sub.id)
            }
          }
        })
      )
    }

    // 5. Préparer les liens WhatsApp pour les livreurs SANS push subscription
    const livreursSansPush = livreurs.filter(
      d => !subscriptions?.find(s => s.driver_id === d.id)
    )

    const msg = encodeURIComponent(
      `🛵 *Nouvelle livraison disponible !*\n\n` +
      `📍 *Zone :* ${livraison.ville}${livraison.quartier ? ` — ${livraison.quartier}` : ''}\n` +
      `📦 *Colis :* ${livraison.description || 'Non précisé'} (${livraison.poids || 'léger'})\n` +
      `🏠 *De :* ${livraison.adresse_pickup}\n` +
      `📌 *Vers :* ${livraison.adresse_livraison}\n\n` +
      `Cliquez sur votre lien pour accepter :\n`
    )

    const whatsappLinks = livreursSansPush.map(d => ({
      driver_id:   d.id,
      driver_name: d.full_name,
      wa_link:     `https://wa.me/${normalizePhone(d.whatsapp || d.phone)}?text=${msg}${encodeURIComponent(`vendify.ci/livreur/${d.id}`)}`,
    }))

    return NextResponse.json({
      success:        true,
      push_sent:      pushSent,
      wa_links:       whatsappLinks,
      total_livreurs: livreurs.length,
    })

  } catch (error: any) {
    console.error('Erreur notification livreurs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function normalizePhone(raw: string) {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  if (p.length >= 11) return p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  if (p.length === 8) return '225' + p
  return p
}