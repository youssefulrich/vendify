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

type CartItem = { product: any; quantite: number }

export default function BoutiquePage() {
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    nom: '', phone: '', mode_paiement: 'wave', note: ''
  })

  useEffect(() => {
    const slug = window.location.pathname.split('/').pop()
    async function load() {
      const { data: p } = await supabase.from('profiles')
        .select('id,shop_name,full_name,phone,pays,plan,banner_url')
        .eq('shop_slug', slug).single()
      if (!p) { setNotFound(true); setLoading(false); return }
      const { data: prods } = await supabase.from('products')
        .select('*').eq('user_id', p.id).eq('actif', true).gt('stock', 0)
        .order('created_at', { ascending: false })
      setProfile(p)
      setProducts(prods || [])
      setLoading(false)
      document.title = `${p.shop_name} — Vendify`
    }
    load()
  }, [])

  const waPhone = profile?.phone?.replace(/\D/g, '') || ''

  // Catégories uniques
  const categories = ['Tous', ...Array.from(new Set(products.map((p: any) => p.categorie).filter(Boolean)))]

  const filtered = products.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'Tous' || p.categorie === activeCategory
    return matchSearch && matchCat
  })

  const cartTotal = cart.reduce((s, i) => s + (i.product.prix_promo || i.product.prix_vente) * i.quantite, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantite, 0)

  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id
        ? { ...i, quantite: Math.min(i.quantite + 1, product.stock) } : i)
      return [...prev, { product, quantite: 1 }]
    })
    setSelectedProduct(null)
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.product.id !== id))
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.product.id !== id) return i
      const q = i.quantite + delta
      if (q <= 0) return null
      if (q > i.product.stock) return i
      return { ...i, quantite: q }
    }).filter(Boolean) as CartItem[])
  }

  async function handleOrder() {
    if (!checkoutForm.nom || !checkoutForm.phone) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/boutique/commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: profile.id,
          client_nom: checkoutForm.nom,
          client_phone: checkoutForm.phone,
          canal: 'direct',
          mode_paiement: checkoutForm.mode_paiement,
          note: checkoutForm.note || null,
          items: cart.map(i => ({
            product_id: i.product.id,
            nom: i.product.nom,
            quantite: i.quantite,
            prix_unitaire: i.product.prix_promo || i.product.prix_vente,
            prix_achat: i.product.prix_achat || 0,
          }))
        })
      })
      const data = await res.json()
      if (data.success) {
        setOrderResult(data)
        setCart([])
        setShowCheckout(false)
        setShowCart(false)
      }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 56 }}>🏪</div>
      <div style={{ color: '#fff', fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 800 }}>Boutique introuvable</div>
      <a href="/register" style={{ color: '#f5a623', fontSize: 13, textDecoration: 'none' }}>Créer ma boutique →</a>
    </div>
  )

  const modeLabel: any = { wave: 'Wave', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', cash: 'Cash' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #f0ede8; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(100%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }

        .topbar { position: sticky; top: 0; z-index: 200; background: rgba(10,10,10,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .topbar-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .topbar-icon { width: 30px; height: 30px; background: linear-gradient(135deg, #f5a623, #ffcc6b); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .topbar-name { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #f0ede8; }
        .cart-btn { position: relative; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 8px 16px; color: #f0ede8; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
        .cart-btn:hover { background: rgba(255,255,255,0.1); }
        .cart-badge { background: #f5a623; color: #000; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }

        /* BANNER */
        .banner { position: relative; width: 100%; height: 220px; overflow: hidden; background: linear-gradient(160deg, #111 0%, #0a0a0a 100%); }
        .banner img { width: 100%; height: 100%; object-fit: cover; }
        .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(10,10,10,0.85) 100%); }
        .banner-default { position: absolute; inset: 0; background: linear-gradient(135deg, #111 0%, #1a1205 50%, #0a0a0a 100%); display: flex; align-items: center; justify-content: center; }
        .banner-default::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,166,35,0.08) 0%, transparent 70%); }

        /* HERO */
        .hero { position: relative; padding: 0 20px 32px; text-align: center; margin-top: -60px; z-index: 1; }
        .hero-avatar { width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 14px; background: linear-gradient(135deg, #f5a623, #ff9d00); display: flex; align-items: center; justify-content: center; font-size: 34px; box-shadow: 0 8px 28px rgba(245,166,35,0.3), 0 0 0 4px #0a0a0a; animation: slideUp 0.4s ease; }
        .hero-name { font-family: 'Playfair Display', serif; font-size: clamp(26px, 5vw, 42px); font-weight: 900; color: #f0ede8; letter-spacing: -1px; margin-bottom: 6px; animation: slideUp 0.4s 0.05s ease both; }
        .hero-sub { font-size: 13px; color: #555; margin-bottom: 16px; font-style: italic; animation: slideUp 0.4s 0.1s ease both; }
        .hero-tags { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; animation: slideUp 0.4s 0.15s ease both; }
        .tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; }
        .tag-g { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; }
        .tag-o { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); color: #f5a623; }
        .tag-w { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #666; }

        /* TOOLBAR */
        .toolbar { max-width: 1100px; margin: 0 auto; padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .toolbar-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; }
        .toolbar-sub { font-size: 11px; color: #555; font-style: italic; margin-top: 2px; }
        .search-wrap { position: relative; }
        .search-inp { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 9px 16px 9px 36px; font-size: 13px; color: #f0ede8; outline: none; width: 200px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .search-inp:focus { border-color: rgba(245,166,35,0.4); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555; font-size: 13px; }

        /* CATEGORIES */
        .categories { max-width: 1100px; margin: 0 auto; padding: 16px 20px 0; display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .categories::-webkit-scrollbar { display: none; }
        .cat-btn { padding: 7px 16px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; border: none; flex-shrink: 0; }
        .cat-btn.active { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; box-shadow: 0 4px 14px rgba(245,166,35,0.25); }
        .cat-btn.inactive { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #717a8f; }
        .cat-btn.inactive:hover { background: rgba(255,255,255,0.08); color: #c8cdd8; }

        /* GRID */
        .grid-wrap { max-width: 1100px; margin: 0 auto; padding: 16px 20px 80px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

        /* CARD */
        .card { background: #111; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.25s; animation: slideUp 0.4s ease both; }
        .card:hover { border-color: rgba(245,166,35,0.25); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
        .card-img { aspect-ratio: 1; background: #1a1a1a; display: flex; align-items: center; justify-content: center; font-size: 48px; overflow: hidden; position: relative; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .card:hover .card-img img { transform: scale(1.05); }
        .stock-pill { position: absolute; top: 8px; left: 8px; padding: 3px 10px; border-radius: 100px; font-size: 10px; font-weight: 700; backdrop-filter: blur(8px); }
        .stock-ok  { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
        .stock-low { background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.3); color: #f5a623; }
        .promo-pill { position: absolute; top: 8px; right: 8px; background: #ff4444; color: #fff; padding: 3px 8px; border-radius: 100px; font-size: 10px; font-weight: 800; }
        .card-body { padding: 14px; }
        .card-cat { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px; }
        .card-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #f0ede8; line-height: 1.3; }
        .card-desc { font-size: 11px; color: #555; margin-bottom: 10px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-style: italic; }
        .card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .card-prices { display: flex; flex-direction: column; }
        .card-price-promo { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #ff4444; }
        .card-price-original { font-size: 11px; color: #555; text-decoration: line-through; }
        .card-price-normal { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #f5a623; }
        .add-btn { display: flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 100px; padding: 7px 14px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
        .add-btn:hover { transform: scale(1.04); box-shadow: 0 4px 14px rgba(245,166,35,0.3); }

        /* PANEL */
        .overlay { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }
        .panel { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px 24px 0 0; width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s ease; }
        .panel-img { aspect-ratio: 4/3; background: #1a1a1a; display: flex; align-items: center; justify-content: center; font-size: 64px; border-radius: 24px 24px 0 0; overflow: hidden; position: relative; }
        .panel-img img { width: 100%; height: 100%; object-fit: cover; }
        .panel-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; color: #fff; backdrop-filter: blur(8px); }
        .panel-body { padding: 24px; }
        .panel-cat  { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
        .panel-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .panel-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 16px; font-style: italic; }
        .panel-prices { margin-bottom: 20px; }
        .panel-price-promo { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #ff4444; }
        .panel-price-original { font-size: 14px; color: #555; text-decoration: line-through; margin-top: 2px; }
        .panel-price-normal { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #f5a623; }
        .panel-economy { display: inline-block; background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.2); color: #ff4444; border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: 700; margin-top: 6px; }
        .btn-add-cart { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 14px; padding: 14px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; width: 100%; margin-bottom: 10px; }
        .btn-wa { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2); color: #25d366; border-radius: 14px; padding: 12px; font-size: 14px; font-weight: 600; text-decoration: none; width: 100%; }

        /* CART */
        .cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 400; width: 100%; max-width: 400px; background: #111; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; animation: slideRight 0.3s ease; }
        .cart-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .cart-title  { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .cart-body   { flex: 1; overflow-y: auto; padding: 16px; }
        .cart-item   { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cart-item-img { width: 52px; height: 52px; border-radius: 10px; background: #1a1a1a; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; overflow: hidden; }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .qty-ctrl { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .qty-btn { width: 24px; height: 24px; background: rgba(255,255,255,0.08); border: none; border-radius: 6px; color: #f0ede8; font-size: 14px; cursor: pointer; }
        .qty-val { font-size: 13px; font-weight: 700; min-width: 20px; text-align: center; }
        .cart-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.06); }
        .cart-total  { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 15px; font-weight: 700; }
        .cart-total-amt { font-family: 'Playfair Display', serif; color: #f5a623; font-size: 20px; }
        .btn-checkout { width: 100%; padding: 14px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; }

        /* CHECKOUT */
        .checkout-modal { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }
        .checkout-box { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px 24px 0 0; width: 100%; max-width: 540px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s ease; padding: 28px; }
        .inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; color: #f0ede8; font-size: 14px; outline: none; transition: border 0.15s; font-family: inherit; }
        .inp:focus { border-color: rgba(245,166,35,0.4); }
        .lbl { font-size: 11px; font-weight: 700; color: #555; margin-bottom: 6px; display: block; letter-spacing: 0.8px; text-transform: uppercase; }
        .pay-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 2px; }
        .pay-opt { padding: 12px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.08); cursor: pointer; text-align: center; transition: all 0.15s; }
        .pay-opt.active { border-color: #f5a623; background: rgba(245,166,35,0.08); }
        .pay-opt-icon { font-size: 24px; margin-bottom: 4px; }
        .pay-opt-name { font-size: 12px; font-weight: 700; }

        /* SUCCESS */
        .success-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
        .success-box { background: #111; border: 1px solid rgba(34,197,94,0.2); border-radius: 24px; padding: 36px 28px; text-align: center; max-width: 380px; width: 100%; animation: slideUp 0.4s ease; }

        .footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 24px; text-align: center; font-size: 11px; color: #333; }
        .footer a { color: #f5a623; text-decoration: none; font-weight: 600; }

        @media (max-width: 640px) {
          .banner { height: 160px; }
          .grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .grid-wrap { padding: 12px 16px 60px; }
          .toolbar { padding: 16px 16px 0; }
          .categories { padding: 12px 16px 0; }
          .search-inp { width: 150px; }
          .hero { margin-top: -50px; padding: 0 16px 24px; }
          .hero-avatar { width: 68px; height: 68px; font-size: 28px; }
        }
        @media (max-width: 380px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <a href="/" className="topbar-brand">
          <div className="topbar-icon">🛒</div>
          <span className="topbar-name">Vendify</span>
        </a>
        <button className="cart-btn" onClick={() => setShowCart(true)}>
          🛍 Panier
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>

      {/* BANNIÈRE */}
      <div className="banner">
        {profile.banner_url
          ? <><img src={profile.banner_url} alt="bannière" /><div className="banner-overlay" /></>
          : <div className="banner-default" />
        }
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-avatar">🏪</div>
        <h1 className="hero-name">{profile.shop_name}</h1>
        <p className="hero-sub">par {profile.full_name || profile.shop_name}</p>
        <div className="hero-tags">
          <span className="tag tag-g">● En ligne</span>
          <span className="tag tag-o">📦 {products.length} produit{products.length > 1 ? 's' : ''}</span>
          {profile.pays && <span className="tag tag-w">📍 {profile.pays}</span>}
          {profile.plan === 'premium' && <span className="tag tag-o">⚡ Premium</span>}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div>
          <div className="toolbar-title">Catalogue</div>
          <div className="toolbar-sub">{filtered.length} article{filtered.length > 1 ? 's' : ''}</div>
        </div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-inp" type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* CATÉGORIES */}
      {categories.length > 1 && (
        <div className="categories">
          {categories.map(cat => (
            <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : 'inactive'}`}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* GRID */}
      <div className="grid-wrap">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#444' }}>
            <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.3 }}>📦</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, color: '#555' }}>
              {search ? 'Aucun résultat' : 'Aucun produit disponible'}
            </div>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((p: any, i: number) => (
              <div key={p.id} className="card" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setSelectedProduct(p)}>
                <div className="card-img">
                  {p.photo_url ? <img src={p.photo_url} alt={p.nom} /> : <span>📦</span>}
                  <div className={`stock-pill ${p.stock > 5 ? 'stock-ok' : 'stock-low'}`}>
                    {p.stock > 5 ? '● En stock' : `⚠ ${p.stock} restant${p.stock > 1 ? 's' : ''}`}
                  </div>
                  {p.prix_promo && <div className="promo-pill">PROMO</div>}
                </div>
                <div className="card-body">
                  {p.categorie && <div className="card-cat">{p.categorie}</div>}
                  <div className="card-name">{p.nom}</div>
                  {p.description && <div className="card-desc">{p.description}</div>}
                  <div className="card-foot">
                    <div className="card-prices">
                      {p.prix_promo ? (
                        <>
                          <span className="card-price-promo">{formatCFA(p.prix_promo)}</span>
                          <span className="card-price-original">{formatCFA(p.prix_vente)}</span>
                        </>
                      ) : (
                        <span className="card-price-normal">{formatCFA(p.prix_vente)}</span>
                      )}
                    </div>
                    <button className="add-btn" onClick={e => { e.stopPropagation(); addToCart(p) }}>
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL PRODUIT */}
      {selectedProduct && (
        <div className="overlay" onClick={() => setSelectedProduct(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-img" style={{ position: 'relative' }}>
              {selectedProduct.photo_url ? <img src={selectedProduct.photo_url} alt={selectedProduct.nom} /> : <span>📦</span>}
              <button className="panel-close" onClick={() => setSelectedProduct(null)}>✕</button>
              {selectedProduct.prix_promo && <div style={{ position: 'absolute', top: 14, left: 14, background: '#ff4444', color: '#fff', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800 }}>PROMO</div>}
            </div>
            <div className="panel-body">
              {selectedProduct.categorie && <div className="panel-cat">{selectedProduct.categorie}</div>}
              <div className="panel-name">{selectedProduct.nom}</div>
              {selectedProduct.description && <div className="panel-desc">{selectedProduct.description}</div>}
              <div className="panel-prices">
                {selectedProduct.prix_promo ? (
                  <>
                    <div className="panel-price-promo">{formatCFA(selectedProduct.prix_promo)}</div>
                    <div className="panel-price-original">{formatCFA(selectedProduct.prix_vente)}</div>
                    <div className="panel-economy">
                      Vous économisez {formatCFA(selectedProduct.prix_vente - selectedProduct.prix_promo)}
                    </div>
                  </>
                ) : (
                  <div className="panel-price-normal">{formatCFA(selectedProduct.prix_vente)}</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: selectedProduct.stock > 5 ? '#4ade80' : '#f5a623', marginBottom: 20 }}>
                {selectedProduct.stock > 5 ? `● ${selectedProduct.stock} en stock` : `⚠ Plus que ${selectedProduct.stock} disponible${selectedProduct.stock > 1 ? 's' : ''}`}
              </div>
              <button className="btn-add-cart" onClick={() => addToCart(selectedProduct)}>
                🛍 Ajouter au panier
              </button>
              {waPhone && (
                <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour ! Je veux commander : *${selectedProduct.nom}* (${formatCFA(selectedProduct.prix_promo || selectedProduct.prix_vente)}) 🛒`)}`}
                  className="btn-wa" target="_blank" rel="noopener noreferrer">
                  💬 Commander via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCart(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <span className="cart-title">🛍 Mon panier</span>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#717a8f', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="cart-body">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛍</div>
                  <div style={{ fontSize: 14, color: '#555' }}>Votre panier est vide</div>
                </div>
              ) : cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.product.photo_url ? <img src={item.product.photo_url} alt={item.product.nom} /> : '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.product.nom}</div>
                    <div style={{ fontSize: 12, color: item.product.prix_promo ? '#ff4444' : '#f5a623', fontWeight: 700 }}>
                      {formatCFA((item.product.prix_promo || item.product.prix_vente) * item.quantite)}
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)}>−</button>
                      <span className="qty-val">{item.quantite}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)}>+</button>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ff5e5e', fontSize: 12, cursor: 'pointer', marginLeft: 8 }}>Retirer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-amt">{formatCFA(cartTotal)}</span>
                </div>
                <button className="btn-checkout" onClick={() => { setShowCart(false); setShowCheckout(true) }}>
                  Passer la commande →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CHECKOUT */}
      {showCheckout && (
        <div className="checkout-modal" onClick={() => setShowCheckout(false)}>
          <div className="checkout-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700 }}>Finaliser la commande</h2>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#c8cdd8' }}>
                  <span>{item.product.nom} × {item.quantite}</span>
                  <span style={{ color: item.product.prix_promo ? '#ff4444' : '#f5a623', fontWeight: 700 }}>{formatCFA((item.product.prix_promo || item.product.prix_vente) * item.quantite)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: '#f5a623', fontFamily: 'Playfair Display,serif', fontSize: 18 }}>{formatCFA(cartTotal)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="lbl">Votre nom *</label>
                <input className="inp" value={checkoutForm.nom} onChange={e => setCheckoutForm({ ...checkoutForm, nom: e.target.value })} placeholder="Ex: Aminata Koné" />
              </div>
              <div>
                <label className="lbl">Numéro WhatsApp *</label>
                <input className="inp" value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="Ex: 0700000000" />
              </div>
              <div>
                <label className="lbl">Mode de paiement</label>
                <div className="pay-options">
                  {[{ id: 'wave', icon: '🌊', name: 'Wave' }, { id: 'orange_money', icon: '🟠', name: 'Orange Money' }, { id: 'mtn_momo', icon: '💛', name: 'MTN MoMo' }, { id: 'cash', icon: '💵', name: 'Cash' }].map(opt => (
                    <div key={opt.id} className={`pay-opt ${checkoutForm.mode_paiement === opt.id ? 'active' : ''}`}
                      onClick={() => setCheckoutForm({ ...checkoutForm, mode_paiement: opt.id })}>
                      <div className="pay-opt-icon">{opt.icon}</div>
                      <div className="pay-opt-name">{opt.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="lbl">Note / Adresse (optionnel)</label>
                <textarea className="inp" value={checkoutForm.note} onChange={e => setCheckoutForm({ ...checkoutForm, note: e.target.value })} placeholder="Adresse de livraison, remarques..." rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <button onClick={handleOrder} disabled={submitting || !checkoutForm.nom || !checkoutForm.phone}
              style={{ width: '100%', marginTop: 24, padding: 16, background: checkoutForm.nom && checkoutForm.phone ? 'linear-gradient(135deg, #f5a623, #ffcc6b)' : 'rgba(255,255,255,0.05)', color: checkoutForm.nom && checkoutForm.phone ? '#000' : '#555', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
              {submitting ? '⏳ Envoi en cours...' : `✓ Commander — ${formatCFA(cartTotal)}`}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {orderResult && (
        <div className="success-overlay">
          <div className="success-box">
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Commande envoyée !</h2>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
              Votre commande a bien été reçue par <strong style={{ color: '#f0ede8' }}>{profile.shop_name}</strong>. Cliquez ci-dessous pour notifier le vendeur.
            </p>
            {orderResult.vendor_phone && (() => {
              const vPhone = orderResult.vendor_phone.replace(/\D/g, '')
              const msg = `🛍 *Nouvelle commande !*\n\n👤 Client : ${orderResult.client_nom}\n📦 Produits : ${orderResult.items_desc}\n💰 Total : ${formatCFA(orderResult.total)}\n💳 Paiement : ${modeLabel[orderResult.mode_paiement] || orderResult.mode_paiement}\n\nVia Vendify 🏪`
              return (
                <a href={`https://wa.me/${vPhone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25d366', color: '#fff', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 10, width: '100%' }}>
                  <span style={{ fontSize: 18 }}>💬</span> Notifier le vendeur sur WhatsApp
                </a>
              )
            })()}
            <button onClick={() => setOrderResult(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0ede8', borderRadius: 12, padding: 12, fontSize: 13, cursor: 'pointer', width: '100%' }}>
              Continuer mes achats
            </button>
          </div>
        </div>
      )}

      <div className="footer">
        Boutique propulsée par <a href="/">Vendify.ci</a> — La plateforme des vendeurs africains
      </div>
    </>
  )
}