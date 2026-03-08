'use client'

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
    })

    if (err) {
      setError('Erreur lors de la création du produit.')
      setLoading(false)
      return
    }

    router.push('/produits')
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
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/produits" style={{ color: 'var(--muted)', fontSize: 14 }}>← Retour</Link>
        <h1 className="font-syne text-2xl font-bold">Nouveau produit</h1>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-5 text-sm"
          style={{ background: '#ff5e5e15', border: '1px solid #ff5e5e30', color: 'var(--red)' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Informations produit</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Nom du produit *</label>
              <input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)}
                placeholder="Ex: Sneakers Nike AF1" required />
            </div>
            <div>
              <label style={labelStyle}>Description (optionnel)</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: 70 }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Couleur, taille, détails..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Prix & Stock</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Prix d'achat (FCFA) *</label>
              <input style={inputStyle} type="number" min="0" value={prixAchat}
                onChange={e => setPrixAchat(e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label style={labelStyle}>Prix de vente (FCFA) *</label>
              <input style={inputStyle} type="number" min="0" value={prixVente}
                onChange={e => setPrixVente(e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label style={labelStyle}>Stock initial</label>
              <input style={inputStyle} type="number" min="0" value={stock}
                onChange={e => setStock(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Alerte stock faible</label>
              <input style={inputStyle} type="number" min="0" value={stockAlerte}
                onChange={e => setStockAlerte(e.target.value)} placeholder="3" />
            </div>
          </div>

          {marge !== null && (
            <div className="mt-4 p-3 rounded-xl flex items-center justify-between"
              style={{ background: marge > 0 ? '#2ecc8710' : '#ff5e5e10', border: `1px solid ${marge > 0 ? '#2ecc8730' : '#ff5e5e30'}` }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Marge calculée</span>
              <span className="font-syne font-black text-lg" style={{ color: marge > 0 ? 'var(--green)' : 'var(--red)' }}>
                {marge > 0 ? '+' : ''}{marge}%
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/produits"
            className="flex-1 rounded-xl py-3 text-sm font-bold text-center"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            Annuler
          </Link>
          <button type="submit" disabled={loading}
            className="rounded-xl py-3 text-sm font-bold"
            style={{ flex: 2, background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enregistrement...' : '✓ Ajouter le produit'}
          </button>
        </div>
      </form>
    </div>
  )
}
