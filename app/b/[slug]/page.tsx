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
  const [profile, setProfile]   = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Extraire le slug depuis l'URL directement
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
        .gt('stock', 0)
        .order('created_at', { ascending: false })

      setProfile(profile)
      setProducts(products || [])
      setLoading(false)

      // Mettre à jour le titre de la page
      document.title = `${profile.shop_name} — Vendify`
    }

    load()
  }, [])

  const waPhone = profile?.phone?.replace(/\D/g, '') || ''

  if (loading) return (
    <div style={{ background:'#080a0f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#f5a623', fontFamily:'Syne,sans-serif', fontSize:16 }}>Chargement...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ background:'#080a0f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>🏪</div>
      <div style={{ color:'#f0f2f7', fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700 }}>Boutique introuvable</div>
      <a href="/register" style={{ color:'#f5a623', fontSize:13 }}>Créer votre boutique →</a>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#080a0f; font-family:'DM Sans',sans-serif; color:#e8eaf0; min-height:100vh; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .orb { position:fixed;border-radius:50%;filter:blur(100px);opacity:0.08;pointer-events:none; }
        .o1  { width:500px;height:500px;background:#f5a623;top:-150px;right:-100px;animation:pulse 8s ease-in-out infinite; }
        .o2  { width:400px;height:400px;background:#2ecc87;bottom:-100px;left:-100px;animation:pulse 10s ease-in-out infinite 2s; }
        .topbar { position:sticky;top:0;z-index:100;background:rgba(8,10,15,0.9);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.05);padding:14px 20px;display:flex;align-items:center;justify-content:space-between; }
        .topbar-vendify { font-family:'Syne',sans-serif;font-size:16px;font-weight:800;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .hero { padding:48px 20px 36px;text-align:center;animation:fadeUp 0.5s ease;position:relative;z-index:1; }
        .shop-name { font-family:'Syne',sans-serif;font-size:clamp(28px,6vw,48px);font-weight:900;letter-spacing:-1px;margin-bottom:8px; }
        .badge { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:4px; }
        .bg   { background:rgba(46,204,135,0.1);border:1px solid rgba(46,204,135,0.2);color:#2ecc87; }
        .bo   { background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.2);color:#f5a623; }
        .bgr  { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#717a8f; }
        .wa-btn { display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-radius:14px;padding:14px 28px;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 24px rgba(37,211,102,0.3);margin-top:20px; }
        .section { padding:0 20px 60px;max-width:900px;margin:0 auto;position:relative;z-index:1; }
        .grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px; }
        .card { background:#161a22;border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden;transition:all 0.2s;animation:fadeUp 0.4s ease both; }
        .card:hover { border-color:rgba(245,166,35,0.2);transform:translateY(-3px); }
        .card-img { height:160px;background:rgba(245,166,35,0.04);display:flex;align-items:center;justify-content:center;font-size:48px;position:relative; }
        .card-img img { width:100%;height:100%;object-fit:cover; }
        .card-body { padding:16px; }
        .card-name  { font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:5px; }
        .card-desc  { font-size:12px;color:#717a8f;margin-bottom:14px;line-height:1.5; }
        .card-foot  { display:flex;align-items:center;justify-content:space-between; }
        .card-price { font-family:'Syne',sans-serif;font-size:18px;font-weight:900;color:#f5a623; }
        .order-btn  { display:flex;align-items:center;gap:5px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;text-decoration:none; }
        .stock-badge { position:absolute;top:10px;right:10px;background:rgba(8,10,15,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:3px 9px;font-size:10px;font-weight:700; }
        .footer { border-top:1px solid rgba(255,255,255,0.05);padding:24px;text-align:center;font-size:12px;color:#3a4255;position:relative;z-index:1; }
        .footer a { color:#f5a623;text-decoration:none; }
        @media (max-width:640px) { .grid { grid-template-columns:1fr 1fr; } .card-img { height:120px;font-size:36px; } }
        @media (max-width:400px) { .grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="orb o1"/><div className="orb o2"/>

      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,background:'linear-gradient(135deg,#f5a623,#ffcc6b)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🛒</div>
          <span className="topbar-vendify">Vendify</span>
        </div>
        <a href="/register" style={{fontSize:11,color:'#717a8f',textDecoration:'none'}}>
          Vendez aussi ? <span style={{color:'#f5a623',fontWeight:600}}>Créer ma boutique →</span>
        </a>
      </div>

      <div className="hero">
        <div style={{fontSize:48,marginBottom:12}}>🏪</div>
        <h1 className="shop-name">{profile.shop_name}</h1>
        <p style={{color:'#717a8f',fontSize:14,marginBottom:16}}>Boutique de {profile.full_name}</p>
        <div>
          <span className="badge bg">● En ligne</span>
          <span className="badge bo">📦 {products.length} produit{products.length>1?'s':''}</span>
          {profile.pays && <span className="badge bgr">📍 {profile.pays}</span>}
          {profile.plan==='premium' && <span className="badge bo">⚡ Premium</span>}
        </div>
        {waPhone && (
          <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Bonjour ! J'ai vu votre boutique Vendify 🛒")}`}
            className="wa-btn" target="_blank" rel="noopener noreferrer">
            <span style={{fontSize:20}}>💬</span> Commander via WhatsApp
          </a>
        )}
      </div>

      <div className="section">
        <h2 style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
          Nos produits <span style={{fontSize:13,fontWeight:400,color:'#717a8f'}}>{products.length} disponible{products.length>1?'s':''}</span>
        </h2>
        {products.length===0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',color:'#717a8f'}}>
            <div style={{fontSize:48,marginBottom:16}}>📦</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700}}>Aucun produit disponible</div>
          </div>
        ) : (
          <div className="grid">
            {products.map((p:any, i:number) => {
              const waMsg = `Bonjour ! Je veux commander : *${p.nom}* (${formatCFA(p.prix_vente)}) 🛒`
              const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}` : `https://wa.me/?text=${encodeURIComponent(waMsg)}`
              return (
                <div key={p.id} className="card" style={{animationDelay:`${i*0.06}s`}}>
                  <div className="card-img">
                    {p.photo_url ? <img src={p.photo_url} alt={p.nom}/> : <span>📦</span>}
                    <div className="stock-badge" style={{color:p.stock>5?'#2ecc87':'#f5a623'}}>
                      {p.stock>5?'● En stock':`⚠ ${p.stock} restant${p.stock>1?'s':''}`}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-name">{p.nom}</div>
                    {p.description && <div className="card-desc">{p.description}</div>}
                    <div className="card-foot">
                      <div className="card-price">{formatCFA(p.prix_vente)}</div>
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="order-btn">💬 Commander</a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="footer">
        Boutique propulsée par <a href="/">Vendify.ci</a> · Plateforme de vente pour vendeurs africains
      </div>
    </>
  )
}