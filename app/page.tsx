'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #f0ede8; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes float    { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes shimmer  { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes pulse    { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 32px; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.3s;
        }
        .nav.scrolled {
          background: rgba(10,10,10,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-icon { width: 38px; height: 38px; background: linear-gradient(135deg, #f5a623, #ffcc6b); border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 4px 16px rgba(245,166,35,0.35); }
        .nav-logo-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 900; background: linear-gradient(135deg, #f5a623, #ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-links { display: flex; align-items: center; gap: 8px; }
        .nav-link { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #717a8f; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #f0ede8; }
        .nav-btn-outline { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); font-size: 13px; font-weight: 600; color: #c8cdd8; text-decoration: none; transition: all 0.15s; }
        .nav-btn-outline:hover { border-color: rgba(245,166,35,0.4); color: #f5a623; }
        .nav-btn { padding: 9px 20px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .nav-btn:hover { box-shadow: 0 4px 16px rgba(245,166,35,0.35); transform: translateY(-1px); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 120px 24px 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(255,127,80,0.06) 0%, transparent 60%);
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.2);
          border-radius: 100px; padding: 6px 16px;
          font-size: 12px; font-weight: 700; color: #f5a623; letter-spacing: 0.3px;
          margin-bottom: 28px; animation: fadeIn 0.5s ease;
          position: relative; z-index: 1;
        }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f5a623; animation: pulse 2s infinite; }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 7vw, 76px);
          font-weight: 900; line-height: 1.05; letter-spacing: -2px;
          margin-bottom: 24px;
          animation: slideUp 0.5s 0.1s ease both;
          position: relative; z-index: 1;
        }
        .hero-title-gold {
          background: linear-gradient(135deg, #f5a623 0%, #ffcc6b 50%, #ff9d00 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-title-italic { font-style: italic; color: #c8cdd8; }
        .hero-sub {
          font-size: clamp(15px, 2vw, 18px); color: #666; line-height: 1.7;
          max-width: 520px; margin: 0 auto 40px;
          animation: slideUp 0.5s 0.15s ease both;
          position: relative; z-index: 1;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
          animation: slideUp 0.5s 0.2s ease both;
          position: relative; z-index: 1;
          margin-bottom: 56px;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000; border-radius: 14px; padding: 15px 28px;
          font-size: 15px; font-weight: 700; text-decoration: none;
          transition: all 0.2s; box-shadow: 0 8px 28px rgba(245,166,35,0.3);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(245,166,35,0.4); }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          color: #c8cdd8; border-radius: 14px; padding: 15px 28px;
          font-size: 15px; font-weight: 600; text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #f0ede8; }

        /* SOCIAL PROOF */
        .social-proof {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;
          animation: slideUp 0.5s 0.25s ease both;
          position: relative; z-index: 1;
        }
        .social-avatars { display: flex; }
        .social-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0a0a0a; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .social-text { font-size: 13px; color: #555; }
        .social-text strong { color: #c8cdd8; }
        .social-stars { color: #f5a623; font-size: 13px; letter-spacing: -1px; }

        /* FLOATING CARDS */
        .floating-cards {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .floating-card {
          position: absolute; background: #161a22; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 14px 16px;
          font-size: 12px; animation: float 4s ease-in-out infinite;
        }

        /* STATS BAR */
        .stats-bar {
          background: #111; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 28px 24px;
        }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
        .stat-val { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 900; color: #f5a623; margin-bottom: 4px; }
        .stat-label { font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }

        /* FEATURES */
        .section { max-width: 1100px; margin: 0 auto; padding: 80px 24px; }
        .section-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.15); border-radius: 100px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #f5a623; margin-bottom: 16px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 44px); font-weight: 900; letter-spacing: -1px; margin-bottom: 16px; }
        .section-sub { font-size: 15px; color: #666; line-height: 1.7; max-width: 520px; margin-bottom: 48px; }

        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feature-card {
          background: #111; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px;
          transition: all 0.25s;
        }
        .feature-card:hover { border-color: rgba(245,166,35,0.2); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); }
        .feature-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 18px; }
        .feature-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: #666; line-height: 1.6; }

        /* HOW IT WORKS */
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; }
        .steps::before { content: ''; position: absolute; top: 28px; left: calc(16.6% + 16px); right: calc(16.6% + 16px); height: 1px; background: linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent); }
        .step { text-align: center; }
        .step-num { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #f5a623, #ffcc6b); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 900; color: #000; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(245,166,35,0.3); }
        .step-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .step-desc { font-size: 13px; color: #666; line-height: 1.6; }

        /* PRICING */
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 700px; margin: 0 auto; }
        .plan-card { background: #111; border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 32px; }
        .plan-card.featured { background: linear-gradient(135deg, rgba(245,166,35,0.06), rgba(255,204,107,0.02)); border-color: rgba(245,166,35,0.25); position: relative; overflow: hidden; }
        .plan-card.featured::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #f5a623, #ffcc6b); }
        .plan-tag { display: inline-flex; align-items: center; gap: 5px; background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); border-radius: 100px; padding: 3px 12px; font-size: 10px; font-weight: 800; color: #f5a623; margin-bottom: 20px; }
        .plan-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 8px; }
        .plan-price { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900; color: #f5a623; margin-bottom: 4px; }
        .plan-price span { font-size: 16px; color: #555; }
        .plan-sub { font-size: 12px; color: #555; margin-bottom: 24px; }
        .plan-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .plan-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #a0a8b8; }
        .plan-check { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
        .plan-check.ok { background: rgba(46,204,135,0.1); color: #2ecc87; }
        .plan-check.no { background: rgba(255,255,255,0.04); color: #3a4255; }
        .plan-btn { display: block; text-align: center; padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .plan-btn.primary { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; box-shadow: 0 4px 16px rgba(245,166,35,0.25); }
        .plan-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,166,35,0.35); }
        .plan-btn.outline { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #717a8f; }
        .plan-btn.outline:hover { border-color: rgba(255,255,255,0.2); color: #c8cdd8; }

        /* COUNTRIES */
        .countries { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .country { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .country-flag { font-size: 36px; }
        .country-name { font-size: 11px; color: #555; font-weight: 600; }

        /* CTA */
        .cta-section { background: linear-gradient(135deg, #111 0%, #161005 50%, #111 100%); border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 80px 24px; text-align: center; position: relative; overflow: hidden; }
        .cta-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(245,166,35,0.06) 0%, transparent 70%); }

        /* FOOTER */
        .footer { background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.05); padding: 48px 24px 32px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
        .footer-brand-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #f5a623, #ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
        .footer-brand-desc { font-size: 13px; color: #555; line-height: 1.6; max-width: 280px; }
        .footer-col-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #3a4255; margin-bottom: 14px; }
        .footer-link { display: block; font-size: 13px; color: #555; text-decoration: none; margin-bottom: 8px; transition: color 0.15s; }
        .footer-link:hover { color: #f5a623; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .footer-copy { font-size: 12px; color: #3a4255; }
        .footer-flags { display: flex; gap: 8px; font-size: 18px; }

        /* MOBILE */
        @media (max-width: 768px) {
          .nav { padding: 0 16px; }
          .nav-links .nav-link { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr; gap: 24px; }
          .steps::before { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .section { padding: 56px 16px; }
          .hero { padding: 100px 16px 60px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">🛒</div>
          <span className="nav-logo-name">Vendify</span>
        </a>
        <div className="nav-links">
          <a href="/boutiques" className="nav-link">Boutiques</a>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#tarifs" className="nav-link">Tarifs</a>
          <a href="/login" className="nav-btn-outline">Se connecter</a>
          <a href="/register" className="nav-btn">Commencer →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />

        {/* Floating cards décoratifs */}
        <div className="floating-cards">
          <div className="floating-card" style={{ top: '20%', left: '5%', animationDelay: '0s', animationDuration: '5s' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>🛍</div>
            <div style={{ color: '#c8cdd8', fontWeight: 600 }}>Nouvelle commande</div>
            <div style={{ color: '#555', fontSize: 11 }}>Boutique Amara · 15 000 FCFA</div>
          </div>
          <div className="floating-card" style={{ top: '30%', right: '4%', animationDelay: '1s', animationDuration: '6s' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>📊</div>
            <div style={{ color: '#f5a623', fontWeight: 700, fontSize: 20, fontFamily: 'Playfair Display,serif' }}>+127 000</div>
            <div style={{ color: '#555', fontSize: 11 }}>FCFA ce mois</div>
          </div>
          <div className="floating-card" style={{ bottom: '25%', left: '3%', animationDelay: '2s', animationDuration: '4.5s' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <div>
                <div style={{ color: '#25d366', fontWeight: 700, fontSize: 12 }}>WhatsApp</div>
                <div style={{ color: '#555', fontSize: 11 }}>Reçu envoyé ✓</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-badge">
          <div className="hero-badge-dot" />
          La plateforme N°1 des vendeurs africains
        </div>

        <h1 className="hero-title">
          Votre boutique en ligne<br />
          <span className="hero-title-gold">en 2 minutes</span><br />
          <span className="hero-title-italic">chrono.</span>
        </h1>

        <p className="hero-sub">
          Vendez sur Instagram, WhatsApp et TikTok avec une vraie boutique professionnelle.
          Gérez vos commandes, stocks et paiements — en FCFA, depuis votre téléphone.
        </p>

        <div className="hero-actions">
          <a href="/register" className="btn-primary">
            🛒 Créer ma boutique gratuitement
          </a>
          <a href="/boutiques" className="btn-secondary">
            🌍 Voir les boutiques →
          </a>
        </div>

        <div className="social-proof">
          <div className="social-avatars">
            {['🧕', '👨🏿', '👩🏾', '🧑🏿'].map((e, i) => (
              <div key={i} className="social-avatar" style={{ background: ['#1a1205', '#0f1a10', '#1a0f10', '#0f0f1a'][i] }}>{e}</div>
            ))}
          </div>
          <div>
            <div className="social-stars">★★★★★</div>
            <div className="social-text"><strong>+500 vendeurs</strong> nous font confiance</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stats-inner">
          {[
            { val: '500+', label: 'Vendeurs actifs' },
            { val: '5', label: 'Pays couverts' },
            { val: '10k+', label: 'Commandes traitées' },
            { val: '3 000', label: 'FCFA / mois seulement' },
          ].map(s => (
            <div key={s.label}>
              <div className="stat-val">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-badge">✦ Fonctionnalités</div>
        <h2 className="section-title">Tout ce dont vous<br />avez besoin pour vendre</h2>
        <p className="section-sub">Des outils pensés pour les vendeurs africains — simples, rapides, efficaces.</p>

        <div className="features-grid">
          {[
            { icon: '🏪', bg: 'rgba(245,166,35,0.1)', name: 'Boutique publique', desc: 'Une vraie page en ligne avec vos produits, photos et panier. Partagez le lien sur Instagram, WhatsApp, TikTok.' },
            { icon: '📦', bg: 'rgba(34,197,94,0.08)', name: 'Gestion des commandes', desc: 'Toutes vos commandes centralisées. Statuts, historique, filtres. Fini les commandes perdues dans WhatsApp.' },
            { icon: '💬', bg: 'rgba(37,211,102,0.08)', name: 'WhatsApp natif', desc: 'Notifications automatiques, reçus partagés, lien boutique. WhatsApp reste votre meilleur outil — on l\'intègre.' },
            { icon: '📊', bg: 'rgba(99,102,241,0.08)', name: 'Statistiques avancées', desc: 'Chiffre d\'affaires, bénéfices, top produits, évolution mensuelle. Sachez enfin combien vous gagnez vraiment.' },
            { icon: '🏷', bg: 'rgba(255,68,68,0.08)', name: 'Prix promotionnels', desc: 'Créez des promos avec prix barré. Vos clients voient l\'économie réalisée — ça convertit bien mieux.' },
            { icon: '🌍', bg: 'rgba(245,166,35,0.08)', name: 'Multi-pays', desc: 'CI · SN · BJ · CM · TG. Wave, Orange Money, MTN MoMo supportés. 100% adapté à l\'Afrique de l\'Ouest.' },
          ].map(f => (
            <div key={f.name} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-badge">🚀 Comment ça marche</div>
          <h2 className="section-title" style={{ marginBottom: 56 }}>Lancez-vous en 3 étapes</h2>
          <div className="steps">
            {[
              { n: '1', title: 'Créez votre compte', desc: 'Inscription gratuite en 2 minutes. Renseignez votre boutique et commencez à ajouter vos produits.' },
              { n: '2', title: 'Ajoutez vos produits', desc: 'Photos, prix, stock, catégories. Votre boutique est automatiquement en ligne et partageable.' },
              { n: '3', title: 'Recevez des commandes', desc: 'Partagez votre lien boutique. Les clients commandent, vous êtes notifié sur WhatsApp. C\'est tout.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYS */}
      <section className="section" style={{ textAlign: 'center', padding: '56px 24px' }}>
        <div className="section-badge">🌍 Disponible dans</div>
        <h2 className="section-title" style={{ marginBottom: 40 }}>5 pays d'Afrique de l'Ouest</h2>
        <div className="countries">
          {[
            { flag: '🇨🇮', name: "Côte d'Ivoire" },
            { flag: '🇸🇳', name: 'Sénégal' },
            { flag: '🇧🇯', name: 'Bénin' },
            { flag: '🇨🇲', name: 'Cameroun' },
            { flag: '🇹🇬', name: 'Togo' },
          ].map(c => (
            <div key={c.name} className="country">
              <div className="country-flag">{c.flag}</div>
              <div className="country-name">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="tarifs" style={{ textAlign: 'center' }}>
        <div className="section-badge">💰 Tarifs</div>
        <h2 className="section-title">Simple et transparent</h2>
        <p className="section-sub" style={{ margin: '0 auto 48px' }}>Commencez gratuitement. Passez Premium quand vous êtes prêt.</p>

        <div className="pricing-grid">
          {/* Gratuit */}
          <div className="plan-card">
            <div className="plan-name">Gratuit</div>
            <div className="plan-price">0 <span>FCFA</span></div>
            <div className="plan-sub">Pour démarrer</div>
            <div className="plan-features">
              {[
                { t: '20 commandes / mois', ok: true },
                { t: '5 produits max', ok: true },
                { t: 'Gestion des commandes', ok: true },
                { t: 'Boutique publique', ok: false },
                { t: 'Statistiques avancées', ok: false },
                { t: 'Export Excel', ok: false },
              ].map(f => (
                <div key={f.t} className="plan-feature">
                  <div className={`plan-check ${f.ok ? 'ok' : 'no'}`}>{f.ok ? '✓' : '✕'}</div>
                  <span style={{ color: f.ok ? '#a0a8b8' : '#3a4255', textDecoration: f.ok ? 'none' : 'line-through' }}>{f.t}</span>
                </div>
              ))}
            </div>
            <a href="/register" className="plan-btn outline">Commencer gratuitement</a>
          </div>

          {/* Premium */}
          <div className="plan-card featured">
            <div className="plan-tag">⚡ RECOMMANDÉ</div>
            <div className="plan-name">Premium</div>
            <div className="plan-price">3 000 <span>FCFA</span></div>
            <div className="plan-sub">par mois · sans engagement</div>
            <div className="plan-features">
              {[
                { t: 'Commandes illimitées', ok: true },
                { t: 'Produits illimités', ok: true },
                { t: 'Boutique publique en ligne', ok: true },
                { t: 'Panier + commandes en ligne', ok: true },
                { t: 'Bannière personnalisable', ok: true },
                { t: 'Catégories + prix promo', ok: true },
                { t: 'Statistiques avancées', ok: true },
                { t: 'Export Excel', ok: true },
                { t: 'Support prioritaire', ok: true },
              ].map(f => (
                <div key={f.t} className="plan-feature">
                  <div className="plan-check ok">✓</div>
                  {f.t}
                </div>
              ))}
            </div>
            <a href="/register" className="plan-btn primary">⚡ Commencer Premium</a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>
            Prêt à vendre<br />
            <span style={{ background: 'linear-gradient(135deg,#f5a623,#ffcc6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              comme un pro ?
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#666', marginBottom: 36, lineHeight: 1.6 }}>
            Rejoignez +500 vendeurs qui utilisent Vendify pour gérer leur business depuis leur téléphone.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" className="btn-primary" style={{ fontSize: 16, padding: '16px 32px' }}>
              🛒 Créer ma boutique — C'est gratuit
            </a>
            <a href="/boutiques" className="btn-secondary">
              Voir les boutiques →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand-name">Vendify</div>
            <div className="footer-brand-desc">
              La plateforme de gestion et de vente en ligne pour les vendeurs d'Afrique de l'Ouest.
            </div>
          </div>
          <div>
            <div className="footer-col-title">Produit</div>
            <a href="/boutiques" className="footer-link">Boutiques</a>
            <a href="#features" className="footer-link">Fonctionnalités</a>
            <a href="#tarifs" className="footer-link">Tarifs</a>
            <a href="/register" className="footer-link">Créer un compte</a>
          </div>
          <div>
            <div className="footer-col-title">Compte</div>
            <a href="/login" className="footer-link">Se connecter</a>
            <a href="/register" className="footer-link">S'inscrire</a>
            <a href="/dashboard" className="footer-link">Dashboard</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 Vendify · Tous droits réservés</div>
          <div className="footer-flags">🇨🇮 🇸🇳 🇧🇯 🇨🇲 🇹🇬</div>
        </div>
      </footer>
    </>
  )
}