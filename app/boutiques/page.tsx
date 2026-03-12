'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['Tous', 'Vêtements', 'Chaussures', 'Bijoux', 'Sacs', 'Beauté', 'Alimentation', 'Électronique', 'Maison', 'Autre']
const PAYS_OPTIONS = [
  { value: 'tous', flag: '🌍', label: 'Tous les pays' },
  { value: 'CI',   flag: '🇨🇮', label: "Côte d'Ivoire" },
  { value: 'SN',   flag: '🇸🇳', label: 'Sénégal' },
  { value: 'BJ',   flag: '🇧🇯', label: 'Bénin' },
  { value: 'CM',   flag: '🇨🇲', label: 'Cameroun' },
  { value: 'TG',   flag: '🇹🇬', label: 'Togo' },
]

function formatCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function BoutiquesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [activePays, setActivePays] = useState('tous')
  const [sortBy, setSortBy] = useState<'recent' | 'prix_asc' | 'prix_desc'>('recent')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [stats, setStats] = useState({ boutiques: 0, produits: 0 })

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, nom, description, prix_vente, prix_promo, photo_url,
        stock, categorie, created_at,
        profiles!inner (
          id, shop_name, shop_slug, pays, plan
        )
      `)
      .eq('actif', true)
      .gt('stock', 0)
      .eq('profiles.plan', 'premium')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
      const boutiques = new Set(data.map((p: any) => p.profiles?.shop_slug)).size
      setStats({ boutiques, produits: data.length })
    }
    setLoading(false)
  }

  const filtered = products
    .filter(p => {
      const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.profiles?.shop_name?.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'Tous' || p.categorie === activeCategory
      const matchPays = activePays === 'tous' || p.profiles?.pays === activePays
      return matchSearch && matchCat && matchPays
    })
    .sort((a, b) => {
      if (sortBy === 'prix_asc') return (a.prix_promo || a.prix_vente) - (b.prix_promo || b.prix_vente)
      if (sortBy === 'prix_desc') return (b.prix_promo || b.prix_vente) - (a.prix_promo || a.prix_vente)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Grouper par boutique pour la vue boutiques
  const boutiquesMap = products.reduce((acc: any, p: any) => {
    const slug = p.profiles?.shop_slug
    if (!slug) return acc
    if (!acc[slug]) acc[slug] = { ...p.profiles, produits: [] }
    acc[slug].produits.push(p)
    return acc
  }, {})
  const boutiquesArr = Object.values(boutiquesMap)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #f0ede8; -webkit-font-smoothing: antialiased; }

        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }

        /* NAV */
        .nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #f5a623, #ffcc6b); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 14px rgba(245,166,35,0.3); }
        .nav-logo-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #f5a623, #ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-tagline { font-size: 12px; color: #555; font-style: italic; }
        .nav-cta { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border: none; border-radius: 10px; padding: '8px 16px'; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; padding: 9px 18px; white-space: nowrap; }

        /* HERO */
        .hero { background: linear-gradient(160deg, #111 0%, #0a0a0a 60%); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 56px 24px 48px; text-align: center; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%); }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.2); border-radius: 100px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #f5a623; letter-spacing: 0.5px; margin-bottom: 20px; animation: fadeIn 0.4s ease; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 6vw, 56px); font-weight: 900; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; animation: slideUp 0.4s ease; }
        .hero-title span { background: linear-gradient(135deg, #f5a623, #ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { font-size: 15px; color: #666; max-width: 480px; margin: 0 auto 32px; line-height: 1.6; animation: slideUp 0.4s 0.05s ease both; }
        .hero-stats { display: flex; align-items: center; justify-content: center; gap: 32px; animation: slideUp 0.4s 0.1s ease both; }
        .hero-stat { text-align: center; }
        .hero-stat-val { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; color: #f5a623; }
        .hero-stat-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
        .hero-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.08); }

        /* SEARCH BAR */
        .search-bar { max-width: 680px; margin: 0 auto; padding: 0 24px; transform: translateY(-24px); }
        .search-inner { background: #161a22; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 6px 6px 6px 18px; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .search-icon { font-size: 16px; color: #555; flex-shrink: 0; }
        .search-inp { flex: 1; background: none; border: none; outline: none; color: #f0ede8; font-size: 14px; font-family: 'DM Sans', sans-serif; }
        .search-inp::placeholder { color: #3a4255; }
        .search-btn { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }

        /* FILTERS */
        .filters-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px 20px; }
        .filters-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .filters-label { font-size: 11px; font-weight: 700; color: #3a4255; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
        .filters-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; flex: 1; }
        .filters-scroll::-webkit-scrollbar { display: none; }
        .filter-btn { padding: 7px 16px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; border: none; }
        .filter-btn.active { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; box-shadow: 0 4px 12px rgba(245,166,35,0.25); }
        .filter-btn.inactive { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #717a8f; }
        .filter-btn.inactive:hover { background: rgba(255,255,255,0.07); color: #c8cdd8; }
        .sort-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 8px 12px; color: #c8cdd8; font-size: 12px; outline: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .sort-select option { background: #161a22; }

        /* CONTENT */
        .content { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; }
        .content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .content-count { font-size: 13px; color: #555; }
        .content-count strong { color: #c8cdd8; }

        /* PRODUCT GRID */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .card { background: #111; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.25s; animation: slideUp 0.4s ease both; }
        .card:hover { border-color: rgba(245,166,35,0.25); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
        .card-img { aspect-ratio: 1; background: #1a1a1a; display: flex; align-items: center; justify-content: center; font-size: 48px; overflow: hidden; position: relative; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .card:hover .card-img img { transform: scale(1.06); }
        .card-body { padding: 12px 14px 14px; }
        .card-shop { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #555; margin-bottom: 4px; }
        .card-shop-dot { width: 5px; height: 5px; border-radius: 50%; background: #f5a623; }
        .card-name { font-size: 13px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-cat  { font-size: 10px; color: #3a4255; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .price-promo  { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #ff4444; }
        .price-orig   { font-size: 10px; color: #555; text-decoration: line-through; }
        .price-normal { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #f5a623; }
        .card-btn { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); color: #f5a623; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; white-space: nowrap; text-decoration: none; flex-shrink: 0; transition: all 0.15s; }
        .card-btn:hover { background: rgba(245,166,35,0.18); }
        .promo-pill { position: absolute; top: 8px; right: 8px; background: #ff4444; color: #fff; padding: 3px 8px; border-radius: 100px; font-size: 10px; font-weight: 800; }
        .stock-pill { position: absolute; top: 8px; left: 8px; padding: 3px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; backdrop-filter: blur(8px); }
        .stock-ok  { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
        .stock-low { background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.3); color: #f5a623; }

        /* BOUTIQUES SECTION */
        .section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .boutiques-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 48px; }
        .boutique-card { background: #111; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; text-decoration: none; display: block; }
        .boutique-card:hover { border-color: rgba(245,166,35,0.25); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
        .boutique-avatar { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #f5a623, #ff9d00); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(245,166,35,0.25); }
        .boutique-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; color: #f0ede8; }
        .boutique-meta { font-size: 11px; color: #555; margin-bottom: 12px; }
        .boutique-preview { display: flex; gap: 6px; }
        .boutique-thumb { width: 44px; height: 44px; border-radius: 8px; background: #1a1a1a; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .boutique-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .boutique-more { width: 44px; height: 44px; border-radius: 8px; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #f5a623; }

        /* PANEL */
        .overlay { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
        .panel { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px 24px 0 0; width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s ease; }
        .panel-img { aspect-ratio: 4/3; background: #1a1a1a; display: flex; align-items: center; justify-content: center; font-size: 64px; position: relative; overflow: hidden; }
        .panel-img img { width: 100%; height: 100%; object-fit: cover; }
        .panel-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; font-size: 15px; backdrop-filter: blur(8px); }
        .panel-body { padding: 24px; }
        .panel-shop-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.15); border-radius: 100px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #f5a623; margin-bottom: 12px; text-decoration: none; }
        .panel-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .panel-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 16px; font-style: italic; }
        .panel-price-promo { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #ff4444; }
        .panel-price-orig  { font-size: 14px; color: #555; text-decoration: line-through; margin-top: 2px; }
        .panel-price-normal { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #f5a623; }
        .panel-economy { display: inline-block; background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.2); color: #ff4444; border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: 700; margin-top: 6px; }
        .btn-voir-boutique { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 14px; padding: 14px; font-size: 15px; font-weight: 700; text-decoration: none; margin-bottom: 10px; }
        .btn-wa { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2); color: #25d366; border-radius: 14px; padding: 12px; font-size: 14px; font-weight: 600; text-decoration: none; }

        /* EMPTY */
        .empty { text-align: center; padding: 80px 20px; }
        .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.3; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #555; margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: #3a4255; }

        /* SKELETON */
        .skeleton { background: linear-gradient(90deg, #161a22 25%, #1e2330 50%, #161a22 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

        /* FOOTER */
        .footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 32px 24px; text-align: center; }
        .footer-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #f5a623, #ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .footer-sub { font-size: 12px; color: #555; margin-bottom: 16px; }
        .footer-cta { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 700; text-decoration: none; }

        @media (max-width: 768px) {
          .hero { padding: 40px 16px 36px; }
          .search-bar { padding: 0 16px; }
          .filters-wrap { padding: 0 16px 16px; }
          .content { padding: 0 16px 60px; }
          .grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .boutiques-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .nav { padding: 0 16px; }
          .nav-tagline { display: none; }
          .hero-stats { gap: 20px; }
        }
        @media (max-width: 400px) {
          .grid { grid-template-columns: 1fr; }
          .boutiques-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">🛒</div>
          <div>
            <div className="nav-logo-name">Vendify</div>
            <div className="nav-tagline">Le marché africain en ligne</div>
          </div>
        </a>
        <a href="/register" className="nav-cta">Vendre sur Vendify →</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🌍 Marché en ligne · Afrique de l'Ouest</div>
        <h1 className="hero-title">
          Découvrez les meilleures<br />
          <span>boutiques africaines</span>
        </h1>
        <p className="hero-sub">
          Des centaines de produits sélectionnés par des vendeurs vérifiés en Côte d'Ivoire, Sénégal, Bénin et plus encore.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val">{stats.boutiques}</div>
            <div className="hero-stat-label">Boutiques</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-val">{stats.produits}</div>
            <div className="hero-stat-label">Produits</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-val">5</div>
            <div className="hero-stat-label">Pays</div>
          </div>
        </div>
      </section>

      {/* SEARCH BAR */}
      <div className="search-bar">
        <div className="search-inner">
          <span className="search-icon">🔍</span>
          <input className="search-inp" type="text" placeholder="Rechercher un produit ou une boutique..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-wrap" style={{ marginTop: 12 }}>
        {/* Catégories */}
        <div className="filters-row">
          <span className="filters-label">Catégorie</span>
          <div className="filters-scroll">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`filter-btn ${activeCategory === cat ? 'active' : 'inactive'}`}
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pays + tri */}
        <div className="filters-row">
          <span className="filters-label">Pays</span>
          <div className="filters-scroll">
            {PAYS_OPTIONS.map(p => (
              <button key={p.value} className={`filter-btn ${activePays === p.value ? 'active' : 'inactive'}`}
                onClick={() => setActivePays(p.value)}>
                {p.flag} {p.label}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="recent">Plus récents</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">

        {loading ? (
          /* Skeletons */
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 20, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* BOUTIQUES — affiché seulement si pas de filtre actif */}
            {activeCategory === 'Tous' && activePays === 'tous' && !search && boutiquesArr.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div className="section-title">🏪 Boutiques</div>
                <div className="boutiques-grid">
                  {boutiquesArr.map((b: any) => (
                    <a key={b.shop_slug} href={`/b/${b.shop_slug}`} className="boutique-card">
                      <div className="boutique-avatar">🏪</div>
                      <div className="boutique-name">{b.shop_name}</div>
                      <div className="boutique-meta">
                        {PAYS_OPTIONS.find(p => p.value === b.pays)?.flag} {PAYS_OPTIONS.find(p => p.value === b.pays)?.label}
                        · {b.produits.length} produit{b.produits.length > 1 ? 's' : ''}
                      </div>
                      <div className="boutique-preview">
                        {b.produits.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="boutique-thumb">
                            {p.photo_url ? <img src={p.photo_url} alt={p.nom} /> : '📦'}
                          </div>
                        ))}
                        {b.produits.length > 3 && (
                          <div className="boutique-more">+{b.produits.length - 3}</div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUITS */}
            <div className="content-header">
              <div className="section-title" style={{ marginBottom: 0 }}>
                🛍 Produits
              </div>
              <div className="content-count">
                <strong>{filtered.length}</strong> résultat{filtered.length > 1 ? 's' : ''}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📦</div>
                <div className="empty-title">Aucun produit trouvé</div>
                <div className="empty-sub">Essayez une autre recherche ou catégorie</div>
              </div>
            ) : (
              <div className="grid">
                {filtered.map((p: any, i: number) => (
                  <div key={p.id} className="card" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                    onClick={() => setSelectedProduct(p)}>
                    <div className="card-img">
                      {p.photo_url ? <img src={p.photo_url} alt={p.nom} /> : <span>📦</span>}
                      <div className={`stock-pill ${p.stock > 5 ? 'stock-ok' : 'stock-low'}`}>
                        {p.stock > 5 ? '● En stock' : `⚠ ${p.stock} restant${p.stock > 1 ? 's' : ''}`}
                      </div>
                      {p.prix_promo && <div className="promo-pill">PROMO</div>}
                    </div>
                    <div className="card-body">
                      <div className="card-shop">
                        <div className="card-shop-dot" />
                        {p.profiles?.shop_name}
                      </div>
                      <div className="card-name">{p.nom}</div>
                      {p.categorie && <div className="card-cat">{p.categorie}</div>}
                      <div className="card-foot">
                        <div>
                          {p.prix_promo ? (
                            <>
                              <div className="price-promo">{formatCFA(p.prix_promo)}</div>
                              <div className="price-orig">{formatCFA(p.prix_vente)}</div>
                            </>
                          ) : (
                            <div className="price-normal">{formatCFA(p.prix_vente)}</div>
                          )}
                        </div>
                        <a href={`/b/${p.profiles?.shop_slug}`} className="card-btn"
                          onClick={e => e.stopPropagation()}>
                          Voir →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* PANEL PRODUIT */}
      {selectedProduct && (
        <div className="overlay" onClick={() => setSelectedProduct(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-img">
              {selectedProduct.photo_url ? <img src={selectedProduct.photo_url} alt={selectedProduct.nom} /> : <span>📦</span>}
              <button className="panel-close" onClick={() => setSelectedProduct(null)}>✕</button>
              {selectedProduct.prix_promo && (
                <div style={{ position: 'absolute', top: 14, left: 14, background: '#ff4444', color: '#fff', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800 }}>PROMO</div>
              )}
            </div>
            <div className="panel-body">
              <a href={`/b/${selectedProduct.profiles?.shop_slug}`} className="panel-shop-tag">
                🏪 {selectedProduct.profiles?.shop_name} →
              </a>
              <div className="panel-name">{selectedProduct.nom}</div>
              {selectedProduct.description && <div className="panel-desc">{selectedProduct.description}</div>}
              <div style={{ marginBottom: 20 }}>
                {selectedProduct.prix_promo ? (
                  <>
                    <div className="panel-price-promo">{formatCFA(selectedProduct.prix_promo)}</div>
                    <div className="panel-price-orig">{formatCFA(selectedProduct.prix_vente)}</div>
                    <div className="panel-economy">Économie de {formatCFA(selectedProduct.prix_vente - selectedProduct.prix_promo)}</div>
                  </>
                ) : (
                  <div className="panel-price-normal">{formatCFA(selectedProduct.prix_vente)}</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: selectedProduct.stock > 5 ? '#4ade80' : '#f5a623', marginBottom: 20 }}>
                {selectedProduct.stock > 5 ? `● ${selectedProduct.stock} en stock` : `⚠ Plus que ${selectedProduct.stock} disponible${selectedProduct.stock > 1 ? 's' : ''}`}
              </div>
              <a href={`/b/${selectedProduct.profiles?.shop_slug}`} className="btn-voir-boutique">
                🏪 Visiter la boutique & Commander
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Vendify</div>
        <div className="footer-sub">La plateforme des vendeurs africains — Côte d'Ivoire · Sénégal · Bénin · Cameroun · Togo</div>
        <a href="/register" className="footer-cta">🛒 Créer ma boutique gratuitement</a>
      </footer>
    </>
  )
}