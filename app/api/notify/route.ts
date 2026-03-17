import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp } from '@/lib/greenapi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(raw: string) {
  let p = raw.replace(/\D/g, '')
  if (p.length === 8) return '225' + p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  return p
}

export async function POST(req: Request) {
  const { type, id, statut } = await req.json()

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

  if (type === 'livraison') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('*, delivery_drivers(phone, full_name)')
      .eq('id', id)
      .single()

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

  return Response.json({ ok: true })
}