'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkOrderLimit } from '@/lib/utils/freemium'
import { formatCFA } from '@/lib/utils/formatCFA'
import type { Product } from '@/lib/supabase/types'

const CANAUX = [
  { value: 'whatsapp',  label: 'WhatsApp',  emoji: '💬', color: '#25d366' },
  { value: 'instagram', label: 'Instagram', emoji: '📷', color: '#e1306c' },
  { value: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: '#69c9d0' },
  { value: 'direct',    label: 'Direct',    emoji: '🛒', color: '#a78bfa' },
]

const PAIEMENTS = [
  { value: 'wave',         label: 'Wave',         emoji: '🟢' },
  { value: 'orange_money', label: 'Orange Money', emoji: '🟠' },
  { value: 'mtn_momo',     label: 'MTN MoMo',     emoji: '🔵' },
  { value: 'cash',         label: 'Cash',         emoji: '💵' },
  { value: 'autre',        label: 'Autre',        emoji: '💳' },
]

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: '#f5a623' },
  { value: 'paye',       label: 'Payé',       color: '#2ecc87' },
  { value: 'livre',      label: 'Livré',      color: '#4d8cff' },
]

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
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: string, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum, item) => {
    const p = products.find(p => p.id === item.product_id)
    return sum + (p ? p.prix_vente * item.quantite : 0)
  }, 0)

  const beneficeTotal = items.reduce((sum, item) => {
    const p = products.find(p => p.id === item.product_id)
    return sum + (p ? (p.prix_vente - p.prix_achat) * item.quantite : 0)
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
      setLimitError('Limite de 20 commandes ce mois atteinte. Passez Premium pour continuer.')
      setLoading(false)
      return
    }

    const sb = supabase as any
    const { data: order, error } = await sb
      .from('orders')
      .insert({
        user_id: user.id,
        client_nom: clientNom,
        client_phone: clientPhone || null,
        canal, statut,
        mode_paiement: modePaiement,
        note: note || null,
        total,
      })
      .select().single()

    if (error || !order) {
      alert('Erreur lors de la création de la commande.')
      setLoading(false)
      return
    }

    await sb.from('order_items').insert(
      items.map(item => {
        const p = products.find(p => p.id === item.product_id)!
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantite: item.quantite,
          prix_unitaire: p.prix_vente,
          prix_achat: p.prix_achat,
        }
      })
    )

    router.push('/commandes')
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }

        .nc-root { max-width: 640px; animation: fadeUp 0.4s ease both; }

        /* Top bar */
        .nc-topbar { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
        .nc-back {
          display:flex; align-items:center; gap:5px;
          background:#161a22; border:1px solid rgba(255,255,255,0.06);
          border-radius:10px; padding:8px 14px;
          font-size:13px; color:#717a8f; text-decoration:none;
          transition:all 0.2s; flex-shrink:0;
        }
        .nc-back:hover { color:#c8cdd8; border-color:rgba(255,255,255,0.12); }
        .nc-sep { width:1px; height:16px; background:rgba(255,255,255,0.07); }
        .nc-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; letter-spacing:-0.3px; }

        /* Error */
        .nc-error {
          background:rgba(255,94,94,0.06); border:1px solid rgba(255,94,94,0.2);
          border-radius:14px; padding:13px 16px; margin-bottom:18px;
          font-size:13px; color:#ff7070; display:flex; align-items:center; gap:8px;
        }

        /* Card */
        .nc-card {
          background:#161a22; border:1px solid rgba(255,255,255,0.06);
          border-radius:20px; padding:22px; margin-bottom:14px;
        }
        .nc-card-hd {
          display:flex; align-items:center; gap:10px; margin-bottom:18px;
        }
        .nc-card-ico {
          width:30px; height:30px; border-radius:9px;
          display:flex; align-items:center; justify-content:center;
          font-size:14px; flex-shrink:0;
        }
        .nc-card-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#c8cdd8; }

        /* Label + input */
        .nc-label {
          display:block; font-size:10px; font-weight:700;
          letter-spacing:1.2px; text-transform:uppercase;
          color:#4a5470; margin-bottom:7px;
        }
        .nc-input, .nc-select, .nc-textarea {
          width:100%; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; padding:12px 15px;
          font-size:13px; font-family:'DM Sans',sans-serif;
          color:#e8eaf0; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color:#e8eaf0;
        }
        .nc-input::placeholder, .nc-textarea::placeholder { color:#2e3448; }
        .nc-input:focus, .nc-select:focus, .nc-textarea:focus {
          border-color:rgba(245,166,35,0.4);
          box-shadow:0 0 0 4px rgba(245,166,35,0.06);
          background:rgba(245,166,35,0.02);
        }
        .nc-select { cursor:pointer; }
        .nc-select option { background:#161a22; }
        .nc-textarea { resize:none; height:78px; }

        /* 2-col grid */
        .nc-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        /* Product row */
        .nc-product-row {
          display:grid; grid-template-columns:1fr 70px auto; gap:10px; align-items:end;
          margin-bottom:10px;
        }
        .nc-product-row:last-child { margin-bottom:0; }
        .nc-subtotal {
          background:rgba(245,166,35,0.05); border:1px solid rgba(245,166,35,0.1);
          border-radius:10px; padding:10px 12px; text-align:right;
          min-width:100px;
        }
        .nc-subtotal-label { font-size:10px; color:#4a5470; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.5px; }
        .nc-subtotal-val { font-family:'Syne',sans-serif; font-weight:800; font-size:13px; color:#f5a623; }
        .nc-remove-btn {
          width:34px; height:34px; border-radius:9px; flex-shrink:0;
          background:rgba(255,94,94,0.06); border:1px solid rgba(255,94,94,0.15);
          color:#ff5e5e; cursor:pointer; display:flex; align-items:center; justify-content:center;
          font-size:13px; transition:all 0.15s;
        }
        .nc-remove-btn:hover { background:rgba(255,94,94,0.12); }

        .nc-add-btn {
          margin-top:12px; font-size:12px; font-weight:600;
          color:#f5a623; background:none; border:none;
          cursor:pointer; padding:0; display:flex; align-items:center; gap:5px;
        }
        .nc-add-btn:hover { color:#ffcc6b; }

        /* Total bar */
        .nc-total-bar {
          margin-top:16px; padding-top:16px;
          border-top:1px solid rgba(255,255,255,0.05);
          display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;
        }
        .nc-total-left { display:flex; flex-direction:column; gap:2px; }
        .nc-total-label { font-size:11px; color:#4a5470; text-transform:uppercase; letter-spacing:0.5px; }
        .nc-total-amount { font-family:'Syne',sans-serif; font-weight:900; font-size:24px; color:#f5a623; }
        .nc-benefice { font-size:12px; font-weight:600; }

        /* Canal / statut chips */
        .nc-chips { display:flex; gap:7px; flex-wrap:wrap; }
        .nc-chip {
          flex:1; min-width:0; padding:10px 8px; border-radius:11px;
          font-size:12px; font-weight:600; cursor:pointer; border:none;
          display:flex; align-items:center; justify-content:center; gap:5px;
          transition:all 0.15s; white-space:nowrap;
        }

        /* Note */
        .nc-note-wrap { margin-top:14px; }

        /* Actions */
        .nc-actions { display:flex; gap:10px; margin-top:6px; }
        .nc-cancel {
          flex:1; background:#161a22; border:1px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:14px; font-size:14px; font-weight:600;
          color:#717a8f; text-decoration:none;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .nc-cancel:hover { color:#c8cdd8; border-color:rgba(255,255,255,0.12); }
        .nc-submit {
          flex:2; background:linear-gradient(135deg,#f5a623,#ffcc6b);
          color:#000; border:none; border-radius:14px; padding:14px;
          font-family:'Syne',sans-serif; font-size:15px; font-weight:700;
          cursor:pointer; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 20px rgba(245,166,35,0.25);
        }
        .nc-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(245,166,35,0.35); }
        .nc-submit:disabled { background:#1e2430; color:#3a4255; box-shadow:none; cursor:not-allowed; }
        .spinner { width:16px; height:16px; border:2px solid rgba(0,0,0,0.2); border-top-color:#000; border-radius:50%; animation:spin 0.7s linear infinite; }

        /* ── MOBILE ── */
        @media (max-width:640px) {
          .nc-grid2 { grid-template-columns:1fr !important; }
          .nc-product-row { grid-template-columns:1fr 60px !important; }
          .nc-product-row .nc-subtotal { display:none; }
          .nc-chips { gap:5px; }
          .nc-chip { font-size:11px; padding:9px 6px; }
          .nc-title { font-size:18px; }
          .nc-card { padding:16px; }
          .nc-total-amount { font-size:20px; }
        }
      `}</style>

      <div className="nc-root">

        {/* ── TOP BAR ── */}
        <div className="nc-topbar">
          <Link href="/commandes" className="nc-back">← Commandes</Link>
          <div className="nc-sep" />
          <h1 className="nc-title">Nouvelle commande</h1>
        </div>

        {/* ── LIMIT ERROR ── */}
        {limitError && (
          <div className="nc-error">
            <span>⚠️</span>
            <span>{limitError} <Link href="/premium" style={{ color: '#f5a623', fontWeight: 700 }}>Passer Premium →</Link></span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── CARD CLIENT ── */}
          <div className="nc-card">
            <div className="nc-card-hd">
              <div className="nc-card-ico" style={{ background: 'rgba(245,166,35,0.08)' }}>👤</div>
              <span className="nc-card-title">Informations client</span>
            </div>
            <div className="nc-grid2">
              <div>
                <label className="nc-label">Nom du client *</label>
                <input className="nc-input" type="text" placeholder="Fatou Diallo"
                  value={clientNom} onChange={e => setClientNom(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="nc-label">Téléphone</label>
                <input className="nc-input" type="tel" placeholder="+225 07 00 00 00"
                  value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── CARD PRODUITS ── */}
          <div className="nc-card">
            <div className="nc-card-hd">
              <div className="nc-card-ico" style={{ background: 'rgba(77,140,255,0.08)' }}>🏷️</div>
              <span className="nc-card-title">Produits commandés</span>
              {products.length === 0 && (
                <Link href="/produits/nouveau" style={{ marginLeft: 'auto', fontSize: 11, color: '#f5a623', fontWeight: 600 }}>
                  + Créer un produit
                </Link>
              )}
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#4a5470', fontSize: 13 }}>
                Aucun produit en stock — <Link href="/produits/nouveau" style={{ color: '#f5a623' }}>créez-en un d'abord</Link>
              </div>
            ) : (
              <>
                {items.map((item, idx) => {
                  const selectedProduct = products.find(p => p.id === item.product_id)
                  return (
                    <div key={idx} className="nc-product-row">
                      <div>
                        {idx === 0 && <label className="nc-label">Produit</label>}
                        <select className="nc-select"
                          value={item.product_id}
                          onChange={e => updateItem(idx, 'product_id', e.target.value)}
                          required>
                          <option value="">Choisir un produit…</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nom} — {formatCFA(p.prix_vente)} (stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="nc-label">Qté</label>}
                        <input className="nc-input" type="number" min={1}
                          max={selectedProduct?.stock || 99}
                          value={item.quantite}
                          onChange={e => updateItem(idx, 'quantite', parseInt(e.target.value) || 1)} />
                      </div>
                      {selectedProduct && (
                        <div className="nc-subtotal" style={{ alignSelf: 'end' }}>
                          <div className="nc-subtotal-label">Sous-total</div>
                          <div className="nc-subtotal-val">{formatCFA(selectedProduct.prix_vente * item.quantite)}</div>
                        </div>
                      )}
                      {items.length > 1 && (
                        <button type="button" className="nc-remove-btn"
                          style={{ alignSelf: 'end' }}
                          onClick={() => removeItem(idx)}>✕</button>
                      )}
                    </div>
                  )
                })}

                <button type="button" className="nc-add-btn" onClick={addItem}>
                  <span style={{ fontSize: 16 }}>+</span> Ajouter un produit
                </button>

                {total > 0 && (
                  <div className="nc-total-bar">
                    <div className="nc-total-left">
                      <span className="nc-total-label">Total commande</span>
                      <span className="nc-total-amount">{formatCFA(total)}</span>
                    </div>
                    {beneficeTotal > 0 && (
                      <div className="nc-benefice" style={{ color: '#2ecc87' }}>
                        <span style={{ color: '#4a5470', fontWeight: 400 }}>Bénéfice estimé </span>
                        +{formatCFA(beneficeTotal)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── CARD DETAILS ── */}
          <div className="nc-card">
            <div className="nc-card-hd">
              <div className="nc-card-ico" style={{ background: 'rgba(46,204,135,0.08)' }}>📋</div>
              <span className="nc-card-title">Détails de la commande</span>
            </div>

            {/* Canal */}
            <div style={{ marginBottom: 14 }}>
              <label className="nc-label">Canal de vente</label>
              <div className="nc-chips">
                {CANAUX.map(c => (
                  <button key={c.value} type="button"
                    className="nc-chip"
                    onClick={() => setCanal(c.value as any)}
                    style={{
                      background: canal === c.value ? `${c.color}12` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${canal === c.value ? c.color + '35' : 'rgba(255,255,255,0.07)'}`,
                      color: canal === c.value ? c.color : '#717a8f',
                    }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paiement */}
            <div style={{ marginBottom: 14 }}>
              <label className="nc-label">Mode de paiement</label>
              <div className="nc-chips">
                {PAIEMENTS.map(p => (
                  <button key={p.value} type="button"
                    className="nc-chip"
                    onClick={() => setModePaiement(p.value as any)}
                    style={{
                      background: modePaiement === p.value ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${modePaiement === p.value ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      color: modePaiement === p.value ? '#f5a623' : '#717a8f',
                    }}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statut */}
            <div style={{ marginBottom: 14 }}>
              <label className="nc-label">Statut initial</label>
              <div className="nc-chips">
                {STATUTS.map(s => (
                  <button key={s.value} type="button"
                    className="nc-chip"
                    onClick={() => setStatut(s.value as any)}
                    style={{
                      background: statut === s.value ? `${s.color}12` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${statut === s.value ? s.color + '35' : 'rgba(255,255,255,0.07)'}`,
                      color: statut === s.value ? s.color : '#717a8f',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="nc-note-wrap">
              <label className="nc-label">Note <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#2e3448' }}>(optionnel)</span></label>
              <textarea className="nc-textarea"
                placeholder="Adresse de livraison, instructions spéciales…"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="nc-actions">
            <Link href="/commandes" className="nc-cancel">Annuler</Link>
            <button type="submit" className="nc-submit" disabled={loading}>
              {loading
                ? <><span className="spinner" /> Enregistrement...</>
                : <>✓ Créer la commande</>}
            </button>
          </div>

        </form>
      </div>
    </>
  )
}