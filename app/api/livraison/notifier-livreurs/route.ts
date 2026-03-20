// app/api/livraison/notifier-livreurs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(raw: string): string {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  // Déjà correct : 225 + 9 chiffres = 12 chiffres
  if (p.startsWith('225') && p.length === 12) return p
  // Double préfixe : 2250XXXXXXXXX = 13 chiffres
  if (p.startsWith('2250') && p.length === 13) return '225' + p.slice(4)
  // Autres pays
  for (const prefix of ['221', '229', '237', '228']) {
    if (p.startsWith(prefix) && p.length >= 11) return p
  }
  // Local 10 chiffres avec 0 (ex: 0715469666 → 225715469666)
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  // Local 9 chiffres sans 0
  if (p.length === 9) return '225' + p
  // Local 8 chiffres
  if (p.length === 8) return '225' + p
  // Local 10 chiffres sans 0
  if (p.length === 10) return '225' + p
  return p
}

export async function POST(request: NextRequest) {
  try {
    const { delivery_id } = await request.json()
    if (!delivery_id) return NextResponse.json({ error: 'delivery_id requis' }, { status: 400 })

    // 1. Récupérer la livraison
    const { data: livraison, error: livErr } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', delivery_id)
      .single()

    if (livErr || !livraison) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 })
    }

    // 2. Récupérer les livreurs actifs dans la ville
    const { data: livreurs } = await supabase
      .from('delivery_drivers')
      .select('id, full_name, whatsapp, phone, ville')
      .eq('ville', livraison.ville)
      .eq('actif', true)

    if (!livreurs || livreurs.length === 0) {
      return NextResponse.json({ success: true, notified: 0, wa_links: [] })
    }

    // 3. Construire le message WhatsApp
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vendify-qsom.vercel.app'

    const messageBase =
      `🛵 *Nouvelle livraison disponible !*\n\n` +
      `📍 *Zone :* ${livraison.ville}${livraison.quartier ? ` — ${livraison.quartier}` : ''}\n` +
      `📦 *Colis :* ${livraison.description || 'Non précisé'} (${livraison.poids || 'léger'})\n` +
      `🏠 *Récupération :* ${livraison.adresse_pickup}\n` +
      `📌 *Livraison :* ${livraison.adresse_livraison}\n\n` +
      `👇 *Accepter cette livraison :*\n`

    // 4. Générer les liens WhatsApp pour chaque livreur
    const waLinks = livreurs.map(d => {
      const phone = normalizePhone(d.whatsapp || d.phone)
      const message = messageBase + `${appUrl}/livreur/${d.id}`
      return {
        driver_id:   d.id,
        driver_name: d.full_name,
        phone:       phone,
        wa_link:     phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
          : null,
      }
    }).filter(d => d.wa_link !== null)

    // 5. Sauvegarder les liens dans la livraison pour référence
    await supabase
      .from('deliveries')
      .update({ note_livreur: `${waLinks.length} livreur(s) notifié(s)` })
      .eq('id', delivery_id)

    return NextResponse.json({
      success:        true,
      wa_links:       waLinks,
      total_livreurs: livreurs.length,
      push_sent:      0,
    })

  } catch (error: any) {
    console.error('Erreur notification livreurs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}