'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function fCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function normalizePhone(raw: string): string {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  if (p.length >= 11 && (p.startsWith('225') || p.startsWith('221') || p.startsWith('229') || p.startsWith('237') || p.startsWith('228'))) return p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  if (p.length === 10) return '225' + p
  if (p.length === 8) return '225' + p
  return p
}

type CartItem = { product: any; quantite: number }

const PAYS_FLAGS: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', BJ: '🇧🇯', CM: '🇨🇲', TG: '🇹🇬' }

export default function BoutiquePage() {
  const [profile, setProfile]           = useState<any>(null)
  const [products, setProducts]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [search, setSearch]             = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [cart, setCart]                 = useState<CartItem[]>([])
  const [showCart, setShowCart]         = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderResult, setOrderResult]   = useState<any>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [heroVisible, setHeroVisible]   = useState(true)
  const [form, setForm]                 = useState({ nom: '', phone: '', mode_paiement: 'wave', note: '' })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const slug = window.location.pathname.split('/').filter(Boolean).pop()
    async function load() {
      const { data: p } = await supabase.from('profiles')
        .select('id,shop_name,full_name,phone,pays,plan,banner_url,shop_slug')
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
    const onScroll = () => {
      setScrolled(window.scrollY > 80)
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setHeroVisible(rect.bottom > 0)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const categories = ['Tous', ...Array.from(new Set(products.map((p: any) => p.categorie).filter(Boolean)))]
  const filtered = products.filter(p => {
    const matchS = p.nom.toLowerCase().includes(search.toLowerCase())
    const matchC = activeCategory === 'Tous' || p.categorie === activeCategory
    return matchS && matchC
  })
  const promoItems = filtered.filter(p => p.prix_promo)
  const cartTotal = cart.reduce((s, i) => s + (i.product.prix_promo || i.product.prix_vente) * i.quantite, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantite, 0)
  const waPhone = normalizePhone(profile?.phone || '')

  function addToCart(product: any) {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantite: Math.min(i.quantite + 1, product.stock) } : i)
      return [...prev, { product, quantite: 1 }]
    })
    setSelectedProduct(null)
  }
  function removeFromCart(id: string) { setCart(prev => prev.filter(i => i.product.id !== id)) }
  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.product.id !== id) return i
      const q = i.quantite + delta
      if (q <= 0) return null as any
      if (q > i.product.stock) return i
      return { ...i, quantite: q }
    }).filter(Boolean))
  }

  async function handleOrder() {
    if (!form.nom || !form.phone) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/boutique/commande', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: profile.id, client_nom: form.nom, client_phone: form.phone,
          canal: 'direct', mode_paiement: form.mode_paiement, note: form.note || null,
          items: cart.map(i => ({ product_id: i.product.id, nom: i.product.nom, quantite: i.quantite, prix_unitaire: i.product.prix_promo || i.product.prix_vente, prix_achat: i.product.prix_achat || 0 }))
        })
      })
      const data = await res.json()
      if (data.success) { setOrderResult(data); setCart([]); setShowCheckout(false); setShowCart(false) }
    } catch(e) { console.error(e) }
    setSubmitting(false)
  }

  // ── LOADING ──
  if (loading) return (
    <div style={{ background: '#070809', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(245,166,35,.15)', borderTop: '3px solid #f5a623', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
        <div style={{ fontSize: 12, color: '#303540', fontFamily: 'sans-serif', animation: 'pulse2 1.5s infinite' }}>Chargement de la boutique…</div>
      </div>
    </div>
  )

  // ── NOT FOUND ──
  if (notFound) return (
    <div style={{ background: '#070809', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 64 }}>🏪</div>
      <div style={{ color: '#edeae4', fontSize: 22, fontWeight: 800 }}>Boutique introuvable</div>
      <div style={{ color: '#404550', fontSize: 13 }}>Ce lien ne correspond à aucune boutique active.</div>
      <a href="/boutiques" style={{ color: '#f5a623', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>← Voir toutes les boutiques</a>
    </div>
  )

  const modeLabel: any = { wave: 'Wave', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', cash: 'Cash' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0a0b0d} ::-webkit-scrollbar-thumb{background:#1e2330;border-radius:4px}

        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR   {from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideUp  {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin     {to{transform:rotate(360deg)}}
        @keyframes shimmer  {0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse    {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.9)}}
        @keyframes breathe  {0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,.4)}50%{box-shadow:0 0 0 8px rgba(245,166,35,0)}}

        /* ── TOPBAR ── */
        .tb{position:sticky;top:0;z-index:300;height:62px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;transition:all .35s}
        .tb.scrolled{background:rgba(7,8,9,.96);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06)}
        .tb-brand{display:flex;align-items:center;gap:9px;text-decoration:none}
        .tb-icon{width:32px;height:32px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 3px 12px rgba(245,166,35,.35)}
        .tb-name{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:800;color:#edeae4}
        .tb-right{display:flex;align-items:center;gap:10px}
        .tb-share{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:100px;padding:7px 14px;font-size:12px;font-weight:600;color:#717a8f;cursor:pointer;transition:all .15s}
        .tb-share:hover{background:rgba(255,255,255,.09);color:#edeae4}
        .tb-cart{position:relative;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border:none;border-radius:100px;padding:9px 18px;font-size:13px;font-weight:700;color:#000;cursor:pointer;transition:all .2s}
        .tb-cart:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(245,166,35,.35)}
        .tb-cart-badge{background:#000;color:#f5a623;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0}

        /* ── HERO BANNER ── */
        .hero-wrap{position:relative;min-height:480px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
        .hero-banner{position:absolute;inset:0;z-index:0}
        .hero-banner img{width:100%;height:100%;object-fit:cover}
        .hero-banner-default{position:absolute;inset:0;background:linear-gradient(160deg,#0d1117 0%,#131b12 40%,#0a0d08 100%)}
        .hero-banner-pattern{position:absolute;inset:0;opacity:.06;background-image:repeating-linear-gradient(45deg,#f5a623 0px,#f5a623 1px,transparent 0px,transparent 50%);background-size:20px 20px}
        .hero-glow{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 100%,rgba(245,166,35,.12) 0%,transparent 70%)}
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(7,8,9,1) 0%,rgba(7,8,9,.7) 40%,rgba(7,8,9,.15) 100%);z-index:1}
        .hero-content{position:relative;z-index:2;padding:48px 28px 36px}
        .hero-live{display:inline-flex;align-items:center;gap:7px;background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.2);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;color:#2ecc87;margin-bottom:18px}
        .hero-live-dot{width:6px;height:6px;border-radius:50%;background:#2ecc87;animation:pulse 1.8s infinite}
        .hero-shop-name{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(34px,7vw,72px);font-weight:800;line-height:1.02;letter-spacing:-2px;margin-bottom:10px}
        .hero-shop-name em{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;background:linear-gradient(135deg,#f5a623,#ffdd80);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .hero-sub{font-size:14px;color:#5a6070;margin-bottom:22px;font-style:italic}
        .hero-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .hero-tag{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:100px;font-size:11px;font-weight:700}
        .hero-tag-g{background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.18);color:#2ecc87}
        .hero-tag-o{background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.18);color:#f5a623}
        .hero-tag-w{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#5a6070}
        .hero-tag-p{background:linear-gradient(135deg,rgba(245,166,35,.1),rgba(255,204,107,.05));border:1px solid rgba(245,166,35,.2);color:#f5a623}
        .hero-scroll-hint{position:absolute;bottom:16px;right:20px;z-index:2;font-size:10px;color:#303540;display:flex;align-items:center;gap:5px}

        /* ── PROMO STRIP ── */
        .promo-strip{background:linear-gradient(135deg,rgba(255,80,80,.08),rgba(255,130,50,.05));border-top:1px solid rgba(255,80,80,.12);border-bottom:1px solid rgba(255,80,80,.08);padding:12px 24px;display:flex;align-items:center;gap:16px}
        .promo-strip-fire{font-size:20px;flex-shrink:0}
        .promo-strip-text{font-size:13px;font-weight:700;color:#ff8080}
        .promo-strip-items{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;flex:1}
        .promo-strip-items::-webkit-scrollbar{display:none}
        .promo-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.15);border-radius:100px;padding:4px 12px;font-size:11px;color:#ff9090;font-weight:600;white-space:nowrap;cursor:pointer;flex-shrink:0;transition:all .15s}
        .promo-chip:hover{background:rgba(255,80,80,.14)}
        .promo-chip-pct{background:#ff4444;color:#fff;border-radius:100px;padding:1px 6px;font-size:9px;font-weight:800}

        /* ── STICKY TOOLBAR ── */
        .shop-toolbar{position:sticky;top:62px;z-index:200;background:rgba(7,8,9,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.05)}
        .shop-toolbar-inner{max-width:1200px;margin:0 auto;padding:0 24px}
        .shop-cats{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid rgba(255,255,255,.04)}
        .shop-cats::-webkit-scrollbar{display:none}
        .shop-cat{padding:13px 20px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;color:#404550;white-space:nowrap;border-bottom:2px solid transparent;transition:all .2s;flex-shrink:0}
        .shop-cat:hover{color:#a0a8b8}
        .shop-cat.active{color:#f5a623;border-bottom-color:#f5a623}
        .shop-toolbar-bottom{display:flex;align-items:center;justify-content:space-between;padding:10px 0;gap:12px}
        .shop-search{position:relative;flex:1;max-width:340px}
        .shop-search input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 14px 9px 36px;font-size:13px;color:#edeae4;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s}
        .shop-search input:focus{border-color:rgba(245,166,35,.3)}
        .shop-search input::placeholder{color:#252830}
        .shop-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#303540;font-size:13px}
        .shop-count{font-size:12px;color:#252830}
        .shop-count strong{color:#404550}

        /* ── MAIN ── */
        .shop-main{max-width:1200px;margin:0 auto;padding:24px 24px 100px}

        /* ── PRODUCT GRID ── */
        .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}

        /* ── PRODUCT CARD ── */
        .prod-card{background:#0d0f11;border:1px solid rgba(255,255,255,.06);border-radius:20px;overflow:hidden;cursor:pointer;transition:all .3s;animation:fadeUp .4s ease both;position:relative}
        .prod-card:hover{border-color:rgba(245,166,35,.22);transform:translateY(-5px);box-shadow:0 24px 64px rgba(0,0,0,.7)}
        .prod-card-img{aspect-ratio:1;background:#111418;display:flex;align-items:center;justify-content:center;font-size:56px;overflow:hidden;position:relative}
        .prod-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .prod-card:hover .prod-card-img img{transform:scale(1.08)}
        .prod-card-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,15,17,.6) 0%,transparent 50%);opacity:0;transition:opacity .3s}
        .prod-card:hover .prod-card-img-overlay{opacity:1}
        .prod-card-quick{position:absolute;bottom:12px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(245,166,35,.95);color:#000;border:none;border-radius:100px;padding:7px 18px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;opacity:0;transition:all .25s;z-index:2}
        .prod-card:hover .prod-card-quick{opacity:1;transform:translateX(-50%) translateY(0)}
        .prod-badge-promo{position:absolute;top:12px;right:12px;background:linear-gradient(135deg,#ff4444,#ff7043);color:#fff;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:800;z-index:1;box-shadow:0 2px 8px rgba(255,68,68,.3)}
        .prod-badge-stock{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;backdrop-filter:blur(8px);z-index:1}
        .prod-badge-ok{background:rgba(46,204,135,.1);border:1px solid rgba(46,204,135,.25);color:#2ecc87}
        .prod-badge-low{background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.25);color:#f5a623}
        .prod-card-body{padding:14px 16px 16px}
        .prod-card-cat{font-size:9px;font-weight:700;color:#252830;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
        .prod-card-name{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:#edeae4;margin-bottom:4px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .prod-card-desc{font-size:11px;color:#303540;margin-bottom:10px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-style:italic}
        .prod-card-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
        .prod-price-promo{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:800;color:#ff7070}
        .prod-price-orig{font-size:10px;color:#252830;text-decoration:line-through}
        .prod-price-normal{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:800;color:#f5a623}
        .prod-add{display:flex;align-items:center;gap:5px;background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.2);color:#f5a623;border-radius:100px;padding:7px 14px;font-size:11px;font-weight:700;border:none;cursor:pointer;transition:all .2s;flex-shrink:0}
        .prod-add:hover{background:rgba(245,166,35,.2);transform:scale(1.04);box-shadow:0 4px 16px rgba(245,166,35,.2)}

        /* ── PRODUCT PANEL ── */
        .p-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.9);backdrop-filter:blur(20px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .p-panel{background:#0d0f11;border:1px solid rgba(255,255,255,.09);border-radius:28px 28px 0 0;width:100%;max-width:580px;max-height:93vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
        .p-panel-img{aspect-ratio:4/3;background:#111418;display:flex;align-items:center;justify-content:center;font-size:72px;position:relative;overflow:hidden;flex-shrink:0}
        .p-panel-img img{width:100%;height:100%;object-fit:cover}
        .p-panel-img-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,15,17,1) 0%,transparent 55%)}
        .p-close{position:absolute;top:16px;right:16px;width:36px;height:36px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#edeae4;font-size:14px;backdrop-filter:blur(8px);z-index:2;transition:all .15s}
        .p-close:hover{background:rgba(255,255,255,.12)}
        .p-body{padding:24px 24px 32px}
        .p-cat{font-size:10px;font-weight:700;color:#303540;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
        .p-name{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;line-height:1.1;margin-bottom:8px}
        .p-desc{font-size:13px;color:#5a6070;line-height:1.65;margin-bottom:18px;font-style:italic}
        .p-price-promo{font-family:'Bricolage Grotesque',sans-serif;font-size:40px;font-weight:800;color:#ff7070;line-height:1}
        .p-price-norm{font-family:'Bricolage Grotesque',sans-serif;font-size:40px;font-weight:800;color:#f5a623;line-height:1}
        .p-price-orig{font-size:14px;color:#303540;text-decoration:line-through;margin-top:4px}
        .p-economy{display:inline-flex;align-items:center;gap:5px;background:rgba(255,112,112,.08);border:1px solid rgba(255,112,112,.18);color:#ff9090;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;margin-top:8px}
        .p-stock{display:flex;align-items:center;gap:7px;font-size:12px;margin:18px 0}
        .p-btn-add{display:flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px;transition:all .2s;box-shadow:0 6px 24px rgba(245,166,35,.25);animation:breathe 3s infinite}
        .p-btn-add:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(245,166,35,.35)}
        .p-btn-wa{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.18);color:#25d366;border-radius:14px;padding:13px;font-size:14px;font-weight:600;text-decoration:none;width:100%;transition:all .15s}
        .p-btn-wa:hover{background:rgba(37,211,102,.13)}

        /* ── CART DRAWER ── */
        .cart-over{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);animation:fadeIn .2s}
        .cart-drawer{position:fixed;top:0;right:0;bottom:0;z-index:501;width:100%;max-width:420px;background:#0a0b0d;border-left:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;animation:slideR .3s ease;box-shadow:-24px 0 80px rgba(0,0,0,.6)}
        .cart-hd{padding:22px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
        .cart-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800}
        .cart-close{width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#717a8f;transition:all .15s}
        .cart-close:hover{background:rgba(255,255,255,.09);color:#edeae4}
        .cart-body{flex:1;overflow-y:auto;padding:16px 20px}
        .cart-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .cart-img{width:60px;height:60px;border-radius:12px;background:#111418;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:24px;border:1px solid rgba(255,255,255,.05)}
        .cart-img img{width:100%;height:100%;object-fit:cover}
        .cart-item-name{font-size:13px;font-weight:600;margin-bottom:3px;line-height:1.3}
        .cart-item-price{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:800;color:#f5a623;margin-bottom:8px}
        .qty-row{display:flex;align-items:center;gap:8px}
        .qty-btn{width:26px;height:26px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:7px;color:#edeae4;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .qty-btn:hover{background:rgba(255,255,255,.12)}
        .qty-val{font-size:13px;font-weight:700;min-width:22px;text-align:center}
        .qty-del{background:none;border:none;color:#ff5e5e;font-size:11px;font-weight:600;cursor:pointer;margin-left:6px;padding:0}
        .cart-empty{text-align:center;padding:60px 20px}
        .cart-ft{padding:20px;border-top:1px solid rgba(255,255,255,.06)}
        .cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .cart-total-lbl{font-size:13px;color:#5a6070}
        .cart-total-val{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;color:#f5a623}
        .cart-total-items{font-size:11px;color:#303540;margin-bottom:16px}
        .btn-cmd{width:100%;padding:15px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(245,166,35,.25)}
        .btn-cmd:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(245,166,35,.35)}

        /* ── CHECKOUT ── */
        .co-over{position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.92);backdrop-filter:blur(16px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .co-box{background:#0a0b0d;border:1px solid rgba(255,255,255,.08);border-radius:28px 28px 0 0;width:100%;max-width:560px;max-height:93vh;overflow-y:auto;animation:slideUp .3s ease;padding:28px 24px 36px}
        .co-title{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;margin-bottom:6px}
        .co-sub{font-size:13px;color:#404550;margin-bottom:24px}
        .co-summary{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;margin-bottom:24px}
        .co-sum-item{display:flex;justify-content:space-between;font-size:12px;color:#5a6070;margin-bottom:6px}
        .co-sum-total{display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid rgba(255,255,255,.06);font-weight:700}
        .co-sum-total-val{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;color:#f5a623}
        .co-lbl{font-size:11px;font-weight:700;color:#303540;text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px;display:block}
        .co-inp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 15px;color:#edeae4;font-size:14px;outline:none;transition:border-color .2s;font-family:'DM Sans',sans-serif}
        .co-inp:focus{border-color:rgba(245,166,35,.35)}
        .co-inp::placeholder{color:#252830}
        .pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pay-opt{padding:14px 10px;border-radius:12px;border:1.5px solid rgba(255,255,255,.07);cursor:pointer;text-align:center;transition:all .2s;background:rgba(255,255,255,.02)}
        .pay-opt:hover{border-color:rgba(245,166,35,.2)}
        .pay-opt.active{border-color:#f5a623;background:rgba(245,166,35,.07)}
        .pay-opt-icon{font-size:26px;margin-bottom:5px}
        .pay-opt-name{font-size:12px;font-weight:700}
        .co-submit{width:100%;margin-top:24px;padding:16px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(245,166,35,.2)}
        .co-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 32px rgba(245,166,35,.3)}
        .co-submit:disabled{background:rgba(255,255,255,.05);color:#303540;cursor:not-allowed;box-shadow:none}

        /* ── SUCCESS ── */
        .success-over{position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .3s}
        .success-box{background:#0a0b0d;border:1px solid rgba(46,204,135,.2);border-radius:24px;padding:40px 28px;text-align:center;max-width:380px;width:100%;animation:fadeUp .4s ease}
        .success-icon{width:72px;height:72px;background:rgba(46,204,135,.1);border:1px solid rgba(46,204,135,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 20px}
        .success-title{font-family:'Bricolage Grotesque',sans-serif;font-size:24px;font-weight:800;margin-bottom:10px}
        .success-sub{font-size:13px;color:#5a6070;line-height:1.7;margin-bottom:28px}
        .success-wa{display:flex;align-items:center;justify-content:center;gap:8px;background:#25d366;color:#fff;border-radius:14px;padding:15px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:10px;transition:all .2s;box-shadow:0 6px 20px rgba(37,211,102,.25)}
        .success-wa:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(37,211,102,.3)}
        .success-continue{width:100%;padding:13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#717a8f;border-radius:14px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
        .success-continue:hover{background:rgba(255,255,255,.07);color:#edeae4}

        /* ── FOOTER ── */
        .shop-footer{border-top:1px solid rgba(255,255,255,.05);padding:24px;text-align:center;font-size:11px;color:#252830}
        .shop-footer a{color:#f5a623;text-decoration:none;font-weight:600}
        .shop-footer a:hover{color:#ffcc6b}

        /* ── RESPONSIVE ── */
        @media(max-width:767px){
          .hero-wrap{min-height:380px}
          .hero-content{padding:36px 20px 28px}
          .hero-shop-name{font-size:clamp(28px,8vw,48px);letter-spacing:-1.5px}
          .prod-grid{grid-template-columns:1fr 1fr;gap:12px}
          .shop-main{padding:16px 16px 80px}
          .shop-toolbar-inner{padding:0 16px}
          .promo-strip{padding:10px 16px}
        }
        @media(max-width:400px){
          .prod-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className={`tb${scrolled?' scrolled':''}`}>
        <a href="/dashboard" className="tb-brand">
          <div className="tb-icon">🛒</div>
          <span className="tb-name">Vendify</span>
        </a>
        <div className="tb-right">
          <button className="tb-share" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>
            🔗 Partager
          </button>
          <button className="tb-cart" onClick={() => setShowCart(true)}>
            🛍 Panier
            {cartCount > 0 && <span className="tb-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="hero-wrap" ref={heroRef}>
        <div className="hero-banner">
          {profile.banner_url
            ? <img src={profile.banner_url} alt="bannière"/>
            : <><div className="hero-banner-default"/><div className="hero-banner-pattern"/></>
          }
          <div className="hero-glow"/>
          <div className="hero-overlay"/>
        </div>
        <div className="hero-content">
          <div className="hero-live" style={{animation:'fadeUp .5s ease both'}}>
            <div className="hero-live-dot"/>
            Boutique en ligne
          </div>
          <h1 className="hero-shop-name" style={{animation:'fadeUp .5s .08s ease both'}}>
            {(() => {
              const words = profile.shop_name.split(' ')
              if (words.length === 1) return <em>{profile.shop_name}</em>
              return <>{words.slice(0,-1).join(' ')} <em>{words[words.length-1]}</em></>
            })()}
          </h1>
          {profile.full_name && (
            <div className="hero-sub" style={{animation:'fadeUp .5s .15s ease both'}}>
              par {profile.full_name}
            </div>
          )}
          <div className="hero-meta" style={{animation:'fadeUp .5s .2s ease both'}}>
            <span className="hero-tag hero-tag-g">● En ligne</span>
            <span className="hero-tag hero-tag-o">📦 {products.length} produit{products.length>1?'s':''}</span>
            {profile.pays && <span className="hero-tag hero-tag-w">{PAYS_FLAGS[profile.pays]||'📍'} {profile.pays}</span>}
            {profile.plan==='premium' && <span className="hero-tag hero-tag-p">⚡ Boutique Premium</span>}
            {promoItems.length > 0 && <span className="hero-tag" style={{background:'rgba(255,80,80,.08)',border:'1px solid rgba(255,80,80,.18)',color:'#ff9090'}}>🔥 {promoItems.length} promo{promoItems.length>1?'s':''}</span>}
          </div>
        </div>
        <div className="hero-scroll-hint">
          Faites défiler pour voir les produits ↓
        </div>
      </div>

      {/* ── PROMO STRIP ── */}
      {promoItems.length > 0 && (
        <div className="promo-strip">
          <div className="promo-strip-fire">🔥</div>
          <div className="promo-strip-text">Promos</div>
          <div className="promo-strip-items">
            {promoItems.map(p => {
              const pct = Math.round((1 - p.prix_promo/p.prix_vente)*100)
              return (
                <div key={p.id} className="promo-chip" onClick={()=>setSelectedProduct(p)}>
                  {p.nom.length > 20 ? p.nom.slice(0,20)+'…' : p.nom}
                  <span className="promo-chip-pct">-{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STICKY TOOLBAR ── */}
      <div className="shop-toolbar">
        <div className="shop-toolbar-inner">
          <div className="shop-cats">
            {categories.map(cat => (
              <button key={cat} className={`shop-cat${activeCategory===cat?' active':''}`}
                onClick={()=>setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div className="shop-toolbar-bottom">
            <div className="shop-search">
              <span className="shop-search-icon">🔍</span>
              <input type="text" placeholder="Rechercher un produit…"
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="shop-count">
              <strong>{filtered.length}</strong> article{filtered.length>1?'s':''}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="shop-main">
        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 20px'}}>
            <div style={{fontSize:52,marginBottom:14,opacity:.2}}>📦</div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,color:'#303540',marginBottom:8}}>
              {search?'Aucun résultat':'Aucun produit disponible'}
            </div>
            {search && <div style={{fontSize:13,color:'#252830'}}>Essayez un autre mot-clé</div>}
          </div>
        ) : (
          <div className="prod-grid">
            {filtered.map((p: any, i: number) => (
              <div key={p.id} className="prod-card" style={{animationDelay:`${Math.min(i,12)*.04}s`}}
                onClick={()=>setSelectedProduct(p)}>
                <div className="prod-card-img">
                  {p.photo_url ? <img src={p.photo_url} alt={p.nom}/> : <span>📦</span>}
                  <div className="prod-card-img-overlay"/>
                  <button className="prod-card-quick" onClick={e=>{e.stopPropagation();addToCart(p)}}>
                    + Ajouter au panier
                  </button>
                  <div className={`prod-badge-stock${p.stock>5?' prod-badge-ok':' prod-badge-low'}`}>
                    {p.stock>5?'● En stock':`⚠ ${p.stock} restant${p.stock>1?'s':''}`}
                  </div>
                  {p.prix_promo && (
                    <div className="prod-badge-promo">
                      -{Math.round((1-p.prix_promo/p.prix_vente)*100)}%
                    </div>
                  )}
                </div>
                <div className="prod-card-body">
                  {p.categorie && <div className="prod-card-cat">{p.categorie}</div>}
                  <div className="prod-card-name">{p.nom}</div>
                  {p.description && <div className="prod-card-desc">{p.description}</div>}
                  <div className="prod-card-foot">
                    <div>
                      {p.prix_promo ? (
                        <>
                          <div className="prod-price-promo">{fCFA(p.prix_promo)}</div>
                          <div className="prod-price-orig">{fCFA(p.prix_vente)}</div>
                        </>
                      ) : (
                        <div className="prod-price-normal">{fCFA(p.prix_vente)}</div>
                      )}
                    </div>
                    <button className="prod-add" onClick={e=>{e.stopPropagation();addToCart(p)}}>
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── PRODUCT PANEL ── */}
      {selectedProduct && (
        <div className="p-overlay" onClick={()=>setSelectedProduct(null)}>
          <div className="p-panel" onClick={e=>e.stopPropagation()}>
            <div className="p-panel-img">
              {selectedProduct.photo_url?<img src={selectedProduct.photo_url} alt={selectedProduct.nom}/>:<span>📦</span>}
              <div className="p-panel-img-grad"/>
              <button className="p-close" onClick={()=>setSelectedProduct(null)}>✕</button>
              {selectedProduct.prix_promo && (
                <div style={{position:'absolute',top:16,left:16,background:'linear-gradient(135deg,#ff4444,#ff7043)',color:'#fff',padding:'5px 14px',borderRadius:100,fontSize:11,fontWeight:800,zIndex:2}}>
                  -{Math.round((1-selectedProduct.prix_promo/selectedProduct.prix_vente)*100)}% PROMO
                </div>
              )}
            </div>
            <div className="p-body">
              {selectedProduct.categorie && <div className="p-cat">{selectedProduct.categorie}</div>}
              <div className="p-name">{selectedProduct.nom}</div>
              {selectedProduct.description && <div className="p-desc">{selectedProduct.description}</div>}
              <div style={{marginBottom:4}}>
                {selectedProduct.prix_promo ? (
                  <>
                    <div className="p-price-promo">{fCFA(selectedProduct.prix_promo)}</div>
                    <div className="p-price-orig">{fCFA(selectedProduct.prix_vente)}</div>
                    <div className="p-economy">🎉 Vous économisez {fCFA(selectedProduct.prix_vente-selectedProduct.prix_promo)}</div>
                  </>
                ) : (
                  <div className="p-price-norm">{fCFA(selectedProduct.prix_vente)}</div>
                )}
              </div>
              <div className="p-stock" style={{color:selectedProduct.stock>5?'#2ecc87':'#f5a623'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor',display:'inline-block',flexShrink:0}}/>
                {selectedProduct.stock>5?`${selectedProduct.stock} articles en stock`:`Plus que ${selectedProduct.stock} disponible${selectedProduct.stock>1?'s':''} — commandez vite !`}
              </div>
              <button className="p-btn-add" onClick={()=>addToCart(selectedProduct)}>
                🛍 Ajouter au panier
              </button>
              {waPhone && (
                <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour ! Je voudrais commander :\n*${selectedProduct.nom}* — ${fCFA(selectedProduct.prix_promo||selectedProduct.prix_vente)}\n\nVia votre boutique Vendify 🛒`)}`}
                  className="p-btn-wa" target="_blank" rel="noopener noreferrer">
                  💬 Commander directement sur WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ── */}
      {showCart && (
        <>
          <div className="cart-over" onClick={()=>setShowCart(false)}/>
          <div className="cart-drawer">
            <div className="cart-hd">
              <span className="cart-title">🛍 Mon panier {cartCount>0&&<span style={{fontSize:14,color:'#f5a623'}}>({cartCount})</span>}</span>
              <button className="cart-close" onClick={()=>setShowCart(false)}>✕</button>
            </div>
            <div className="cart-body">
              {cart.length===0 ? (
                <div className="cart-empty">
                  <div style={{fontSize:48,marginBottom:14,opacity:.2}}>🛍</div>
                  <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,color:'#303540',marginBottom:6}}>Panier vide</div>
                  <div style={{fontSize:12,color:'#252830'}}>Ajoutez des produits pour commencer</div>
                </div>
              ) : cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-img">
                    {item.product.photo_url?<img src={item.product.photo_url} alt={item.product.nom}/>:'📦'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="cart-item-name">{item.product.nom}</div>
                    <div className="cart-item-price">{fCFA((item.product.prix_promo||item.product.prix_vente)*item.quantite)}</div>
                    <div className="qty-row">
                      <button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button>
                      <span className="qty-val">{item.quantite}</span>
                      <button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button>
                      <button className="qty-del" onClick={()=>removeFromCart(item.product.id)}>Retirer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length>0&&(
              <div className="cart-ft">
                <div className="cart-total-row">
                  <span className="cart-total-lbl">Total</span>
                  <span className="cart-total-val">{fCFA(cartTotal)}</span>
                </div>
                <div className="cart-total-items">{cartCount} article{cartCount>1?'s':''}</div>
                <button className="btn-cmd" onClick={()=>{setShowCart(false);setShowCheckout(true)}}>
                  Commander maintenant →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CHECKOUT ── */}
      {showCheckout && (
        <div className="co-over" onClick={()=>setShowCheckout(false)}>
          <div className="co-box" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
              <div>
                <div className="co-title">Finaliser la commande</div>
                <div className="co-sub">Boutique : {profile.shop_name}</div>
              </div>
              <button onClick={()=>setShowCheckout(false)} style={{background:'none',border:'none',color:'#404550',fontSize:20,cursor:'pointer',marginTop:2}}>✕</button>
            </div>
            <div className="co-summary">
              {cart.map(item=>(
                <div key={item.product.id} className="co-sum-item">
                  <span>{item.product.nom} × {item.quantite}</span>
                  <span style={{color:item.product.prix_promo?'#ff9090':'#f5a623',fontWeight:700}}>{fCFA((item.product.prix_promo||item.product.prix_vente)*item.quantite)}</span>
                </div>
              ))}
              <div className="co-sum-total">
                <span>Total</span>
                <span className="co-sum-total-val">{fCFA(cartTotal)}</span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <label className="co-lbl">Votre nom *</label>
                <input className="co-inp" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Ex: Aminata Koné"/>
              </div>
              <div>
                <label className="co-lbl">Numéro WhatsApp *</label>
                <input className="co-inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Ex: 0700000000"/>
              </div>
              <div>
                <label className="co-lbl">Mode de paiement</label>
                <div className="pay-grid">
                  {[{id:'wave',icon:'🌊',name:'Wave'},{id:'orange_money',icon:'🟠',name:'Orange Money'},{id:'mtn_momo',icon:'💛',name:'MTN MoMo'},{id:'cash',icon:'💵',name:'Cash'}].map(opt=>(
                    <div key={opt.id} className={`pay-opt${form.mode_paiement===opt.id?' active':''}`}
                      onClick={()=>setForm({...form,mode_paiement:opt.id})}>
                      <div className="pay-opt-icon">{opt.icon}</div>
                      <div className="pay-opt-name">{opt.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="co-lbl">Adresse / Note (optionnel)</label>
                <textarea className="co-inp" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Adresse de livraison, couleur souhaitée…" rows={3} style={{resize:'vertical'}}/>
              </div>
            </div>
            <button className="co-submit" onClick={handleOrder} disabled={submitting||!form.nom||!form.phone}>
              {submitting?'⏳ Envoi en cours…':`✓ Commander — ${fCFA(cartTotal)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {orderResult && (
        <div className="success-over">
          <div className="success-box">
            <div className="success-icon">✅</div>
            <div className="success-title">Commande reçue !</div>
            <div className="success-sub">
              Votre commande a été transmise à <strong style={{color:'#edeae4'}}>{profile.shop_name}</strong>.<br/>
              Cliquez ci-dessous pour notifier le vendeur sur WhatsApp.
            </div>
            {orderResult.vendor_phone && (() => {
              const vPhone = normalizePhone(orderResult.vendor_phone)
              const msg = `🛍 *Nouvelle commande !*\n\n👤 ${orderResult.client_nom}\n📦 ${orderResult.items_desc}\n💰 ${fCFA(orderResult.total)}\n💳 ${modeLabel[orderResult.mode_paiement]||orderResult.mode_paiement}\n\n_Via Vendify.ci_ 🛒`
              return (
                <a href={`https://wa.me/${vPhone}?text=${encodeURIComponent(msg)}`}
                  target="_blank" rel="noopener noreferrer" className="success-wa">
                  <span style={{fontSize:20}}>💬</span> Notifier le vendeur
                </a>
              )
            })()}
            <button className="success-continue" onClick={()=>setOrderResult(null)}>
              Continuer mes achats
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="shop-footer">
        Boutique propulsée par <a href="/">Vendify.ci</a> — La plateforme des vendeurs africains
      </div>
    </>
  )
}