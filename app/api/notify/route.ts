import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp } from '@/lib/greenapi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(raw: string) {
  if (!raw) return ''
  let p = raw.replace(/\D/g, '')
  if (p.length === 8)  return '225' + p
  if (p.length === 9)  return '2250' + p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  if (p.length === 10 && !p.startsWith('225')) return '225' + p
  return p
}

export async function POST(req: Request) {
  const { type, id, statut, driverId } = await req.json()

  // ── Nouvelle commande → notifier le vendeur ──
  if (type === 'commande') {
    const { data: order } = await supabase
      .from('orders')
      .select('*, profiles(phone, shop_name)')
      .eq('id', id)
      .single()

    if (order?.profiles?.phone) {
      const phone = normalizePhone(order.profiles.phone)
      const msg = `🛒 *Nouvelle commande !*\n\nClient : ${order.client_nom}\nTotal : ${new Intl.NumberFormat('fr-FR').format(order.total)} FCFA\n\n👉 Voir : https://vendify.ci/commandes/${order.id}`
      await sendWhatsApp(phone, msg)
    }
  }

  // ── Nouvelle livraison → notifier tous les livreurs de la ville ──
  if (type === 'livraison') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single()

    if (!delivery) return Response.json({ ok: false, error: 'Livraison introuvable' })

    const { data: drivers } = await supabase
      .from('delivery_drivers')
      .select('id, phone, full_name')
      .eq('ville', delivery.ville)
      .eq('actif', true)

    for (const driver of drivers || []) {
      if (!driver.phone) continue
      const phone = normalizePhone(driver.phone)
      const msg = `🛵 *Nouvelle livraison disponible !*\n\n📦 ${delivery.description || 'Colis'}\n📍 ${delivery.adresse_pickup}\n🏠 ${delivery.adresse_livraison}\n\n👉 Accepter : https://vendify.ci/livreur/${driver.id}`
      await sendWhatsApp(phone, msg)
    }
  }

  // ── Changement de statut commande → notifier le client ──
  if (type === 'statut_commande') {
    const { data: order } = await supabase
      .from('orders')
      .select('*, profiles(phone, shop_name)')
      .eq('id', id)
      .single()

    if (order?.client_phone) {
      const phone = normalizePhone(order.client_phone)
      const msgs: Record<string, string> = {
        paye:   `✅ *Paiement confirmé !*\n\nBonjour ${order.client_nom}, votre paiement a été reçu. Merci ! 🙏\n_${order.profiles?.shop_name}_`,
        livre:  `📦 *Commande livrée !*\n\nBonjour ${order.client_nom}, votre commande a été livrée. Merci de votre confiance ! 🎉\n_${order.profiles?.shop_name}_`,
        annule: `❌ *Commande annulée*\n\nBonjour ${order.client_nom}, votre commande a été annulée. Contactez-nous pour plus d'infos.\n_${order.profiles?.shop_name}_`,
      }
      if (msgs[statut]) await sendWhatsApp(phone, msgs[statut])
    }
  }

  // ── Livreur a accepté → notifier vendeur + client ──
  if (type === 'livraison_acceptee') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single()

    if (!delivery) return Response.json({ ok: false })

    const { data: drv } = await supabase
      .from('delivery_drivers')
      .select('full_name, phone')
      .eq('id', driverId)
      .single()

    // Notifier le vendeur
    if (delivery.vendor_id) {
      const { data: vendor } = await supabase
        .from('profiles').select('phone').eq('id', delivery.vendor_id).single()
      if (vendor?.phone) {
        const phone = normalizePhone(vendor.phone)
        const msg = `🏍 *Livreur assigné !*\n\nLe livreur *${drv?.full_name}* a accepté votre livraison.\n\n📦 ${delivery.description || 'Colis'}\n📍 ${delivery.adresse_pickup}\n🏠 ${delivery.adresse_livraison}`
        await sendWhatsApp(phone, msg)
      }
    }

    // Notifier le client
    if (delivery.client_phone) {
      const phone = normalizePhone(delivery.client_phone)
      const msg = `🛵 *Votre livraison est en cours !*\n\nBonjour ${delivery.client_nom}, le livreur *${drv?.full_name}* a pris en charge votre colis.\n\n🔖 Réf: ${delivery.reference}`
      await sendWhatsApp(phone, msg)
    }
  }

  // ── Changement de statut livraison → notifier vendeur + client ──
  if (type === 'livraison_statut') {
    const { data: delivery } = await supabase
      .from('deliveries').select('*').eq('id', id).single()

    if (!delivery) return Response.json({ ok: false })

    const { data: drv } = await supabase
      .from('delivery_drivers').select('full_name').eq('id', driverId).single()

    const msgsVendeur: Record<string, string> = {
      picked_up:  `📦 *Colis récupéré !*\n\nLe livreur *${drv?.full_name}* a récupéré le colis. Il se dirige vers votre client. 🛵`,
      in_transit: `🛵 *En route !*\n\nLe livreur *${drv?.full_name}* est en route vers votre client avec le colis.`,
      delivered:  `✅ *Livraison effectuée !*\n\nLe colis a bien été remis à votre client par *${drv?.full_name}*. Merci de faire confiance à Vendify ! 🎉`,
    }

    // Notifier le vendeur
    if (msgsVendeur[statut] && delivery.vendor_id) {
      const { data: vendor } = await supabase
        .from('profiles').select('phone').eq('id', delivery.vendor_id).single()
      if (vendor?.phone) await sendWhatsApp(normalizePhone(vendor.phone), msgsVendeur[statut])
    }

    // Notifier le client si livré
    if (statut === 'delivered' && delivery.client_phone) {
      const phone = normalizePhone(delivery.client_phone)
      await sendWhatsApp(phone, `✅ *Votre colis a été livré !*\n\nBonjour ${delivery.client_nom}, votre colis a bien été livré. Merci ! 🙏`)
    }
  }

  return Response.json({ ok: true })
}