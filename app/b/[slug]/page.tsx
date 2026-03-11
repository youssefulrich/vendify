// app/b/[slug]/page.tsx
// Route publique — accessible sans connexion

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function formatCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Extrait le slug depuis params ou searchParams (Next.js 16 Turbopack)
async function getSlug(params: Props['params'], searchParams: Props['searchParams']) {
  const p = await params
  const sp = await searchParams
  return p?.slug || sp?.nxtPslug || sp?.slug || ''
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = await getSlug(params, searchParams)
  const { data: profile } = await supabase
    .from('profiles').select('shop_name,full_name').eq('shop_slug', slug).single()
  if (!profile) return { title: 'Boutique introuvable' }
  return {
    title: `${(profile as any).shop_name} — Vendify`,
    description: `Découvrez les produits de ${(profile as any).shop_name} et commandez facilement via WhatsApp.`,
  }
}

export default async function BoutiquePage({ params, searchParams }: Props) {
  const slug = await getSlug(params, searchParams)

  console.log('🏪 Boutique slug:', slug)

  if (!slug) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,shop_name,full_name,phone,pays,plan')
    .eq('shop_slug', slug)
    .single()

  if (!profile) notFound()

  const p = profile as any

  const { data: products } = await supabase
    .from('products')
    .select('id,nom,description,prix_vente,stock,image_url')
    .eq('user_id', p.id)
    .gt('stock', 0)
    .order('created_at', { ascending: false })

  const items = products || []
  const waPhone = p.phone?.replace(/\D/g, '') || ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { background:#080a0f; font-family:'DM Sans',sans-serif; color:#e8eaf0; min-height:100vh; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }

        .ambient { position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden; }
        .orb { position:absolute;border-radius:50%;filter:blur(100px);opacity:0.08; }
        .o1 { width:500px;height:500px;background:#f5a623;top:-150px;right:-100px;animation:pulse 8s ease-in-out infinite; }
        .o2 { width:400px;height:400px;background:#2ecc87;bottom:-100px;left:-100px;animation:pulse 10s ease-in-out infinite 2s; }

        .topbar { position:sticky;top:0;z-index:100;background:rgba(8,10,15,0.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.05);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px; }
        .topbar-logo { display:flex;align-items:center;gap:8px; }
        .topbar-icon { width:32px;height:32px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px; }
        .topbar-vendify { font-family:'Syne',sans-serif;font-size:16px;font-weight:800;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .topbar-cta { font-size:11px;color:#717a8f;display:flex;align-items:center;gap:5px; }
        .topbar-cta a { color:#f5a623;font-weight:600;text-decoration:none; }

        .hero { position:relative;z-index:1;padding:48px 20px 36px;text-align:center;animation:fadeUp 0.5s ease; }
        .hero-shop-name { font-family:'Syne',sans-serif;font-size:clamp(28px,6vw,48px);font-weight:900;letter-spacing:-1px;margin-bottom:10px; }
        .hero-sub { font-size:14px;color:#717a8f;margin-bottom:20px;font-weight:300; }
        .hero-badges { display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:28px; }
        .badge { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600; }
        .badge-green { background:rgba(46,204,135,0.1);border:1px solid rgba(46,204,135,0.2);color:#2ecc87; }
        .badge-gold  { background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.2);color:#f5a623; }
        .badge-gray  { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#717a8f; }

        .wa-main-btn { display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-radius:14px;padding:14px 28px;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 24px rgba(37,211,102,0.3);transition:all 0.2s; }
        .wa-main-btn:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(37,211,102,0.4); }

        .section { position:relative;z-index:1;padding:0 20px 60px;max-width:900px;margin:0 auto; }
        .section-title { font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:20px;display:flex;align-items:center;gap:10px; }
        .products-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px; }

        .product-card { background:#161a22;border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden;transition:all 0.2s;animation:fadeUp 0.4s ease both; }
        .product-card:hover { border-color:rgba(245,166,35,0.2);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4); }

        .product-img { height:160px;background:linear-gradient(135deg,rgba(245,166,35,0.06),rgba(255,204,107,0.03));display:flex;align-items:center;justify-content:center;font-size:48px;border-bottom:1px solid rgba(255,255,255,0.04);position:relative;overflow:hidden; }
        .product-img img { width:100%;height:100%;object-fit:cover; }
        .stock-badge { position:absolute;top:10px;right:10px;background:rgba(8,10,15,0.8);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:3px 9px;font-size:10px;font-weight:700; }

        .product-body { padding:16px; }
        .product-name { font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:5px;line-height:1.3; }
        .product-desc { font-size:12px;color:#717a8f;margin-bottom:14px;line-height:1.5;font-weight:300; }
        .product-footer { display:flex;align-items:center;justify-content:space-between;gap:10px; }
        .product-price { font-family:'Syne',sans-serif;font-size:18px;font-weight:900;color:#f5a623; }

        .order-btn { display:flex;align-items:center;gap:5px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;text-decoration:none;transition:all 0.15s;white-space:nowrap; }
        .order-btn:hover { transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,211,102,0.3); }

        .empty { text-align:center;padding:60px 20px;color:#717a8f; }
        .empty-icon { font-size:48px;margin-bottom:16px; }

        .footer { position:relative;z-index:1;border-top:1px solid rgba(255,255,255,0.05);padding:24px 20px;text-align:center;font-size:12px;color:#3a4255; }
        .footer a { color:#f5a623;text-decoration:none;font-weight:600; }

        @media (max-width:640px) {
          .products-grid { grid-template-columns:1fr 1fr; }
          .product-img   { height:120px;font-size:36px; }
          .hero    { padding:32px 16px 24px; }
          .section { padding:0 16px 40px; }
          .wa-main-btn { font-size:13px;padding:12px 20px; }
        }
        @media (max-width:400px) {
          .products-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="ambient">
        <div className="orb o1"/><div className="orb o2"/>
      </div>

      <div className="topbar">
        <div className="topbar-logo">
          <div className="topbar-icon">🛒</div>
          <span className="topbar-vendify">Vendify</span>
        </div>
        <div className="topbar-cta">
          Vous vendez aussi ? <a href="/register">Créez votre boutique →</a>
        </div>
      </div>

      <div className="hero">
        <div style={{ fontSize:48, marginBottom:12 }}>🏪</div>
        <h1 className="hero-shop-name">{p.shop_name}</h1>
        <p className="hero-sub">Boutique de {p.full_name}</p>
        <div className="hero-badges">
          <span className="badge badge-green">● En ligne</span>
          <span className="badge badge-gold">📦 {items.length} produit{items.length > 1 ? 's' : ''}</span>
          {p.pays && <span className="badge badge-gray">📍 {p.pays}</span>}
          {p.plan === 'premium' && <span className="badge badge-gold">⚡ Boutique Premium</span>}
        </div>
        {waPhone && (
          <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent("Bonjour ! J'ai vu votre boutique Vendify et je voudrais commander 🛒")}`}
            className="wa-main-btn" target="_blank" rel="noopener noreferrer">
            <span style={{ fontSize:20 }}>💬</span>
            Commander via WhatsApp
          </a>
        )}
      </div>

      <div className="section">
        <h2 className="section-title">
          <span>Nos produits</span>
          <span style={{ fontSize:13, fontWeight:400, color:'#717a8f' }}>{items.length} disponible{items.length > 1 ? 's' : ''}</span>
        </h2>

        {items.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:8 }}>Aucun produit disponible</div>
            <div style={{ fontSize:13 }}>Revenez bientôt !</div>
          </div>
        ) : (
          <div className="products-grid">
            {items.map((product: any, i: number) => {
              const waMsg = `Bonjour ! Je veux commander : *${product.nom}* (${formatCFA(product.prix_vente)}) 🛒`
              const waUrl = waPhone
                ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`
                : `https://wa.me/?text=${encodeURIComponent(waMsg)}`
              return (
                <div key={product.id} className="product-card" style={{ animationDelay:`${i * 0.06}s` }}>
                  <div className="product-img">
                    {product.image_url ? <img src={product.image_url} alt={product.nom}/> : <span>📦</span>}
                    <div className="stock-badge" style={{ color: product.stock > 5 ? '#2ecc87' : '#f5a623' }}>
                      {product.stock > 5 ? '● En stock' : `⚠ ${product.stock} restant${product.stock > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <div className="product-body">
                    <div className="product-name">{product.nom}</div>
                    {product.description && <div className="product-desc">{product.description}</div>}
                    <div className="product-footer">
                      <div className="product-price">{formatCFA(product.prix_vente)}</div>
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="order-btn">
                        💬 Commander
                      </a>
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