export const dynamic = 'force-dynamic'
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

  const [clientNom, setClientNom] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [canal, setCanal] = useState<'whatsapp' | 'instagram' | 'tiktok' | 'direct'>('whatsapp')
  const [modePaiement, setModePaiement] = useState<'wave' | 'orange_money' | 'mtn_momo' | 'cash' | 'autre'>('wave')
  const [statut, setStatut] = useState<'en_attente' | 'paye' | 'livre'>('en_attente')
  const [note, setNote] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantite: 1 }])

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('products').select('*').eq('user_id', user.id)
      .eq('actif', true).gt('stock', 0).order('nom')
    setProducts(data || [])
  }

  function addItem() { setItems([...items, { product_id: '', quantite: 1 }]) }
  function removeItem(index: number) { setItems(items.filter((_, i) => i !== index)) }
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

    const limit = await checkOrderLimit(user.id)
    if (!limit.allowed) {
      setLimitError('Vous avez atteint la limite de 20 commandes ce mois. Passez Premium pour continuer.')
      setLoading(false)
      return
    }

    // Calculer le total
    const orderTotal = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id)
      return sum + (product ? product.prix_vente * item.quantite : 0)
    }, 0)

    const sb = supabase as any
    const { data: order, error } = await sb
      .from('orders')
      .insert({
        user_id: user.id,
        client_nom: clientNom,
        client_phone: clientPhone || null,
        canal,
        statut,
        mode_paiement: modePaiement,
        note: note || null,
        total: orderTotal,
      })
      .select()
      .single()

    if (error || !order) {
      alert('Erreur lors de la création de la commande.')
      setLoading(false)
      return
    }

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

    await sb.from('order_items').insert(orderItems)
    router.push('/commandes')
  }

  const inputStyle = {
    background: '#161a22',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f0f2f7',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase' as const,
    color: '#717a8f',
    marginBottom: 7,
    display: 'block',
  }

  const cardStyle = {
    background: '#161a22',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: '22px',
    marginBottom: 16,
  }

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/commandes" style={{
          color: '#717a8f', fontSize: 13, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          ← Retour
        </Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>
          Nouvelle commande
        </h1>
      </div>

      {/* Limit error */}
      {limitError && (
        <div style={{
          background: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.2)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          fontSize: 13, color: '#ff5e5e', display: 'flex', alignItems: 'center', gap: 8
        }}>
          ⚠️ {limitError}
          <Link href="/premium" style={{ color: '#f5a623', fontWeight: 700, marginLeft: 4 }}>
            Passer Premium →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── CLIENT ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>👤</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Informations client
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nom du client *</label>
              <input
                style={inputStyle} value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                placeholder="Fatou Diallo" required
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input
                style={inputStyle} value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>
        </div>

        {/* ── PRODUITS ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(77,140,255,0.1)', border: '1px solid rgba(77,140,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>🏷️</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Produits commandés
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.product_id)
              return (
                <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    {index === 0 && <label style={labelStyle}>Produit</label>}
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
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
                      type="number" min={1}
                      max={selectedProduct?.stock || 99}
                      style={inputStyle} value={item.quantite}
                      onChange={e => updateItem(index, 'quantite', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {selectedProduct && (
                    <div style={{ width: 110, paddingBottom: 11, textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: '#717a8f', marginBottom: 2 }}>Sous-total</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#f5a623' }}>
                        {formatCFA(selectedProduct.prix_vente * item.quantite)}
                      </div>
                    </div>
                  )}
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)}
                      style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(255,94,94,0.08)', color: '#ff5e5e',
                        border: '1px solid rgba(255,94,94,0.15)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                      }}>
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addItem}
            style={{
              marginTop: 12, fontSize: 12, fontWeight: 600,
              color: '#f5a623', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4
            }}>
            + Ajouter un produit
          </button>

          {total > 0 && (
            <div style={{
              marginTop: 16, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 13, color: '#717a8f', fontWeight: 600 }}>Total commande</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#f5a623' }}>
                {formatCFA(total)}
              </span>
            </div>
          )}
        </div>

        {/* ── DÉTAILS ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(46,204,135,0.1)', border: '1px solid rgba(46,204,135,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>📋</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Détails de la commande
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Canal</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={canal} onChange={e => setCanal(e.target.value as any)}>
                <option value="whatsapp">🟢 WhatsApp</option>
                <option value="instagram">📷 Instagram</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="direct">🛒 Direct</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mode de paiement</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={modePaiement} onChange={e => setModePaiement(e.target.value as any)}>
                <option value="wave">🟢 Wave</option>
                <option value="orange_money">🟠 Orange Money</option>
                <option value="mtn_momo">🔵 MTN MoMo</option>
                <option value="cash">💵 Cash</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Statut initial</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'en_attente', label: 'En attente', color: '#f5a623' },
                { value: 'paye', label: 'Payé', color: '#2ecc87' },
                { value: 'livre', label: 'Livré', color: '#4d8cff' },
              ].map(s => (
                <button key={s.value} type="button"
                  onClick={() => setStatut(s.value as any)}
                  style={{
                    flex: 1, padding: '9px 8px', borderRadius: 10,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: statut === s.value ? `${s.color}15` : '#0d0f14',
                    border: `1px solid ${statut === s.value ? s.color + '40' : 'rgba(255,255,255,0.06)'}`,
                    color: statut === s.value ? s.color : '#717a8f',
                    transition: 'all 0.15s'
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Note (optionnel)</label>
            <textarea
              style={{ ...inputStyle, resize: 'none', height: 80 } as React.CSSProperties}
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Adresse de livraison, instructions spéciales..."
              onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/commandes" style={{
            flex: 1, background: '#161a22',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '13px',
            fontSize: 13, fontWeight: 600, color: '#717a8f',
            textDecoration: 'none', textAlign: 'center'
          }}>
            Annuler
          </Link>
          <button type="submit" disabled={loading} style={{
            flex: 2, background: loading ? '#2a3040' : 'linear-gradient(135deg, #f5a623, #ffcc6b)',
            color: loading ? '#717a8f' : '#000', border: 'none',
            borderRadius: 12, padding: '13px',
            fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(245,166,35,0.25)',
            transition: 'all 0.2s'
          }}>
            {loading ? 'Enregistrement...' : '✓ Créer la commande'}
          </button>
        </div>
      </form>
    </div>
  )
}