// app/api/boutique/commande/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vendor_id, client_nom, client_phone, canal, mode_paiement, items, note } = body

    if (!vendor_id || !client_nom || !items?.length) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Calculer le total
    let total = 0
    for (const item of items) {
      total += item.prix_unitaire * item.quantite
    }

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: vendor_id,
        client_nom,
        client_phone: client_phone || null,
        canal: canal || 'direct',
        statut: 'en_attente',
        mode_paiement: mode_paiement || 'wave',
        total,
        note: note || 'Commande via boutique en ligne',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer les order_items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantite: item.quantite,
      prix_unitaire: item.prix_unitaire,
      prix_achat: item.prix_achat || 0,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw itemsError

    // Décrémenter le stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products').select('stock').eq('id', item.product_id).single()
      if (product) {
        await supabase.from('products')
          .update({ stock: Math.max(0, product.stock - item.quantite) })
          .eq('id', item.product_id)
      }
    }

    // Créer une notification pour le vendeur
    const itemsDesc = items.map((i: any) => `${i.nom || 'Produit'} ×${i.quantite}`).join(', ')
    await supabase.from('notifications').insert({
      user_id: vendor_id,
      type: 'nouvelle_commande',
      title: `Nouvelle commande de ${client_nom}`,
      message: `${itemsDesc} — Total: ${new Intl.NumberFormat('fr-FR').format(total)} FCFA`,
      order_id: order.id,
      read: false,
    })

    // Récupérer le phone du vendeur pour le WhatsApp
    const { data: vendorProfile } = await supabase
      .from('profiles').select('phone, shop_name').eq('id', vendor_id).single()

    return NextResponse.json({
      success: true,
      order_id: order.id,
      vendor_phone: vendorProfile?.phone || null,
      vendor_shop: vendorProfile?.shop_name || '',
      client_nom,
      total,
      items_desc: itemsDesc,
      mode_paiement,
    })
  } catch (e: any) {
    console.error('Commande error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}