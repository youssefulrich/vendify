'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkOrderLimit } from '@/lib/utils/freemium'
import { formatCFA } from '@/lib/utils/formatCFA'
import type { Product } from '@/lib/supabase/types'

export default function NouvelleCommandePage() {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [limitError, setLimitError] = useState('')

  // Form state
  const [clientNom, setClientNom] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [canal, setCanal] = useState<'whatsapp' | 'instagram' | 'tiktok' | 'direct'>('whatsapp')
  const [modePaiement, setModePaiement] = useState<'wave' | 'orange_money' | 'mtn_momo' | 'cash' | 'autre'>('wave')
  const [statut, setStatut] = useState<'en_attente' | 'paye' | 'livre'>('en_attente')
  const [note, setNote] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantite: 1 }])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('actif', true)
      .gt('stock', 0)
      .order('nom')

    setProducts(data || [])
  }

  function addItem() {
    setItems([...items, { product_id: '', quantite: 1 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string | number) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id)
    return sum + (product ? product.prix_vente * item.quantite : 0)
  }, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.product_id)) {
      alert('Veuillez sélectionner un produit pour chaque ligne.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Vérifier la limite freemium
    const limit = await checkOrderLimit(user.id)
    if (!limit.allowed) {
      setLimitError(`Vous avez atteint la limite de 20 commandes ce mois. Passez Premium pour continuer.`)
      setLoading(false)
      return
    }

    // Créer la commande
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        client_nom: clientNom,
        client_phone: clientPhone || null,
        canal,
        statut,
        mode_paiement: modePaiement,
        note: note || null,
      })
      .select()
      .single()

    if (error || !order) {
      alert('Erreur lors de la création de la commande.')
      setLoading(false)
      return
    }

    // Ajouter les lignes
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id)!
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantite: item.quantite,
        prix_unitaire: product.prix_vente,
        prix_achat: product.prix_achat,
      }
    })

    await supabase.from('order_items').insert(orderItems)

    router.push('/commandes')
  }

  const inputStyle = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: 'var(--muted)',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/commandes" style={{ color: 'var(--muted)', fontSize: 14 }}>← Retour</Link>
        <h1 className="font-syne text-2xl font-bold">Nouvelle commande</h1>
      </div>

      {limitError && (
        <div className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: '#ff5e5e15', border: '1px solid #ff5e5e30', color: 'var(--red)' }}>
          ⚠️ {limitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Client */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Informations client</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nom du client *</label>
              <input style={inputStyle} value={clientNom} onChange={e => setClientNom(e.target.value)}
                placeholder="Fatou Diallo" required />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                placeholder="+225 07 00 00 00" />
            </div>
          </div>
        </div>

        {/* Produits */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Produits commandés</h2>

          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.product_id)
              return (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    {index === 0 && <label style={labelStyle}>Produit</label>}
                    <select
                      style={inputStyle}
                      value={item.product_id}
                      onChange={e => updateItem(index, 'product_id', e.target.value)}
                      required>
                      <option value="">Choisir un produit...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} — {formatCFA(p.prix_vente)} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 80 }}>
                    {index === 0 && <label style={labelStyle}>Qté</label>}
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct?.stock || 99}
                      style={inputStyle}
                      value={item.quantite}
                      onChange={e => updateItem(index, 'quantite', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)}
                      className="rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ background: '#ff5e5e20', color: 'var(--red)', border: 'none', cursor: 'pointer', marginBottom: 1 }}>
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addItem}
            className="mt-3 text-sm font-semibold"
            style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            + Ajouter un produit
          </button>

          {total > 0 && (
            <div className="mt-4 pt-4 flex justify-between items-center font-syne font-black"
              style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Total</span>
              <span style={{ fontSize: 20, color: 'var(--gold)' }}>{formatCFA(total)}</span>
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Détails de la commande</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Canal</label>
              <select style={inputStyle} value={canal} onChange={e => setCanal(e.target.value as any)}>
                <option value="whatsapp">🟢 WhatsApp</option>
                <option value="instagram">📷 Instagram</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="direct">🛒 Direct</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mode de paiement</label>
              <select style={inputStyle} value={modePaiement} onChange={e => setModePaiement(e.target.value as any)}>
                <option value="wave">🟢 Wave</option>
                <option value="orange_money">🟠 Orange Money</option>
                <option value="mtn_momo">🔵 MTN MoMo</option>
                <option value="cash">💵 Cash</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label style={labelStyle}>Statut</label>
            <select style={inputStyle} value={statut} onChange={e => setStatut(e.target.value as any)}>
              <option value="en_attente">En attente</option>
              <option value="paye">Payé</option>
              <option value="livre">Livré</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Note (optionnel)</label>
            <textarea
              style={{ ...inputStyle, resize: 'none', height: 80 }}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Adresse de livraison, instructions spéciales..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/commandes"
            className="flex-1 rounded-xl py-3 text-sm font-bold text-center"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-2 rounded-xl py-3 text-sm font-bold"
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              color: '#000',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
            {loading ? 'Enregistrement...' : '✓ Créer la commande'}
          </button>
        </div>
      </form>
    </div>
  )
}
