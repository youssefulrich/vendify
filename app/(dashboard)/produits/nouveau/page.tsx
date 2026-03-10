'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkProductLimit } from '@/lib/utils/freemium'

export default function NouveauProduitPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [prixAchat, setPrixAchat] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [stock, setStock] = useState('')
  const [stockAlerte, setStockAlerte] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const marge = prixAchat && prixVente
    ? Math.round(((parseFloat(prixVente) - parseFloat(prixAchat)) / parseFloat(prixAchat)) * 100)
    : null

  const benefice = prixAchat && prixVente
    ? parseFloat(prixVente) - parseFloat(prixAchat)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const limit = await checkProductLimit(user.id)
    if (!limit.allowed) {
      setError(`Limite atteinte (${limit.used}/${limit.limit} produits). Passez Premium pour des produits illimités.`)
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('products').insert({
      user_id: user.id,
      nom,
      description: description || null,
      prix_achat: parseFloat(prixAchat),
      prix_vente: parseFloat(prixVente),
      stock: parseInt(stock) || 0,
      stock_alerte: parseInt(stockAlerte) || 3,
    } as any)

    if (err) {
      setError('Erreur lors de la création du produit.')
      setLoading(false)
      return
    }

    router.push('/produits')
  }

  const margeColor = marge === null ? '#717a8f' : marge >= 30 ? '#2ecc87' : marge >= 10 ? '#f5a623' : '#ff5e5e'

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        .np-root { max-width: 580px; animation: fadeUp 0.4s ease both; }

        /* Back + title */
        .np-topbar {
          display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
        }
        .np-back {
          display: flex; align-items: center; gap: 6px;
          background: #161a22; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 8px 14px;
          font-size: 13px; color: #717a8f; text-decoration: none;
          transition: all 0.2s; flex-shrink: 0;
        }
        .np-back:hover { border-color: rgba(255,255,255,0.12); color: #c8cdd8; }
        .np-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; }

        /* Error */
        .np-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,94,94,0.06); border: 1px solid rgba(255,94,94,0.2);
          border-radius: 14px; padding: 14px 16px;
          font-size: 13px; color: #ff7070; margin-bottom: 20px; line-height: 1.5;
        }

        /* Card */
        .np-card {
          background: #161a22;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 22px;
          margin-bottom: 14px;
        }
        .np-card-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
        }
        .np-card-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
        }
        .np-card-title {
          font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#c8cdd8;
        }

        /* Field */
        .np-field { margin-bottom: 14px; }
        .np-field:last-child { margin-bottom: 0; }
        .np-label {
          display:block; font-size:10px; font-weight:700;
          letter-spacing:1.2px; text-transform:uppercase;
          color:#4a5470; margin-bottom:7px;
        }
        .np-input, .np-textarea {
          width:100%; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; padding:12px 16px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#e8eaf0; outline:none;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color:#e8eaf0;
        }
        .np-input::placeholder, .np-textarea::placeholder { color:#2e3448; }
        .np-input:focus, .np-textarea:focus {
          border-color:rgba(245,166,35,0.4);
          background:rgba(245,166,35,0.02);
          box-shadow:0 0 0 4px rgba(245,166,35,0.06);
        }
        .np-textarea { resize:none; height:76px; }

        /* Prix grid */
        .np-prix-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
        }
        .np-input-prix-wrap { position:relative; }
        .np-prix-suffix {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          font-size:11px; font-weight:700; color:#4a5470; pointer-events:none; letter-spacing:0.5px;
        }
        .np-input.has-suffix { padding-right: 56px; }

        /* Marge preview */
        .np-marge {
          margin-top:16px; border-radius:14px; padding:14px 16px;
          display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;
          transition:all 0.3s;
        }
        .np-marge-item { display:flex; flex-direction:column; gap:3px; }
        .np-marge-val { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; }
        .np-marge-label { font-size:10px; color:#4a5470; text-transform:uppercase; letter-spacing:0.5px; }

        /* Stock hint */
        .np-stock-hint {
          margin-top:8px; font-size:11px; color:#4a5470;
          display:flex; align-items:center; gap:5px;
        }

        /* Alerte preview */
        .np-alerte-badge {
          display:inline-flex; align-items:center; gap:5px;
          font-size:11px; padding:3px 9px; border-radius:20px; margin-top:6px;
        }

        /* Actions */
        .np-actions {
          display:flex; gap:10px; margin-top:6px;
        }
        .np-cancel {
          flex:1; background:#161a22;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:14px;
          font-size:14px; font-weight:600; color:#717a8f;
          text-decoration:none; display:flex;
          align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .np-cancel:hover { border-color:rgba(255,255,255,0.12); color:#c8cdd8; }
        .np-submit {
          flex:2; background:linear-gradient(135deg,#f5a623,#ffcc6b);
          color:#000; border:none; border-radius:14px; padding:14px;
          font-family:'Syne',sans-serif; font-size:15px; font-weight:700;
          cursor:pointer; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 20px rgba(245,166,35,0.25);
        }
        .np-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(245,166,35,0.35); }
        .np-submit:disabled { background:#1e2430; color:#3a4255; box-shadow:none; cursor:not-allowed; }
        .spinner { width:16px; height:16px; border:2px solid rgba(0,0,0,0.2); border-top-color:#000; border-radius:50%; animation:spin 0.7s linear infinite; }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .np-prix-grid { grid-template-columns: 1fr !important; }
          .np-marge { grid-template-columns: 1fr 1fr !important; }
          .np-title { font-size:20px; }
          .np-card { padding:16px; }
          .np-topbar { margin-bottom:20px; }
        }
      `}</style>

      <div className="np-root">

        {/* ── TOP BAR ── */}
        <div className="np-topbar">
          <Link href="/produits" className="np-back">← Produits</Link>
          <h1 className="np-title">Nouveau produit</h1>
        </div>

        {/* ── ERREUR ── */}
        {error && (
          <div className="np-error">
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span>{error} {error.includes('Premium') && <Link href="/premium" style={{ color: '#f5a623', fontWeight: 700 }}>Voir Premium →</Link>}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── CARD 1: INFOS ── */}
          <div className="np-card">
            <div className="np-card-header">
              <div className="np-card-icon" style={{ background: 'rgba(77,140,255,0.1)' }}>📦</div>
              <span className="np-card-title">Informations produit</span>
            </div>

            <div className="np-field">
              <label className="np-label">Nom du produit *</label>
              <input className="np-input" type="text"
                placeholder="Ex : Sneakers Nike AF1, Robe wax taille M…"
                value={nom} onChange={e => setNom(e.target.value)} required autoFocus />
            </div>

            <div className="np-field">
              <label className="np-label">Description <span style={{ color: '#2e3448', textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></label>
              <textarea className="np-textarea"
                placeholder="Couleur, taille, matière, référence…"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* ── CARD 2: PRIX ── */}
          <div className="np-card">
            <div className="np-card-header">
              <div className="np-card-icon" style={{ background: 'rgba(245,166,35,0.1)' }}>💰</div>
              <span className="np-card-title">Prix</span>
            </div>

            <div className="np-prix-grid">
              <div className="np-field">
                <label className="np-label">Prix d'achat *</label>
                <div className="np-input-prix-wrap">
                  <input className="np-input has-suffix" type="number" min="0" placeholder="0"
                    value={prixAchat} onChange={e => setPrixAchat(e.target.value)} required />
                  <span className="np-prix-suffix">FCFA</span>
                </div>
              </div>
              <div className="np-field">
                <label className="np-label">Prix de vente *</label>
                <div className="np-input-prix-wrap">
                  <input className="np-input has-suffix" type="number" min="0" placeholder="0"
                    value={prixVente} onChange={e => setPrixVente(e.target.value)} required />
                  <span className="np-prix-suffix">FCFA</span>
                </div>
              </div>
            </div>

            {/* Marge preview */}
            {marge !== null && benefice !== null && (
              <div className="np-marge" style={{
                background: marge >= 30 ? 'rgba(46,204,135,0.04)' : marge >= 10 ? 'rgba(245,166,35,0.04)' : 'rgba(255,94,94,0.04)',
                border: `1px solid ${margeColor}20`
              }}>
                <div className="np-marge-item">
                  <span className="np-marge-val" style={{ color: margeColor }}>
                    {marge > 0 ? '+' : ''}{marge}%
                  </span>
                  <span className="np-marge-label">Marge</span>
                </div>
                <div className="np-marge-item">
                  <span className="np-marge-val" style={{ color: benefice >= 0 ? '#c8cdd8' : '#ff7070' }}>
                    {benefice >= 0 ? '+' : ''}{benefice.toLocaleString('fr-FR')}
                  </span>
                  <span className="np-marge-label">Bénéfice / unité</span>
                </div>
                <div className="np-marge-item">
                  <span className="np-marge-val" style={{ color: '#c8cdd8', fontSize: 13, marginTop: 4 }}>
                    {marge >= 30 ? '🟢 Bonne marge' : marge >= 10 ? '🟡 Marge faible' : '🔴 Attention'}
                  </span>
                  <span className="np-marge-label">Évaluation</span>
                </div>
              </div>
            )}
          </div>

          {/* ── CARD 3: STOCK ── */}
          <div className="np-card">
            <div className="np-card-header">
              <div className="np-card-icon" style={{ background: 'rgba(46,204,135,0.1)' }}>📊</div>
              <span className="np-card-title">Stock</span>
            </div>

            <div className="np-prix-grid">
              <div className="np-field">
                <label className="np-label">Stock initial</label>
                <div className="np-input-prix-wrap">
                  <input className="np-input has-suffix" type="number" min="0" placeholder="0"
                    value={stock} onChange={e => setStock(e.target.value)} />
                  <span className="np-prix-suffix">unités</span>
                </div>
                {stock && parseInt(stock) > 0 && (
                  <div className="np-stock-hint">
                    <span style={{ color: '#2ecc87' }}>●</span>
                    Valeur stock : <strong style={{ color: '#c8cdd8', marginLeft: 3 }}>
                      {(parseInt(stock) * (parseFloat(prixAchat) || 0)).toLocaleString('fr-FR')} FCFA
                    </strong>
                  </div>
                )}
              </div>
              <div className="np-field">
                <label className="np-label">Alerte stock faible</label>
                <div className="np-input-prix-wrap">
                  <input className="np-input has-suffix" type="number" min="0" placeholder="3"
                    value={stockAlerte} onChange={e => setStockAlerte(e.target.value)} />
                  <span className="np-prix-suffix">unités</span>
                </div>
                <div className="np-alerte-badge" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.12)', color: '#f5a623' }}>
                  <span>⚠</span> Alerte si ≤ {stockAlerte || 3} unités
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="np-actions">
            <Link href="/produits" className="np-cancel">Annuler</Link>
            <button type="submit" className="np-submit" disabled={loading}>
              {loading
                ? <><span className="spinner" /> Enregistrement...</>
                : <>✓ Ajouter le produit</>}
            </button>
          </div>

        </form>
      </div>
    </>
  )
}