'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = [
  { label: 'Tous', icon: '✦' },
  { label: 'Vêtements', icon: '👗' },
  { label: 'Chaussures', icon: '👟' },
  { label: 'Bijoux', icon: '💍' },
  { label: 'Sacs', icon: '👜' },
  { label: 'Beauté', icon: '💄' },
  { label: 'Alimentation', icon: '🍎' },
  { label: 'Électronique', icon: '📱' },
  { label: 'Maison', icon: '🏠' },
  { label: 'Autre', icon: '📦' },
]

const PAYS = [
  { value: 'tous', flag: '🌍', label: 'Partout' },
  { value: 'CI',   flag: '🇨🇮', label: "Côte d'Ivoire" },
  { value: 'SN',   flag: '🇸🇳', label: 'Sénégal' },
  { value: 'BJ',   flag: '🇧🇯', label: 'Bénin' },
  { value: 'CM',   flag: '🇨🇲', label: 'Cameroun' },
  { value: 'TG',   flag: '🇹🇬', label: 'Togo' },
]

function fCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function getGrad(name: string) {
  const grads = [
    'linear-gradient(135deg,#f5a623,#ff7f50)',
    'linear-gradient(135deg,#a855f7,#6366f1)',
    'linear-gradient(135deg,#2ecc87,#00b4d8)',
    'linear-gradient(135deg,#e1306c,#f77737)',
    'linear-gradient(135deg,#4d8cff,#a78bfa)',
    'linear-gradient(135deg,#ff5e5e,#ff9a3c)',
  ]
  return grads[(name?.charCodeAt(0) || 0) % grads.length]
}

