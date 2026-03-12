'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Vêtements', 'Chaussures', 'Bijoux', 'Sacs', 'Beauté', 'Alimentation', 'Électronique', 'Maison', 'Autre']

export default function ProduitsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '', description: '', prix_achat: '', prix_vente: '', prix_promo: '',
    stock: '', stock_alerte: '5', actif: true, photo_url: '', categorie: ''
  })
  const [previewUrl, setPreviewUrl] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: profile } = await (supabase as any).from('profiles').select('plan').eq('id', user.id).single()
    setIsPremium(profile?.plan === 'premium')
    const { data } = await (supabase as any).from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditProduct(null)
    setForm({ nom: '', description: '', prix_achat: '', prix_vente: '', prix_promo: '', stock: '', stock_alerte: '5', actif: true, photo_url: '', categorie: '' })
    setPreviewUrl('')
    setPhotoFile(null)
    setShowForm(true)
  }

  function openEdit(p: any) {
    setEditProduct(p)
    setForm({
      nom: p.nom, description: p.description || '', prix_achat: String(p.prix_achat),
      prix_vente: String(p.prix_vente), prix_promo: p.prix_promo ? String(p.prix_promo) : '',
      stock: String(p.stock), stock_alerte: String(p.stock_alerte),
      actif: p.actif, photo_url: p.photo_url || '', categorie: p.categorie || ''
    })
    setPreviewUrl(p.photo_url || '')
    setPhotoFile(null)
    setShowForm(true)
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.nom || !form.prix_vente || !form.stock) return
    setSaving(true)
    try {
      let photo_url = form.photo_url
      if (photoFile) {
        setUploading(true)
        photo_url = await uploadPhoto(photoFile)
        setUploading(false)
      }
      const payload = {
        nom: form.nom, description: form.description || null,
        prix_achat: Number(form.prix_achat) || 0,
        prix_vente: Number(form.prix_vente),
        prix_promo: form.prix_promo ? Number(form.prix_promo) : null,
        stock: Number(form.stock),
        stock_alerte: Number(form.stock_alerte) || 5,
        actif: form.actif, photo_url: photo_url || null,
        categorie: form.categorie || null,
        user_id: userId,
      }
      if (editProduct) {
        await (supabase as any).from('products').update(payload).eq('id', editProduct.id)
      } else {
        await (supabase as any).from('products').insert(payload)
      }
      setShowForm(false)
      load()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    setDeleting(id)
    await (supabase as any).from('products').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  async function toggleActif(p: any) {
    await (supabase as any).from('products').update({ actif: !p.actif }).eq('id', p.id)
    load()
  }

  const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
  const maxProducts = isPremium ? Infinity : 5
  const canAdd = products.length < maxProducts

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#f5a623', fontSize: 14 }}>Chargement...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        .prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .prod-card { background: #161a22; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; transition: all 0.2s; }
        .prod-card:hover { border-color: rgba(245,166,35,0.2); transform: translateY(-2px); }
        .prod-img { aspect-ratio: 1; background: #1e2330; display: flex; align-items: center; justify-content: center; font-size: 48px; overflow: hidden; position: relative; }
        .prod-img img { width: 100%; height: 100%; object-fit: cover; }
        .prod-body { padding: 14px; }
        .prod-cat  { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 3px; }
        .prod-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: #f0f2f7; }
        .prod-prices { margin-bottom: 10px; }
        .prod-price-promo { font-size: 16px; font-weight: 800; color: #ff4444; }
        .prod-price-orig  { font-size: 11px; color: #555; text-decoration: line-through; }
        .prod-price-normal { font-size: 16px; font-weight: 800; color: #f5a623; }
        .prod-actions { display: flex; gap: 8px; }
        .btn-edit { flex: 1; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #c8cdd8; font-size: 12px; cursor: pointer; }
        .btn-del  { padding: 8px 12px; background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.15); border-radius: 8px; color: #ff5e5e; font-size: 12px; cursor: pointer; }
        .modal-bg  { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: #161a22; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 28px; }
        .inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 14px; color: #f0f2f7; font-size: 14px; outline: none; transition: border 0.15s; font-family: inherit; }
        .inp:focus { border-color: rgba(245,166,35,0.4); }
        .lbl { font-size: 12px; font-weight: 600; color: #717a8f; margin-bottom: 6px; display: block; letter-spacing: 0.5px; text-transform: uppercase; }
        .upload-zone { border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
        .upload-zone:hover { border-color: rgba(245,166,35,0.3); background: rgba(245,166,35,0.03); }
        .upload-preview { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; }
        .promo-tag { position: absolute; top: 8px; right: 8px; background: #ff4444; color: #fff; padding: 3px 8px; border-radius: 100px; font-size: 10px; font-weight: 800; }
        @media (max-width: 640px) { .prod-grid { grid-template-columns: 1fr 1fr; } .modal-box { padding: 20px; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f2f7' }}>Produits</h1>
          <div style={{ fontSize: 12, color: '#717a8f', marginTop: 2 }}>
            {products.length} produit{products.length > 1 ? 's' : ''} {!isPremium && `· ${products.length}/5`}
          </div>
        </div>
        <button onClick={openNew} disabled={!canAdd} style={{
          background: canAdd ? 'linear-gradient(135deg, #f5a623, #ffcc6b)' : 'rgba(255,255,255,0.05)',
          color: canAdd ? '#000' : '#3a4255', border: 'none', borderRadius: 12, padding: '10px 20px',
          fontSize: 13, fontWeight: 700, cursor: canAdd ? 'pointer' : 'not-allowed'
        }}>
          {canAdd ? '+ Nouveau produit' : '⚡ Limite atteinte (5/5)'}
        </button>
      </div>

      {!isPremium && (
        <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#f5a623' }}>
          ⚡ Plan gratuit : {products.length}/5 produits. <a href="/premium" style={{ color: '#f5a623', fontWeight: 700 }}>Passer Premium →</a>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#717a8f' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun produit</div>
        </div>
      ) : (
        <div className="prod-grid">
          {products.map((p: any) => (
            <div key={p.id} className="prod-card">
              <div className="prod-img">
                {p.photo_url ? <img src={p.photo_url} alt={p.nom} /> : <span>📦</span>}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: p.actif ? 'rgba(34,197,94,0.15)' : 'rgba(255,80,80,0.15)',
                  border: `1px solid ${p.actif ? 'rgba(34,197,94,0.3)' : 'rgba(255,80,80,0.3)'}`,
                  color: p.actif ? '#4ade80' : '#ff5e5e',
                  borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer'
                }} onClick={() => toggleActif(p)}>
                  {p.actif ? '● Actif' : '○ Inactif'}
                </div>
                {p.prix_promo && <div className="promo-tag">PROMO</div>}
              </div>
              <div className="prod-body">
                {p.categorie && <div className="prod-cat">{p.categorie}</div>}
                <div className="prod-name">{p.nom}</div>
                <div style={{ fontSize: 11, color: '#717a8f', marginBottom: 6 }}>Stock: {p.stock}</div>
                <div className="prod-prices">
                  {p.prix_promo ? (
                    <>
                      <div className="prod-price-promo">{formatCFA(p.prix_promo)}</div>
                      <div className="prod-price-orig">{formatCFA(p.prix_vente)}</div>
                    </>
                  ) : (
                    <div className="prod-price-normal">{formatCFA(p.prix_vente)}</div>
                  )}
                </div>
                <div className="prod-actions">
                  <button className="btn-edit" onClick={() => openEdit(p)}>✎ Modifier</button>
                  <button className="btn-del" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                    {deleting === p.id ? '...' : '🗑'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{editProduct ? 'Modifier' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#717a8f', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Photo */}
            <div style={{ marginBottom: 20 }}>
              <label className="lbl">Photo du produit</label>
              <label className="upload-zone">
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="upload-preview" alt="preview" />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#f5a623' }}>Cliquez pour changer</div>
                  </>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: '#717a8f' }}>Cliquez pour ajouter une photo</div>
                    <div style={{ fontSize: 11, color: '#3a4255', marginTop: 4 }}>JPG, PNG, WEBP · Max 5MB</div>
                  </div>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="lbl">Nom du produit *</label>
                <input className="inp" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Sneakers Nike AF1" />
              </div>

              <div>
                <label className="lbl">Catégorie</label>
                <select className="inp" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} style={{ cursor: 'pointer' }}>
                  <option value="">Sans catégorie</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="lbl">Description</label>
                <textarea className="inp" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du produit..." rows={3} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="lbl">Prix d'achat (FCFA)</label>
                  <input className="inp" type="number" value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="lbl">Prix de vente (FCFA) *</label>
                  <input className="inp" type="number" value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: e.target.value })} placeholder="0" />
                </div>
              </div>

              <div>
                <label className="lbl">Prix promotionnel (FCFA) — optionnel</label>
                <input className="inp" type="number" value={form.prix_promo} onChange={e => setForm({ ...form, prix_promo: e.target.value })} placeholder="Laissez vide si pas de promo" />
                {form.prix_promo && Number(form.prix_promo) < Number(form.prix_vente) && (
                  <div style={{ fontSize: 11, color: '#ff4444', marginTop: 4 }}>
                    🏷 Réduction de {Math.round((1 - Number(form.prix_promo) / Number(form.prix_vente)) * 100)}%
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="lbl">Stock *</label>
                  <input className="inp" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="lbl">Alerte stock</label>
                  <input className="inp" type="number" value={form.stock_alerte} onChange={e => setForm({ ...form, stock_alerte: e.target.value })} placeholder="5" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="actif" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#f5a623' }} />
                <label htmlFor="actif" style={{ fontSize: 13, color: '#c8cdd8', cursor: 'pointer' }}>Produit actif (visible sur la boutique)</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#717a8f', fontSize: 14, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || uploading} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {uploading ? '📤 Upload...' : saving ? 'Sauvegarde...' : editProduct ? '✓ Modifier' : '✓ Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}