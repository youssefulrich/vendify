'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function formatCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function BoutiquePage() {
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const parts = window.location.pathname.split('/')
    const slug = parts[parts.length - 1]

    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id,shop_name,full_name,phone,pays,plan')
        .eq('shop_slug', slug)
        .single()

      if (!profile) { setNotFound(true); setLoading(false); return }

      const { data: products } = await supabase
        .from('products')
        .select('id,nom,description,prix_vente,stock,photo_url')
        .eq('user_id', profile.id)
        .eq('actif', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })

      setProfile(profile)
      setProducts(products || [])
      setLoading(false)
      document.title = `${profile.shop_name} — Vendify`
    }
    load()
  }, [])

  const waPhone = profile?.phone?.replace(/\D/g, '') || ''
  const filtered = products.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 56 }}>🏪</div>
      <div style={{ color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800 }}>Boutique introuvable</div>
      <a href="/register" style={{ color: '#f5a623', fontSize: 13, textDecoration: 'none' }}>Créer ma boutique →</a>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #f0ede8; -webkit-font-smoothing: antialiased; }

        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }

        /* ── TOPBAR ── */
        .topbar {
          position: sticky; top: 0; z-index: 200;
          background: rgba(10,10,10,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .topbar-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .topbar-icon  { width: 30px; height: 30px; background: linear-gradient(135deg, #f5a623, #ffcc6b); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .topbar-name  { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #f0ede8; letter-spacing: 0.5px; }
        .topbar-cta   { font-size: 11px; color: #666; white-space: nowrap; }
        .topbar-cta a { color: #f5a623; font-weight: 600; text-decoration: none; }

        /* ── HERO ── */
        .hero {
          position: relative; overflow: hidden;
          background: linear-gradient(160deg, #111 0%, #0a0a0a 50%, #0d0a05 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 60px 24px 48px;
          text-align: center;
        }
        .hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-avatar {
          width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 18px;
          background: linear-gradient(135deg, #f5a623, #ff9d00);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; box-shadow: 0 8px 32px rgba(245,166,35,0.3);
          position: relative; z-index: 1;
          animation: slideUp 0.5s ease both;
        }
        .hero-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 7vw, 52px); font-weight: 900;
          color: #f0ede8; letter-spacing: -1px; line-height: 1.1;
          margin-bottom: 8px; position: relative; z-index: 1;
          animation: slideUp 0.5s 0.08s ease both;
        }
        .hero-sub {
          font-size: 13px; color: #666; margin-bottom: 20px;
          position: relative; z-index: 1; font-style: italic;
          animation: slideUp 0.5s 0.12s ease both;
        }
        .hero-tags {
          display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
          margin-bottom: 28px; position: relative; z-index: 1;
          animation: slideUp 0.5s 0.16s ease both;
        }
        .tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
        .tag-green  { background: rgba(34,197,94,0.1);  border: 1px solid rgba(34,197,94,0.2);  color: #4ade80; }
        .tag-gold   { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); color: #f5a623; }
        .tag-white  { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; }
        .hero-wa {
          display: inline-flex; align-items: center; gap: 10px;
          background: #25d366; color: #fff;
          border-radius: 100px; padding: 13px 28px;
          font-size: 14px; font-weight: 600; text-decoration: none;
          box-shadow: 0 4px 20px rgba(37,211,102,0.35);
          transition: all 0.2s; position: relative; z-index: 1;
          animation: slideUp 0.5s 0.2s ease both;
        }
        .hero-wa:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,211,102,0.45); }

        /* ── SEARCH & FILTER ── */
        .toolbar {
          max-width: 1100px; margin: 0 auto;
          padding: 28px 24px 0;
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }
        .toolbar-left  { display: flex; align-items: center; gap: 8px; }
        .toolbar-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; }
        .toolbar-count { font-size: 12px; color: #555; font-style: italic; margin-top: 2px; }
        .search-wrap   { position: relative; }
        .search-input  {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px; padding: 9px 16px 9px 38px;
          font-size: 13px; color: #f0ede8; outline: none; width: 220px;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .search-input:focus { border-color: rgba(245,166,35,0.4); background: rgba(255,255,255,0.07); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555; font-size: 14px; pointer-events: none; }

        /* ── GRID ── */
        .grid-wrap { max-width: 1100px; margin: 0 auto; padding: 20px 24px 80px; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* ── PRODUCT CARD ── */
        .card {
          background: #111; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden; cursor: pointer;
          transition: all 0.25s; animation: slideUp 0.4s ease both;
        }
        .card:hover { border-color: rgba(245,166,35,0.3); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
        .card-img {
          aspect-ratio: 1; background: #1a1a1a; overflow: hidden; position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .card-img img   { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .card:hover .card-img img { transform: scale(1.05); }
        .card-placeholder { font-size: 52px; opacity: 0.2; }
        .stock-pill {
          position: absolute; top: 10px; left: 10px;
          padding: 4px 10px; border-radius: 100px; font-size: 10px; font-weight: 700;
          backdrop-filter: blur(8px); letter-spacing: 0.3px;
        }
        .stock-ok  { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
        .stock-low { background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.3); color: #f5a623; }
        .card-body  { padding: 16px; }
        .card-name  { font-size: 15px; font-weight: 600; margin-bottom: 4px; line-height: 1.3; color: #f0ede8; }
        .card-desc  { font-size: 12px; color: #555; margin-bottom: 14px; line-height: 1.5; font-style: italic; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-foot  { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .card-price { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700; color: #f5a623; }
        .card-btn   {
          display: flex; align-items: center; gap: 5px;
          background: #25d366; color: #fff; border-radius: 100px;
          padding: 8px 16px; font-size: 12px; font-weight: 600; text-decoration: none;
          transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .card-btn:hover { background: #1fbc58; transform: scale(1.03); }

        /* ── MODAL ── */
        .overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: fadeIn 0.2s ease;
          padding: 0;
        }
        .modal {
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px 24px 0 0; width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          animation: slideUp 0.3s ease;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .modal-img  { aspect-ratio: 4/3; background: #1a1a1a; display: flex; align-items: center; justify-content: center; border-radius: 24px 24px 0 0; overflow: hidden; }
        .modal-img img { width: 100%; height: 100%; object-fit: cover; }
        .modal-body { padding: 24px; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #fff; backdrop-filter: blur(8px); z-index: 10; }
        .modal-name  { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .modal-desc  { font-size: 14px; color: #777; line-height: 1.6; margin-bottom: 20px; font-style: italic; }
        .modal-price { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #f5a623; margin-bottom: 20px; }
        .modal-stock { font-size: 12px; color: #555; margin-bottom: 20px; }
        .modal-wa   {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #25d366; color: #fff; border-radius: 14px;
          padding: 16px; font-size: 15px; font-weight: 700;
          text-decoration: none; box-shadow: 0 4px 20px rgba(37,211,102,0.3);
          transition: all 0.2s; width: 100%;
        }
        .modal-wa:hover { background: #1fbc58; }

        /* ── EMPTY ── */
        .empty { text-align: center; padding: 80px 24px; color: #444; }
        .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.4; }

        /* ── FOOTER ── */
        .footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 24px; text-align: center; font-size: 11px; color: #333; }
        .footer a { color: #f5a623; text-decoration: none; font-weight: 600; }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .grid-wrap { padding: 16px 16px 60px; }
          .toolbar { padding: 20px 16px 0; }
          .hero { padding: 40px 16px 36px; }
          .search-input { width: 160px; }
          .card-price { font-size: 16px; }
          .card-btn { padding: 7px 12px; font-size: 11px; }
        }
        @media (max-width: 380px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <a href="/" className="topbar-brand">
          <div className="topbar-icon">🛒</div>
          <span className="topbar-name">Vendify</span>
        </a>
        <span className="topbar-cta">
          Vendez aussi ? <a href="/register">Créer ma boutique →</a>
        </span>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-avatar">🏪</div>
        <h1 className="hero-name">{profile.shop_name}</h1>
        <p className="hero-sub">par {profile.full_name || profile.shop_name}</p>
        <div className="hero-tags">
          <span className="tag tag-green">● En ligne</span>
          <span className="tag tag-gold">📦 {products.length} produit{products.length > 1 ? 's' : ''}</span>
          {profile.pays && <span className="tag tag-white">📍 {profile.pays}</span>}
          {profile.plan === 'premium' && <span className="tag tag-gold">⚡ Boutique Premium</span>}
        </div>
        {waPhone && (
          <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Bonjour ! J'ai découvert votre boutique sur Vendify et j'aimerais passer une commande 🛒")}`}
            className="hero-wa" target="_blank" rel="noopener noreferrer">
            <span style={{ fontSize: 18 }}>💬</span>
            Nous contacter sur WhatsApp
          </a>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div>
            <div className="toolbar-title">Catalogue</div>
            <div className="toolbar-count">{filtered.length} article{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid-wrap">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, color: '#555', marginBottom: 6 }}>
              {search ? 'Aucun résultat' : 'Aucun produit disponible'}
            </div>
            {search && <div style={{ fontSize: 13, color: '#444' }}>Essayez un autre mot-clé</div>}
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p: any, i: number) => (
              <div key={p.id} className="card" style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => setSelected(p)}>
                <div className="card-img">
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.nom} />
                    : <span className="card-placeholder">📦</span>
                  }
                  <div className={`stock-pill ${p.stock > 5 ? 'stock-ok' : 'stock-low'}`}>
                    {p.stock > 5 ? '● En stock' : `⚠ ${p.stock} restant${p.stock > 1 ? 's' : ''}`}
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-name">{p.nom}</div>
                  {p.description && <div className="card-desc">{p.description}</div>}
                  <div className="card-foot">
                    <div className="card-price">{formatCFA(p.prix_vente)}</div>
                    <a href={waPhone
                      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour ! Je veux commander : *${p.nom}* (${formatCFA(p.prix_vente)}) 🛒`)}`
                      : '#'}
                      className="card-btn"
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}>
                      💬 Commander
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PRODUIT */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="modal-img">
              {selected.photo_url
                ? <img src={selected.photo_url} alt={selected.nom} />
                : <span style={{ fontSize: 72, opacity: 0.15 }}>📦</span>
              }
            </div>
            <div className="modal-body">
              <div className="modal-name">{selected.nom}</div>
              {selected.description && <div className="modal-desc">{selected.description}</div>}
              <div className="modal-price">{formatCFA(selected.prix_vente)}</div>
              <div className="modal-stock">
                {selected.stock > 5
                  ? <span style={{ color: '#4ade80' }}>● {selected.stock} en stock</span>
                  : <span style={{ color: '#f5a623' }}>⚠ Plus que {selected.stock} disponible{selected.stock > 1 ? 's' : ''}</span>
                }
              </div>
              <a href={waPhone
                ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour ! Je veux commander : *${selected.nom}* (${formatCFA(selected.prix_vente)}) 🛒`)}`
                : '#'}
                className="modal-wa"
                target="_blank" rel="noopener noreferrer">
                <span style={{ fontSize: 20 }}>💬</span>
                Commander via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        Boutique propulsée par <a href="/">Vendify.ci</a> — La plateforme des vendeurs africains
      </div>
    </>
  )
}