export default function BoutiquesPage() {
  const [products, setProducts]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [activePays, setActivePays]     = useState('tous')
  const [sortBy, setSortBy]             = useState<'recent'|'prix_asc'|'prix_desc'>('recent')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [stats, setStats]               = useState({ boutiques: 0, produits: 0 })
  const [activeTab, setActiveTab]       = useState<'produits'|'boutiques'>('produits')
  const [scrolled, setScrolled]         = useState(false)
  const searchRef                       = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProducts()
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select(`id,nom,description,prix_vente,prix_promo,photo_url,stock,categorie,created_at,
        profiles!inner(id,shop_name,shop_slug,pays,plan,banner_url)`)
      .eq('actif', true)
      .gt('stock', 0)
      .eq('profiles.plan', 'premium')
      .order('created_at', { ascending: false })

    if (data) {
      setProducts(data)
      const b = new Set(data.map((p: any) => p.profiles?.shop_slug)).size
      setStats({ boutiques: b, produits: data.length })
    }
    setLoading(false)
  }

  const filtered = products
    .filter(p => {
      const s = search.toLowerCase()
      const matchSearch = !search || p.nom.toLowerCase().includes(s) || p.profiles?.shop_name?.toLowerCase().includes(s)
      const matchCat  = activeCategory === 'Tous' || p.categorie === activeCategory
      const matchPays = activePays === 'tous' || p.profiles?.pays === activePays
      return matchSearch && matchCat && matchPays
    })
    .sort((a, b) => {
      if (sortBy === 'prix_asc')  return (a.prix_promo||a.prix_vente) - (b.prix_promo||b.prix_vente)
      if (sortBy === 'prix_desc') return (b.prix_promo||b.prix_vente) - (a.prix_promo||a.prix_vente)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const boutiquesMap = products.reduce((acc: any, p: any) => {
    const slug = p.profiles?.shop_slug
    if (!slug) return acc
    if (!acc[slug]) acc[slug] = { ...p.profiles, produits: [] }
    acc[slug].produits.push(p)
    return acc
  }, {})
  const boutiquesArr = Object.values(boutiquesMap) as any[]

  const hasPromo = filtered.filter(p => p.prix_promo).slice(0, 6)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;-webkit-font-smoothing:antialiased;overflow-x:hidden}

        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes slideUp {from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer {0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse   {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.94)}}
        @keyframes ticker  {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        /* ── NAV ── */
        .mp-nav{position:sticky;top:0;z-index:200;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;transition:all .3s}
        .mp-nav.scrolled{background:rgba(7,8,9,.96);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06)}
        .mp-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .mp-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(245,166,35,.35)}
        .mp-logo-name{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:#edeae4}
        .mp-logo-tag{font-size:10px;color:#303540;letter-spacing:.3px}
        .mp-nav-search{flex:1;max-width:440px;margin:0 24px;position:relative}
        .mp-nav-search input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 14px 9px 38px;font-size:13px;color:#edeae4;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s}
        .mp-nav-search input:focus{border-color:rgba(245,166,35,.3)}
        .mp-nav-search input::placeholder{color:#303540}
        .mp-nav-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#404550;font-size:14px}
        .mp-nav-right{display:flex;align-items:center;gap:10px}
        .mp-nav-link{font-size:13px;color:#404550;text-decoration:none;padding:7px 12px;border-radius:8px;transition:all .15s}
        .mp-nav-link:hover{color:#a0a8b8;background:rgba(255,255,255,.04)}
        .mp-nav-cta{background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;white-space:nowrap}
        .mp-nav-cta:hover{box-shadow:0 4px 20px rgba(245,166,35,.35);transform:translateY(-1px)}

        /* ── HERO ── */
        .mp-hero{padding:72px 32px 0;position:relative;overflow:hidden;text-align:center}
        .mp-hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(245,166,35,.12) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 15% 70%,rgba(46,204,135,.05) 0%,transparent 60%)}
        .mp-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 30%,black 0%,transparent 100%);mask-image:radial-gradient(ellipse 90% 80% at 50% 30%,black 0%,transparent 100%)}
        .mp-hero-label{display:inline-flex;align-items:center;gap:7px;background:rgba(245,166,35,.07);border:1px solid rgba(245,166,35,.18);border-radius:100px;padding:6px 16px;font-size:11px;font-weight:700;color:#f5a623;letter-spacing:.5px;margin-bottom:22px;position:relative;z-index:1}
        .mp-hero-dot{width:6px;height:6px;border-radius:50%;background:#f5a623;animation:pulse 1.8s infinite;flex-shrink:0}
        .mp-hero-title{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(36px,6vw,68px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:16px;position:relative;z-index:1}
        .mp-hero-title em{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .mp-hero-sub{font-size:16px;color:#5a6070;max-width:500px;margin:0 auto 36px;line-height:1.7;position:relative;z-index:1}
        .mp-hero-stats{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:48px;position:relative;z-index:1}
        .mp-stat{padding:0 36px;text-align:center;border-right:1px solid rgba(255,255,255,.06)}
        .mp-stat:last-child{border-right:none}
        .mp-stat-val{font-family:'Bricolage Grotesque',sans-serif;font-size:36px;font-weight:800;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px}
        .mp-stat-lbl{font-size:11px;color:#303540;text-transform:uppercase;letter-spacing:.5px}

        /* ── TICKER ── */
        .mp-ticker{background:linear-gradient(135deg,#f5a623,#e8950e);padding:9px 0;overflow:hidden}
        .mp-ticker-track{display:flex;white-space:nowrap;animation:ticker 18s linear infinite}
        .mp-ticker-item{display:inline-flex;align-items:center;gap:8px;padding:0 28px;font-size:11px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:.5px}
        .mp-ticker-sep{width:4px;height:4px;border-radius:50%;background:rgba(0,0,0,.3)}

        /* ── SEARCH (mobile only) ── */
        .mp-search-mobile{padding:20px 16px 0;display:none}
        .mp-search-box{background:#0d0f11;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:5px 5px 5px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
        .mp-search-box input{flex:1;background:none;border:none;outline:none;color:#edeae4;font-size:14px;font-family:'DM Sans',sans-serif}
        .mp-search-box input::placeholder{color:#303540}
        .mp-search-btn{background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer}

        /* ── FILTERS STRIP ── */
        .mp-filters{background:#0a0b0d;border-bottom:1px solid rgba(255,255,255,.05);position:sticky;top:64px;z-index:100}
        .mp-filters-inner{max-width:1300px;margin:0 auto;padding:0 24px}
        .mp-filters-top{display:flex;align-items:center;gap:0;border-bottom:1px solid rgba(255,255,255,.04);overflow-x:auto;scrollbar-width:none}
        .mp-filters-top::-webkit-scrollbar{display:none}
        .mp-cat-btn{display:flex;align-items:center;gap:7px;padding:14px 18px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;color:#404550;white-space:nowrap;border-bottom:2px solid transparent;transition:all .2s;flex-shrink:0}
        .mp-cat-btn:hover{color:#a0a8b8}
        .mp-cat-btn.active{color:#f5a623;border-bottom-color:#f5a623}
        .mp-cat-btn-icon{font-size:14px}
        .mp-filters-bottom{display:flex;align-items:center;justify-content:space-between;padding:10px 0;gap:12px;overflow-x:auto;scrollbar-width:none}
        .mp-filters-bottom::-webkit-scrollbar{display:none}
        .mp-pays-btns{display:flex;gap:8px;flex-shrink:0}
        .mp-pays-btn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);color:#5a6070;transition:all .15s;white-space:nowrap}
        .mp-pays-btn:hover{background:rgba(255,255,255,.06);color:#a0a8b8}
        .mp-pays-btn.active{background:rgba(245,166,35,.1);border-color:rgba(245,166,35,.25);color:#f5a623}
        .mp-right-filters{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .mp-sort{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:7px 12px;color:#a0a8b8;font-size:12px;outline:none;cursor:pointer;font-family:'DM Sans',sans-serif}
        .mp-sort option{background:#0d0f11}
        .mp-tab-toggle{display:flex;background:rgba(255,255,255,.04);border-radius:9px;padding:3px;gap:2px}
        .mp-tab-btn{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:none;color:#5a6070;transition:all .2s;white-space:nowrap}
        .mp-tab-btn.active{background:#161a22;color:#edeae4;box-shadow:0 1px 4px rgba(0,0,0,.4)}

        /* ── MAIN CONTENT ── */
        .mp-main{max-width:1300px;margin:0 auto;padding:28px 24px 80px}

        /* ── PROMO BANNER ── */
        .mp-promo-banner{background:linear-gradient(135deg,rgba(255,68,68,.06),rgba(255,150,50,.04));border:1px solid rgba(255,68,68,.12);border-radius:20px;padding:20px 24px;margin-bottom:32px;display:flex;align-items:center;gap:20px;overflow:hidden;position:relative}
        .mp-promo-banner::before{content:'';position:absolute;right:-20px;top:-20px;width:100px;height:100px;background:radial-gradient(circle,rgba(255,68,68,.08) 0%,transparent 70%)}
        .mp-promo-fire{font-size:36px;flex-shrink:0}
        .mp-promo-title{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:700;margin-bottom:4px}
        .mp-promo-sub{font-size:12px;color:#5a6070}
        .mp-promo-cards{display:flex;gap:10px;margin-left:auto;flex-shrink:0}
        .mp-promo-mini{width:56px;height:56px;border-radius:10px;background:#0d0f11;border:1px solid rgba(255,68,68,.15);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;flex-shrink:0;transition:transform .2s}
        .mp-promo-mini:hover{transform:scale(1.05)}
        .mp-promo-mini img{width:100%;height:100%;object-fit:cover}

        /* ── SECTION HEADER ── */
        .mp-section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .mp-section-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
        .mp-section-count{font-size:12px;color:#303540}

        /* ── BOUTIQUES GRID ── */
        .mp-boutiques-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:48px}
        .mp-boutique-card{background:#0d0f11;border:1px solid rgba(255,255,255,.06);border-radius:20px;overflow:hidden;cursor:pointer;transition:all .25s;text-decoration:none;display:block}
        .mp-boutique-card:hover{border-color:rgba(245,166,35,.22);transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,.5)}
        .mp-boutique-banner{height:80px;background:linear-gradient(135deg,#0f1218,#161c28);position:relative;overflow:hidden;flex-shrink:0}
        .mp-boutique-banner img{width:100%;height:100%;object-fit:cover}
        .mp-boutique-banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(7,8,9,.8) 100%)}
        .mp-boutique-body{padding:12px 16px 16px}
        .mp-boutique-avatar{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-top:-32px;margin-bottom:10px;border:2px solid #0d0f11;position:relative;font-weight:800;color:#fff}
        .mp-boutique-name{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;margin-bottom:3px;color:#edeae4}
        .mp-boutique-meta{font-size:11px;color:#303540;margin-bottom:12px}
        .mp-boutique-preview{display:flex;gap:6px;align-items:center}
        .mp-boutique-thumb{width:40px;height:40px;border-radius:8px;overflow:hidden;background:#161a22;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;border:1px solid rgba(255,255,255,.05)}
        .mp-boutique-thumb img{width:100%;height:100%;object-fit:cover}
        .mp-boutique-more{width:40px;height:40px;border-radius:8px;background:rgba(245,166,35,.07);border:1px solid rgba(245,166,35,.15);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#f5a623;flex-shrink:0}
        .mp-boutique-badge{margin-left:auto;background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.2);border-radius:100px;padding:3px 10px;font-size:9px;font-weight:700;color:#2ecc87;white-space:nowrap}

        /* ── PRODUCT GRID ── */
        .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
        .mp-card{background:#0d0f11;border:1px solid rgba(255,255,255,.06);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .25s;animation:fadeUp .4s ease both}
        .mp-card:hover{border-color:rgba(245,166,35,.2);transform:translateY(-4px);box-shadow:0 20px 56px rgba(0,0,0,.6)}
        .mp-card-img{aspect-ratio:1;background:#111418;display:flex;align-items:center;justify-content:center;font-size:52px;position:relative;overflow:hidden}
        .mp-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
        .mp-card:hover .mp-card-img img{transform:scale(1.07)}
        .mp-card-body{padding:12px 14px 14px}
        .mp-card-shop{display:flex;align-items:center;gap:5px;font-size:10px;color:#303540;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
        .mp-card-shop-dot{width:5px;height:5px;border-radius:50%;background:#f5a623;flex-shrink:0}
        .mp-card-name{font-size:13px;font-weight:600;color:#edeae4;margin-bottom:3px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .mp-card-cat{font-size:10px;color:#252830;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
        .mp-card-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:6px}
        .mp-price-wrap{}
        .mp-price-promo{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:800;color:#ff6b6b}
        .mp-price-orig{font-size:10px;color:#303540;text-decoration:line-through}
        .mp-price-normal{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:800;color:#f5a623}
        .mp-card-action{width:30px;height:30px;border-radius:9px;background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:all .15s;text-decoration:none}
        .mp-card-action:hover{background:rgba(245,166,35,.2);transform:scale(1.08)}
        .mp-badge-promo{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#ff4444,#ff7043);color:#fff;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:800;letter-shadow:0 2px 8px rgba(255,68,68,.4)}
        .mp-badge-stock{position:absolute;top:10px;left:10px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;backdrop-filter:blur(8px)}
        .mp-badge-ok{background:rgba(46,204,135,.12);border:1px solid rgba(46,204,135,.25);color:#2ecc87}
        .mp-badge-low{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.25);color:#f5a623}

        /* ── SKELETON ── */
        .mp-skel{background:linear-gradient(90deg,#0d0f11 25%,#131619 50%,#0d0f11 75%);background-size:400% 100%;animation:shimmer 1.5s infinite;border-radius:8px}

        /* ── PANEL ── */
        .mp-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.88);backdrop-filter:blur(16px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .mp-panel{background:#0d0f11;border:1px solid rgba(255,255,255,.09);border-radius:28px 28px 0 0;width:100%;max-width:580px;max-height:93vh;overflow-y:auto;animation:slideUp .3s ease}
        .mp-panel-img{aspect-ratio:4/3;background:#111418;display:flex;align-items:center;justify-content:center;font-size:72px;position:relative;overflow:hidden;flex-shrink:0}
        .mp-panel-img img{width:100%;height:100%;object-fit:cover}
        .mp-panel-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,15,17,1) 0%,transparent 50%)}
        .mp-panel-close{position:absolute;top:16px;right:16px;width:36px;height:36px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#edeae4;font-size:15px;backdrop-filter:blur(8px);transition:all .15s;z-index:2}
        .mp-panel-close:hover{background:rgba(255,255,255,.1)}
        .mp-panel-body{padding:24px 24px 32px}
        .mp-panel-shop{display:inline-flex;align-items:center;gap:7px;background:rgba(245,166,35,.07);border:1px solid rgba(245,166,35,.15);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;color:#f5a623;text-decoration:none;margin-bottom:14px;transition:all .15s}
        .mp-panel-shop:hover{background:rgba(245,166,35,.12)}
        .mp-panel-name{font-family:'Bricolage Grotesque',sans-serif;font-size:24px;font-weight:800;margin-bottom:8px;line-height:1.15}
        .mp-panel-desc{font-size:13px;color:#5a6070;line-height:1.65;margin-bottom:20px;font-style:italic}
        .mp-panel-price-promo{font-family:'Bricolage Grotesque',sans-serif;font-size:36px;font-weight:800;color:#ff6b6b;line-height:1}
        .mp-panel-price-norm{font-family:'Bricolage Grotesque',sans-serif;font-size:36px;font-weight:800;color:#f5a623;line-height:1}
        .mp-panel-price-orig{font-size:14px;color:#303540;text-decoration:line-through;margin-top:4px}
        .mp-panel-economy{display:inline-block;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);color:#ff6b6b;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700;margin-top:8px}
        .mp-panel-stock{font-size:12px;margin-bottom:22px;display:flex;align-items:center;gap:6px}
        .mp-btn-boutique{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border-radius:14px;padding:15px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:10px;transition:all .2s;box-shadow:0 6px 24px rgba(245,166,35,.25)}
        .mp-btn-boutique:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(245,166,35,.35)}
        .mp-btn-wa{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.2);color:#25d366;border-radius:14px;padding:12px;font-size:14px;font-weight:600;text-decoration:none;transition:all .15s}
        .mp-btn-wa:hover{background:rgba(37,211,102,.14)}

        /* ── EMPTY ── */
        .mp-empty{text-align:center;padding:80px 20px}
        .mp-empty-icon{font-size:56px;margin-bottom:16px;opacity:.25}
        .mp-empty-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;color:#303540;margin-bottom:8px}
        .mp-empty-sub{font-size:13px;color:#252830}

        /* ── FOOTER ── */
        .mp-footer{background:#050607;border-top:1px solid rgba(255,255,255,.04);padding:48px 32px 32px;text-align:center}
        .mp-footer-logo{font-family:'Bricolage Grotesque',sans-serif;font-size:24px;font-weight:800;color:#edeae4;margin-bottom:8px}
        .mp-footer-sub{font-size:12px;color:#252830;margin-bottom:20px}
        .mp-footer-cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border-radius:12px;padding:11px 22px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s}
        .mp-footer-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(245,166,35,.3)}
        .mp-footer-flags{margin-top:20px;font-size:18px;letter-spacing:4px;opacity:.4}

        /* ── RESPONSIVE ── */
        @media(max-width:1024px){
          .mp-nav-search{max-width:280px}
        }
        @media(max-width:767px){
          .mp-nav{padding:0 16px}
          .mp-nav-search{display:none}
          .mp-nav-link{display:none}
          .mp-search-mobile{display:block}
          .mp-hero{padding:56px 16px 0}
          .mp-hero-stats{gap:0}
          .mp-stat{padding:0 20px}
          .mp-stat-val{font-size:28px}
          .mp-filters-inner{padding:0 16px}
          .mp-main{padding:20px 16px 60px}
          .mp-grid{grid-template-columns:repeat(2,1fr);gap:10px}
          .mp-boutiques-grid{grid-template-columns:1fr 1fr;gap:10px}
          .mp-promo-cards{display:none}
          .mp-filters-bottom{flex-wrap:wrap}
        }
        @media(max-width:420px){
          .mp-grid{grid-template-columns:1fr}
          .mp-boutiques-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* NAV */}
      <nav className={`mp-nav${scrolled?' scrolled':''}`}>
        <a href="/" className="mp-logo">
          <div className="mp-logo-icon">🛒</div>
          <div>
            <div className="mp-logo-name">Vendify</div>
            <div className="mp-logo-tag">Marketplace Afrique de l'Ouest</div>
          </div>
        </a>
        <div className="mp-nav-search">
          <span className="mp-nav-search-icon">🔍</span>
          <input type="text" placeholder="Rechercher produit ou boutique…"
            value={search} onChange={e => setSearch(e.target.value)} ref={searchRef}/>
          {search && <button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#404550',cursor:'pointer',fontSize:13}}>✕</button>}
        </div>
        <div className="mp-nav-right">
          <a href="/login" className="mp-nav-link">Se connecter</a>
          <a href="/register" className="mp-nav-cta">Vendre sur Vendify →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="mp-hero">
        <div className="mp-hero-bg"/><div className="mp-hero-grid"/>
        <div className="mp-hero-label" style={{position:'relative',zIndex:1}}>
          <div className="mp-hero-dot"/>
          Marché en ligne · Afrique de l'Ouest
        </div>
        <h1 className="mp-hero-title" style={{position:'relative',zIndex:1}}>
          Découvrez les meilleures<br/>
          <em>boutiques africaines</em>
        </h1>
        <p className="mp-hero-sub" style={{position:'relative',zIndex:1}}>
          Des produits authentiques, des vendeurs vérifiés.<br/>Commandez directement et simplement.
        </p>
        <div className="mp-hero-stats" style={{position:'relative',zIndex:1}}>
          <div className="mp-stat">
            <div className="mp-stat-val">{loading ? '—' : stats.boutiques}</div>
            <div className="mp-stat-lbl">Boutiques</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-val">{loading ? '—' : stats.produits}</div>
            <div className="mp-stat-lbl">Produits</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-val">5</div>
            <div className="mp-stat-lbl">Pays</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-val">100%</div>
            <div className="mp-stat-lbl">Vérifié</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="mp-ticker">
        <div className="mp-ticker-track">
          {[...Array(2)].map((_,i) => (
            <span key={i}>
              {['✦ Livraison disponible partout','🇨🇮 Vendeurs en Côte d\'Ivoire','💳 Paiement Mobile Money','🇸🇳 Boutiques au Sénégal','⚡ Commandes en temps réel','🎁 Nouveaux produits chaque jour','🇧🇯 Vendeurs au Bénin & Togo'].map((t,j) => (
                <span key={j} className="mp-ticker-item">{t}<span className="mp-ticker-sep"/></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* SEARCH MOBILE */}
      <div className="mp-search-mobile">
        <div className="mp-search-box">
          <span style={{color:'#303540',fontSize:15}}>🔍</span>
          <input type="text" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search
            ? <button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'#404550',cursor:'pointer',padding:'0 4px',fontSize:14}}>✕</button>
            : <button className="mp-search-btn">Chercher</button>
          }
        </div>
      </div>

      {/* FILTERS */}
      <div className="mp-filters">
        <div className="mp-filters-inner">
          {/* Catégories */}
          <div className="mp-filters-top">
            {CATEGORIES.map(c => (
              <button key={c.label} className={`mp-cat-btn${activeCategory===c.label?' active':''}`}
                onClick={()=>setActiveCategory(c.label)}>
                <span className="mp-cat-btn-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
          {/* Pays + sort + tabs */}
          <div className="mp-filters-bottom">
            <div className="mp-pays-btns">
              {PAYS.map(p => (
                <button key={p.value} className={`mp-pays-btn${activePays===p.value?' active':''}`}
                  onClick={()=>setActivePays(p.value)}>
                  {p.flag} {p.label}
                </button>
              ))}
            </div>
            <div className="mp-right-filters">
              <select className="mp-sort" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
                <option value="recent">Plus récents</option>
                <option value="prix_asc">Prix ↑</option>
                <option value="prix_desc">Prix ↓</option>
              </select>
              <div className="mp-tab-toggle">
                <button className={`mp-tab-btn${activeTab==='produits'?' active':''}`} onClick={()=>setActiveTab('produits')}>🛍 Produits</button>
                <button className={`mp-tab-btn${activeTab==='boutiques'?' active':''}`} onClick={()=>setActiveTab('boutiques')}>🏪 Boutiques</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="mp-main">
        {loading ? (
          <div className="mp-grid">
            {Array.from({length:12}).map((_,i) => (
              <div key={i} style={{borderRadius:18,overflow:'hidden',background:'#0d0f11',border:'1px solid rgba(255,255,255,.06)'}}>
                <div className="mp-skel" style={{aspectRatio:'1',width:'100%'}}/>
                <div style={{padding:14}}>
                  <div className="mp-skel" style={{height:9,width:'50%',marginBottom:8}}/>
                  <div className="mp-skel" style={{height:13,width:'75%',marginBottom:10}}/>
                  <div className="mp-skel" style={{height:18,width:'40%'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── PROMO BANNER ── */}
            {activeTab === 'produits' && hasPromo.length > 0 && !search && activeCategory === 'Tous' && (
              <div className="mp-promo-banner">
                <div className="mp-promo-fire">🔥</div>
                <div>
                  <div className="mp-promo-title">Offres en promotion</div>
                  <div className="mp-promo-sub">{hasPromo.length} produits en réduction aujourd'hui</div>
                </div>
                <div className="mp-promo-cards">
                  {hasPromo.slice(0,4).map(p => (
                    <div key={p.id} className="mp-promo-mini" onClick={()=>setSelectedProduct(p)}>
                      {p.photo_url ? <img src={p.photo_url} alt={p.nom}/> : '📦'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BOUTIQUES TAB ── */}
            {activeTab === 'boutiques' && (
              <>
                <div className="mp-section-hd">
                  <div className="mp-section-title">🏪 Toutes les boutiques</div>
                  <div className="mp-section-count">{boutiquesArr.length} boutique{boutiquesArr.length>1?'s':''}</div>
                </div>
                {boutiquesArr.length === 0 ? (
                  <div className="mp-empty">
                    <div className="mp-empty-icon">🏪</div>
                    <div className="mp-empty-title">Aucune boutique</div>
                    <div className="mp-empty-sub">Les boutiques Premium apparaissent ici</div>
                  </div>
                ) : (
                  <div className="mp-boutiques-grid">
                    {boutiquesArr.map((b: any) => (
                      <a key={b.shop_slug} href={`/b/${b.shop_slug}`} className="mp-boutique-card">
                        <div className="mp-boutique-banner">
                          {b.banner_url && <img src={b.banner_url} alt={b.shop_name}/>}
                          <div className="mp-boutique-banner-overlay"/>
                        </div>
                        <div className="mp-boutique-body">
                          <div className="mp-boutique-avatar" style={{background:getGrad(b.shop_name)}}>
                            {b.shop_name?.charAt(0)?.toUpperCase() || '🏪'}
                          </div>
                          <div className="mp-boutique-name">{b.shop_name}</div>
                          <div className="mp-boutique-meta">
                            {PAYS.find(p=>p.value===b.pays)?.flag} {PAYS.find(p=>p.value===b.pays)?.label}
                            {' · '}{b.produits.length} produit{b.produits.length>1?'s':''}
                          </div>
                          <div className="mp-boutique-preview">
                            {b.produits.slice(0,3).map((p:any) => (
                              <div key={p.id} className="mp-boutique-thumb">
                                {p.photo_url ? <img src={p.photo_url} alt={p.nom}/> : '📦'}
                              </div>
                            ))}
                            {b.produits.length > 3 && (
                              <div className="mp-boutique-more">+{b.produits.length-3}</div>
                            )}
                            <div className="mp-boutique-badge">⚡ Vérifié</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── PRODUITS TAB ── */}
            {activeTab === 'produits' && (
              <>
                {/* Boutiques aperçu si aucun filtre */}
                {!search && activeCategory==='Tous' && activePays==='tous' && boutiquesArr.length > 0 && (
                  <div style={{marginBottom:40}}>
                    <div className="mp-section-hd">
                      <div className="mp-section-title">🏪 Boutiques vedettes</div>
                      <button onClick={()=>setActiveTab('boutiques')} style={{background:'none',border:'none',color:'#f5a623',fontSize:12,fontWeight:700,cursor:'pointer'}}>Voir toutes →</button>
                    </div>
                    <div style={{display:'flex',gap:12,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4}}>
                      {boutiquesArr.map((b:any) => (
                        <a key={b.shop_slug} href={`/b/${b.shop_slug}`}
                          style={{flexShrink:0,background:'#0d0f11',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:'14px 18px',textDecoration:'none',display:'flex',alignItems:'center',gap:12,transition:'all .2s',minWidth:220}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(245,166,35,.2)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.06)'}>
                          <div style={{width:40,height:40,borderRadius:10,background:getGrad(b.shop_name),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16,flexShrink:0}}>
                            {b.shop_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:'#edeae4',marginBottom:2}}>{b.shop_name}</div>
                            <div style={{fontSize:10,color:'#303540'}}>{b.produits.length} produits · {PAYS.find(p=>p.value===b.pays)?.flag}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mp-section-hd">
                  <div className="mp-section-title">
                    🛍 {search ? `Résultats pour "${search}"` : activeCategory !== 'Tous' ? activeCategory : 'Tous les produits'}
                  </div>
                  <div className="mp-section-count">
                    {filtered.length} produit{filtered.length>1?'s':''}
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="mp-empty">
                    <div className="mp-empty-icon">📦</div>
                    <div className="mp-empty-title">Aucun produit trouvé</div>
                    <div className="mp-empty-sub">Essayez une autre recherche ou catégorie</div>
                  </div>
                ) : (
                  <div className="mp-grid">
                    {filtered.map((p:any, i:number) => (
                      <div key={p.id} className="mp-card" style={{animationDelay:`${Math.min(i,12)*.03}s`}}
                        onClick={()=>setSelectedProduct(p)}>
                        <div className="mp-card-img">
                          {p.photo_url ? <img src={p.photo_url} alt={p.nom}/> : <span>📦</span>}
                          <div className={`mp-badge-stock${p.stock>5?' mp-badge-ok':' mp-badge-low'}`}>
                            {p.stock>5 ? '● En stock' : `⚠ ${p.stock} restant${p.stock>1?'s':''}`}
                          </div>
                          {p.prix_promo && <div className="mp-badge-promo">PROMO</div>}
                        </div>
                        <div className="mp-card-body">
                          <div className="mp-card-shop">
                            <div className="mp-card-shop-dot"/>
                            {p.profiles?.shop_name}
                          </div>
                          <div className="mp-card-name">{p.nom}</div>
                          {p.categorie && <div className="mp-card-cat">{p.categorie}</div>}
                          <div className="mp-card-foot">
                            <div className="mp-price-wrap">
                              {p.prix_promo ? (
                                <>
                                  <div className="mp-price-promo">{fCFA(p.prix_promo)}</div>
                                  <div className="mp-price-orig">{fCFA(p.prix_vente)}</div>
                                </>
                              ) : (
                                <div className="mp-price-normal">{fCFA(p.prix_vente)}</div>
                              )}
                            </div>
                            <a href={`/b/${p.profiles?.shop_slug}`} className="mp-card-action"
                              onClick={e=>e.stopPropagation()}>→</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* PANEL PRODUIT */}
      {selectedProduct && (
        <div className="mp-overlay" onClick={()=>setSelectedProduct(null)}>
          <div className="mp-panel" onClick={e=>e.stopPropagation()}>
            <div className="mp-panel-img">
              {selectedProduct.photo_url ? <img src={selectedProduct.photo_url} alt={selectedProduct.nom}/> : <span>📦</span>}
              <div className="mp-panel-img-overlay"/>
              <button className="mp-panel-close" onClick={()=>setSelectedProduct(null)}>✕</button>
              {selectedProduct.prix_promo && (
                <div style={{position:'absolute',top:16,left:16,background:'linear-gradient(135deg,#ff4444,#ff7043)',color:'#fff',padding:'5px 14px',borderRadius:100,fontSize:11,fontWeight:800,zIndex:2}}>
                  PROMO · Économie {fCFA(selectedProduct.prix_vente-selectedProduct.prix_promo)}
                </div>
              )}
            </div>
            <div className="mp-panel-body">
              <a href={`/b/${selectedProduct.profiles?.shop_slug}`} className="mp-panel-shop">
                🏪 {selectedProduct.profiles?.shop_name} →
              </a>
              <div className="mp-panel-name">{selectedProduct.nom}</div>
              {selectedProduct.description && <div className="mp-panel-desc">{selectedProduct.description}</div>}
              <div style={{marginBottom:20}}>
                {selectedProduct.prix_promo ? (
                  <>
                    <div className="mp-panel-price-promo">{fCFA(selectedProduct.prix_promo)}</div>
                    <div className="mp-panel-price-orig">{fCFA(selectedProduct.prix_vente)}</div>
                    <div className="mp-panel-economy">— {fCFA(selectedProduct.prix_vente - selectedProduct.prix_promo)} d'économie</div>
                  </>
                ) : (
                  <div className="mp-panel-price-norm">{fCFA(selectedProduct.prix_vente)}</div>
                )}
              </div>
              <div className="mp-panel-stock" style={{color:selectedProduct.stock>5?'#2ecc87':'#f5a623'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                {selectedProduct.stock>5 ? `${selectedProduct.stock} en stock` : `Plus que ${selectedProduct.stock} disponible${selectedProduct.stock>1?'s':''}`}
              </div>
              <a href={`/b/${selectedProduct.profiles?.shop_slug}`} className="mp-btn-boutique">
                🏪 Visiter la boutique & Commander
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Je suis intéressé(e) par "${selectedProduct.nom}" sur votre boutique Vendify`)}`}
                target="_blank" rel="noopener noreferrer" className="mp-btn-wa">
                💬 Contacter le vendeur sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mp-footer">
        <div className="mp-footer-logo">🛒 Vendify</div>
        <div className="mp-footer-sub">La plateforme des vendeurs africains — Côte d'Ivoire · Sénégal · Bénin · Cameroun · Togo</div>
        <a href="/register" className="mp-footer-cta">🛒 Créer ma boutique gratuitement</a>
        <div className="mp-footer-flags">🇨🇮 🇸🇳 🇧🇯 🇨🇲 🇹🇬</div>
      </footer>
    </>
  )
}