'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisibleSections(prev => new Set([...prev, e.target.id]))
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 4), 3500)
    return () => clearInterval(t)
  }, [])

  const features = [
    {
      icon: '🛒',
      title: 'Boutique en ligne en 2 min',
      desc: 'Un lien unique à partager sur Instagram, WhatsApp et TikTok. Vos clients commandent directement depuis leur téléphone, sans application.',
      color: '#f5a623',
      screen: [
        { type: 'header', text: 'Boutique Aminata Mode 🌟' },
        { type: 'product', name: 'Robe Wax Premium', price: '12 500 FCFA', promo: '15 000 FCFA', img: '👗' },
        { type: 'product', name: 'Boubou Brodé', price: '18 000 FCFA', img: '🥻' },
        { type: 'product', name: 'Ensemble Bazin', price: '22 000 FCFA', img: '👘' },
        { type: 'cart', text: '🛒 Panier (2)  →  Commander' },
      ],
    },
    {
      icon: '📊',
      title: 'Gérez tout depuis votre téléphone',
      desc: "Commandes, stocks, paiements — tout en temps réel. Recevez des notifications WhatsApp à chaque nouvelle commande. Plus besoin de carnet.",
      color: '#2ecc87',
      screen: [
        { type: 'header', text: '📊 Dashboard — Aujourd\'hui' },
        { type: 'stat', label: 'Commandes', val: '12', delta: '+3 aujourd\'hui' },
        { type: 'stat', label: 'CA du jour', val: '87 500', delta: '+12%' },
        { type: 'order', client: 'Fatou K.', amount: '15 000 FCFA', status: 'Nouveau', color: '#f5a623' },
        { type: 'order', client: 'Aminata D.', amount: '8 500 FCFA', status: 'Payé', color: '#2ecc87' },
      ],
    },
    {
      icon: '🛵',
      title: 'Livraison intégrée',
      desc: 'Trouvez un livreur en quelques clics et suivez vos livraisons en temps réel. Les livreurs de votre ville voient vos demandes et vous contactent directement sur WhatsApp.',
      color: '#a78bfa',
      screen: [
        { type: 'header', text: '🛵 Livraisons — En cours' },
        { type: 'order', client: 'Fatou K.', amount: 'Cocody → Plateau', status: 'En route', color: '#2ecc87' },
        { type: 'order', client: 'Aminata D.', amount: 'Yopougon → Marcory', status: 'Assigné', color: '#4d8cff' },
        { type: 'order', client: 'Ibrahim T.', amount: 'Cocody → Abobo', status: 'Livré ✓', color: '#a78bfa' },
        { type: 'cart', text: '+ Demander une livraison' },
      ],
    },
    {
      icon: '📱',
      title: 'WhatsApp intégré & notifications',
      desc: 'Un clic pour envoyer le récapitulatif de commande au client sur WhatsApp. Suivi des statuts, relances automatiques, reçus PDF.',
      color: '#25d366',
      screen: [
        { type: 'header', text: '💬 Message WhatsApp' },
        { type: 'wa', lines: ['🛒 Nouvelle commande !', '👤 Konan Michel', '📦 Robe Wax Premium x1', '💰 Total : 12 500 FCFA', '✅ Statut : Confirmé'] },
      ],
    },
  ]

  const testimonials = [
    { name: 'Aminata Diallo', role: 'Vendeuse mode — Abidjan', avatar: '👩🏾', text: 'Avant je notais tout dans un carnet. Maintenant mes clientes commandent directement sur ma boutique et je reçois une notification WhatsApp. C\'est révolutionnaire !', stars: 5, revenue: '+340% de ventes' },
    { name: 'Moussa Konaté', role: 'Électronique — Dakar', avatar: '👨🏾', text: 'En 1 semaine j\'ai eu 47 commandes depuis mon lien Instagram. Le dashboard me montre exactement ce qui se vend. Je recommande à tous les vendeurs.', stars: 5, revenue: '47 cmd en 7 jours' },
    { name: 'Fatoumata Bah', role: 'Bijoux & Beauté — Cotonou', avatar: '👩🏾‍🦱', text: 'La boutique en ligne avec le panier c\'est ce dont j\'avais besoin. Mes clientes du Sénégal et du Bénin commandent sans problème. Le prix est très abordable.', stars: 5, revenue: '3 pays couverts' },
    { name: 'Ibrahim Touré', role: 'Alimentation — Douala', avatar: '👨🏿', text: 'Le partage WhatsApp automatique m\'économise des heures chaque semaine. Mes commandes sont organisées par statut, c\'est propre et professionnel.', stars: 5, revenue: '2h économisées/jour' },
  ]

  const comparaison = [
    { feature: 'Boutique en ligne', vendify: true, carnet: false, excel: false },
    { feature: 'Commandes WhatsApp', vendify: true, carnet: true, excel: false },
    { feature: 'Stocks en temps réel', vendify: true, carnet: false, false: false },
    { feature: 'Notifications automatiques', vendify: true, carnet: false, excel: false },
    { feature: 'Stats & CA', vendify: true, carnet: false, excel: true },
    { feature: 'Reçus PDF', vendify: true, carnet: false, excel: false },
    { feature: 'Livraison intégrée', vendify: true, carnet: false, excel: false },
    { feature: 'Prix en FCFA', vendify: true, carnet: true, excel: true },
    { feature: 'Accessible depuis mobile', vendify: true, carnet: true, excel: false },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #070809; font-family: 'DM Sans', sans-serif; color: #edeae4; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        @keyframes fadeUp   { from { opacity: 0; transform: translateY(32px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes float    { 0%,100% { transform: translateY(0px) rotate(0deg) } 50% { transform: translateY(-8px) rotate(1deg) } }
        @keyframes floatR   { 0%,100% { transform: translateY(0px) rotate(0deg) } 50% { transform: translateY(-6px) rotate(-1deg) } }
        @keyframes pulse    { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.7; transform: scale(0.95) } }
        @keyframes shimmer  { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
        @keyframes ticker   { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes glow     { 0%,100% { box-shadow: 0 0 20px rgba(245,166,35,0.3) } 50% { box-shadow: 0 0 40px rgba(245,166,35,0.6) } }
        @keyframes slideIn  { from { opacity: 0; transform: translateX(-20px) } to { opacity: 1; transform: translateX(0) } }

        [data-animate] { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        [data-animate].visible { opacity: 1; transform: translateY(0); }
        [data-animate].delay-1 { transition-delay: 0.1s; }
        [data-animate].delay-2 { transition-delay: 0.2s; }
        [data-animate].delay-3 { transition-delay: 0.3s; }
        [data-animate].delay-4 { transition-delay: 0.4s; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 40px; height: 70px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.4s;
        }
        .nav.scrolled {
          background: rgba(7,8,9,0.92);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #f5a623, #ffcc6b); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 14px rgba(245,166,35,0.4); }
        .nav-logo-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 21px; font-weight: 800; color: #edeae4; }
        .nav-center { display: flex; align-items: center; gap: 4px; }
        .nav-link { padding: 7px 14px; border-radius: 9px; font-size: 13px; font-weight: 500; color: #717a8f; text-decoration: none; transition: all 0.15s; }
        .nav-link:hover { color: #edeae4; background: rgba(255,255,255,0.05); }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-login { padding: 8px 18px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.1); font-size: 13px; font-weight: 600; color: #a0a8b8; text-decoration: none; transition: all 0.15s; }
        .nav-login:hover { border-color: rgba(245,166,35,0.3); color: #f5a623; }
        .nav-cta { padding: 9px 20px; background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; border-radius: 9px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .nav-cta:hover { box-shadow: 0 4px 20px rgba(245,166,35,0.4); transform: translateY(-1px); }

        /* TICKER */
        .ticker { background: linear-gradient(135deg, #f5a623, #ffcc6b); padding: 10px 0; overflow: hidden; }
        .ticker-track { display: flex; gap: 0; white-space: nowrap; animation: ticker 20s linear infinite; }
        .ticker-item { display: inline-flex; align-items: center; gap: 8px; padding: 0 32px; font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
        .ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.3); }

        /* HERO */
        .hero {
          min-height: 100vh; padding: 140px 24px 80px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 100% 60% at 50% -5%, rgba(245,166,35,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 85% 70%, rgba(245,100,35,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 15% 60%, rgba(37,211,102,0.04) 0%, transparent 60%);
        }
        .hero-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 200px 200px;
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 0%, transparent 100%);
          mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 0%, transparent 100%);
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,166,35,0.07); border: 1px solid rgba(245,166,35,0.18);
          border-radius: 100px; padding: 7px 18px;
          font-size: 12px; font-weight: 700; color: #f5a623; letter-spacing: 0.5px;
          margin-bottom: 28px; position: relative; z-index: 1;
          animation: fadeIn 0.6s ease both;
        }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #f5a623; animation: pulse 1.8s infinite; flex-shrink: 0; }

        .hero-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(42px, 7.5vw, 84px);
          font-weight: 800; line-height: 1.02; letter-spacing: -2.5px;
          margin-bottom: 24px; position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .hero-title em {
          font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400;
          background: linear-gradient(135deg, #f5a623 0%, #ffdd80 50%, #ff9500 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-title .muted { color: #3a4255; }

        .hero-sub {
          font-size: clamp(15px, 2vw, 18px); color: #5a6070; line-height: 1.75;
          max-width: 540px; margin: 0 auto 44px;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.2s ease both;
        }
        .hero-sub strong { color: #a0a8b8; font-weight: 600; }

        .hero-ctas {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
          margin-bottom: 60px; position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.3s ease both;
        }
        .btn-gold {
          display: inline-flex; align-items: center; gap: 9px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000; border-radius: 12px; padding: 15px 28px;
          font-size: 15px; font-weight: 700; text-decoration: none;
          transition: all 0.25s; box-shadow: 0 8px 30px rgba(245,166,35,0.3);
          animation: glow 3s infinite;
        }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(245,166,35,0.45); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: #a0a8b8; border-radius: 12px; padding: 15px 28px;
          font-size: 15px; font-weight: 600; text-decoration: none;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); color: #edeae4; }

        .hero-trust {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: center;
          position: relative; z-index: 1; animation: fadeUp 0.7s 0.4s ease both;
        }
        .trust-avatars { display: flex; }
        .trust-avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #070809; margin-left: -9px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .trust-text { font-size: 13px; color: #404550; }
        .trust-text strong { color: #a0a8b8; }
        .trust-stars { color: #f5a623; font-size: 12px; }
        .trust-sep { width: 1px; height: 28px; background: rgba(255,255,255,0.08); }

        /* FLOATING PHONE MOCKUPS */
        .hero-mockups {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
        }
        @media (max-width: 1024px) { .hero-mockups { display: none; } }
        .mockup-left {
          position: absolute; left: 3%; top: 20%;
          animation: float 5s ease-in-out infinite;
        }
        .mockup-right {
          position: absolute; right: 3%; top: 28%;
          animation: floatR 6s ease-in-out infinite;
        }
        .mockup-phone {
          width: 180px; background: #111418; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 14px 10px; box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }
        .mockup-phone-bar { width: 60px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; margin: 0 auto 12px; }
        .mockup-notif { background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2); border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; }
        .mockup-notif-title { font-size: 9px; font-weight: 700; color: #25d366; margin-bottom: 2px; }
        .mockup-notif-text { font-size: 8px; color: #5a6070; }
        .mockup-stat { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .mockup-stat-item { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px; flex: 1; margin: 0 3px; text-align: center; }
        .mockup-stat-val { font-size: 13px; font-weight: 800; color: #f5a623; }
        .mockup-stat-lbl { font-size: 7px; color: #404550; }
        .mockup-order { display: flex; align-items: center; gap: 6px; padding: 7px 8px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 5px; }
        .mockup-order-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mockup-order-name { font-size: 8px; font-weight: 600; flex: 1; }
        .mockup-order-amount { font-size: 8px; color: #f5a623; font-weight: 700; }

        /* STATS BAR */
        .stats-strip { background: #0d0f11; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 40px 24px; }
        .stats-inner { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
        .stat-item { text-align: center; padding: 0 20px; border-right: 1px solid rgba(255,255,255,0.05); }
        .stat-item:last-child { border-right: none; }
        .stat-val { font-family: 'Bricolage Grotesque', sans-serif; font-size: 40px; font-weight: 800; background: linear-gradient(135deg,#f5a623,#ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-size: 12px; color: #404550; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

        /* SECTIONS */
        .section { max-width: 1100px; margin: 0 auto; padding: 100px 24px; }
        .section-label { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,166,35,0.07); border: 1px solid rgba(245,166,35,0.15); border-radius: 100px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #f5a623; letter-spacing: 0.5px; margin-bottom: 20px; text-transform: uppercase; }
        .section-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(30px, 4.5vw, 52px); font-weight: 800; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 16px; }
        .section-h2 em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #f5a623; }
        .section-p { font-size: 16px; color: #5a6070; line-height: 1.75; max-width: 520px; }

        /* FEATURES TABS */
        .features-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .features-tabs { display: flex; flex-direction: column; gap: 12px; }
        .feature-tab { padding: 20px 22px; border-radius: 16px; border: 1px solid transparent; cursor: pointer; transition: all 0.25s; background: rgba(255,255,255,0.02); }
        .feature-tab:hover { background: rgba(255,255,255,0.04); }
        .feature-tab.active { background: rgba(245,166,35,0.07); border-color: rgba(245,166,35,0.2); }
        .feature-tab-top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .feature-tab-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; background: rgba(255,255,255,0.05); flex-shrink: 0; }
        .feature-tab.active .feature-tab-icon { background: rgba(245,166,35,0.15); }
        .feature-tab-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 700; }
        .feature-tab-desc { font-size: 13px; color: #404550; line-height: 1.6; display: none; }
        .feature-tab.active .feature-tab-desc { display: block; color: #717a8f; }
        .feature-progress { height: 2px; background: rgba(245,166,35,0.15); border-radius: 2px; margin-top: 10px; display: none; overflow: hidden; }
        .feature-tab.active .feature-progress { display: block; }
        .feature-progress-fill { height: 100%; background: linear-gradient(90deg,#f5a623,#ffcc6b); border-radius: 2px; animation: shimmer 3.5s linear infinite; background-size: 400px 100%; }

        /* PHONE SCREEN PREVIEW */
        .phone-preview { position: relative; display: flex; justify-content: center; }
        .phone-outer { width: 280px; background: #0d1117; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 36px; padding: 16px 12px 20px; box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset; position: relative; }
        .phone-notch { width: 80px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; margin: 0 auto 14px; }
        .phone-screen { background: #111418; border-radius: 24px; overflow: hidden; min-height: 320px; }
        .phone-screen-header { background: linear-gradient(135deg,#1a1e26,#141820); padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .phone-screen-header-text { font-size: 13px; font-weight: 700; color: #edeae4; }
        .phone-screen-body { padding: 12px; }
        .screen-product { display: flex; align-items: center; gap: 10px; padding: 9px 10px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.04); }
        .screen-product-img { width: 36px; height: 36px; border-radius: 8px; background: rgba(245,166,35,0.1); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .screen-product-name { font-size: 11px; font-weight: 600; flex: 1; }
        .screen-product-price { font-size: 11px; font-weight: 700; color: #f5a623; }
        .screen-product-promo { font-size: 9px; color: #3a4255; text-decoration: line-through; }
        .screen-cart { margin-top: 10px; background: linear-gradient(135deg,#f5a623,#ffcc6b); border-radius: 10px; padding: 10px 14px; text-align: center; font-size: 11px; font-weight: 700; color: #000; }
        .screen-stat { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .screen-stat-card { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 12px; }
        .screen-stat-val { font-size: 18px; font-weight: 800; color: #f5a623; }
        .screen-stat-lbl { font-size: 9px; color: #404550; }
        .screen-stat-delta { font-size: 9px; color: #2ecc87; }
        .screen-order { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 6px; }
        .screen-order-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .screen-order-name { font-size: 10px; font-weight: 600; flex: 1; }
        .screen-order-amount { font-size: 10px; color: #f5a623; font-weight: 700; }
        .screen-order-badge { font-size: 8px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .screen-wa { background: #0d1a0e; border-radius: 10px; padding: 12px; margin: 8px 0; }
        .screen-wa-line { font-size: 10px; color: #c8cdd8; margin-bottom: 4px; line-height: 1.5; }
        .screen-wa-line:first-child { font-weight: 700; color: #25d366; }

        /* TESTIMONIALS */
        .testimonials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .testi-card { background: #0d0f11; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 24px; transition: all 0.25s; }
        .testi-card:hover { border-color: rgba(245,166,35,0.2); transform: translateY(-2px); }
        .testi-stars { color: #f5a623; font-size: 12px; margin-bottom: 14px; }
        .testi-text { font-size: 14px; color: #717a8f; line-height: 1.7; margin-bottom: 18px; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .testi-name { font-size: 13px; font-weight: 700; }
        .testi-role { font-size: 11px; color: #404550; }
        .testi-badge { margin-left: auto; background: rgba(46,204,135,0.08); border: 1px solid rgba(46,204,135,0.2); border-radius: 20px; padding: 3px 10px; font-size: 10px; font-weight: 700; color: #2ecc87; white-space: nowrap; }

        /* COMPARAISON */
        .compare-table { width: 100%; border-collapse: collapse; }
        .compare-head th { padding: 14px 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #404550; }
        .compare-head th:first-child { text-align: left; }
        .compare-head .vendify-col { color: #f5a623; background: rgba(245,166,35,0.05); border-top: 2px solid rgba(245,166,35,0.3); border-left: 1px solid rgba(245,166,35,0.1); border-right: 1px solid rgba(245,166,35,0.1); border-radius: 0; }
        .compare-row td { padding: 13px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; text-align: center; color: #5a6070; }
        .compare-row td:first-child { text-align: left; color: #a0a8b8; font-weight: 500; }
        .compare-row .vendify-col { background: rgba(245,166,35,0.03); border-left: 1px solid rgba(245,166,35,0.08); border-right: 1px solid rgba(245,166,35,0.08); }
        .check-yes { color: #2ecc87; font-size: 16px; }
        .check-no  { color: #252830; font-size: 16px; }

        /* STEPS */
        .steps-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .step-card { background: #0d0f11; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; transition: all 0.25s; }
        .step-card:hover { border-color: rgba(245,166,35,0.2); transform: translateY(-3px); }
        .step-card::before { content: attr(data-num); position: absolute; right: 16px; top: 12px; font-family: 'Bricolage Grotesque', sans-serif; font-size: 72px; font-weight: 900; color: rgba(255,255,255,0.03); line-height: 1; }
        .step-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
        .step-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 10px; }
        .step-desc { font-size: 13px; color: #404550; line-height: 1.65; }

        /* PRICING */
        .pricing-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 780px; margin: 0 auto; }
        .plan { background: #0d0f11; border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 32px; }
        .plan.featured { border-color: rgba(245,166,35,0.3); background: linear-gradient(145deg, rgba(245,166,35,0.06), rgba(10,10,10,0)); position: relative; }
        .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg,#f5a623,#ffcc6b); color: #000; font-size: 10px; font-weight: 800; padding: 4px 16px; border-radius: 100px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; }
        .plan-tier { font-size: 11px; font-weight: 700; color: #404550; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .plan-price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 44px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .plan-price span { font-size: 15px; font-weight: 500; color: #5a6070; }
        .plan-period { font-size: 12px; color: #404550; margin-bottom: 24px; }
        .plan-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }
        .plan-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .plan-feat { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #a0a8b8; }
        .plan-feat-check { width: 18px; height: 18px; border-radius: 5px; background: rgba(46,204,135,0.1); border: 1px solid rgba(46,204,135,0.2); display: flex; align-items: center; justify-content: center; font-size: 10px; color: #2ecc87; flex-shrink: 0; }
        .plan-feat-no { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); color: #3a4255; }
        .plan-feat.dimmed { color: #3a4255; }
        .plan-btn-outline { display: block; text-align: center; padding: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 14px; font-weight: 700; color: #717a8f; text-decoration: none; transition: all 0.2s; }
        .plan-btn-outline:hover { border-color: rgba(255,255,255,0.2); color: #edeae4; }
        .plan-btn-gold { display: block; text-align: center; padding: 14px; background: linear-gradient(135deg,#f5a623,#ffcc6b); border-radius: 12px; font-size: 14px; font-weight: 700; color: #000; text-decoration: none; transition: all 0.2s; box-shadow: 0 6px 24px rgba(245,166,35,0.3); }
        .plan-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(245,166,35,0.4); }

        /* CTA FINAL */
        .cta-final { margin: 0 24px 80px; background: linear-gradient(135deg, #0f1118, #141820); border: 1px solid rgba(255,255,255,0.07); border-radius: 28px; padding: 80px 40px; text-align: center; position: relative; overflow: hidden; }
        .cta-final::before { content: ''; position: absolute; top: -50%; left: -50%; right: -50%; bottom: -50%; background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(245,166,35,0.08) 0%, transparent 70%); pointer-events: none; }
        .cta-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(32px,5vw,56px); font-weight: 800; letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.05; position: relative; z-index: 1; }
        .cta-h2 em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; background: linear-gradient(135deg,#f5a623,#ffcc6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .cta-sub { font-size: 16px; color: #5a6070; margin-bottom: 40px; line-height: 1.6; position: relative; z-index: 1; }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .cta-guarantee { margin-top: 20px; font-size: 12px; color: #303540; position: relative; z-index: 1; }

        /* COUNTRIES */
        .countries-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 40px; }
        .country-pill { display: flex; align-items: center; gap: 8px; background: #0d0f11; border: 1px solid rgba(255,255,255,0.07); border-radius: 100px; padding: 10px 18px; font-size: 13px; font-weight: 600; color: #717a8f; transition: all 0.2s; }
        .country-pill:hover { border-color: rgba(245,166,35,0.2); color: #edeae4; }

        /* FOOTER */
        .footer { background: #050607; border-top: 1px solid rgba(255,255,255,0.05); padding: 60px 40px 32px; }
        .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; max-width: 1100px; margin: 0 auto 48px; }
        .footer-brand-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; color: #edeae4; margin-bottom: 10px; }
        .footer-brand-desc { font-size: 13px; color: #303540; line-height: 1.6; max-width: 260px; }
        .footer-col-title { font-size: 11px; font-weight: 700; color: #303540; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .footer-lnk { display: block; font-size: 13px; color: #404550; text-decoration: none; margin-bottom: 10px; transition: color 0.15s; }
        .footer-lnk:hover { color: #a0a8b8; }
        .footer-bottom { max-width: 1100px; margin: 0 auto; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; }
        .footer-copy { font-size: 12px; color: #252830; }

        /* RESPONSIVE */
        @media (max-width: 1023px) {
          .features-wrap { grid-template-columns: 1fr; gap: 40px; }
          .phone-preview { order: -1; }
        }
        @media (max-width: 767px) {
          .nav { padding: 0 20px; }
          .nav-center { display: none; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .features-wrap { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .steps-row { grid-template-columns: 1fr; }
          .pricing-wrap { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; }
          .footer-bottom { flex-direction: column; gap: 8px; }
          .cta-final { padding: 48px 24px; margin: 0 12px 48px; }
          .compare-table { font-size: 12px; }
          .compare-head th, .compare-row td { padding: 10px 12px; }
        }
      `}</style>

      {/* TICKER */}
      <div className="ticker" style={{marginTop:70}}>
        <div className="ticker-track">
          {[...Array(2)].map((_,i) => (
            <span key={i}>
              {['🇨🇮 Vendeurs en Côte d\'Ivoire','🇸🇳 Disponible au Sénégal','💬 WhatsApp intégré','🛒 Boutique en 2 minutes','📊 Stats en temps réel','🛵 Livraison intégrée','🇧🇯 Bénin & Cameroun','⚡ Premium à 3 000 FCFA/mois'].map((item, j) => (
                <span key={j} className="ticker-item">{item}<span className="ticker-dot"/></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className={`nav${scrolled?' scrolled':''}`} style={{top:0}}>
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">🛒</div>
          <div className="nav-logo-name">Vendify</div>
        </a>
        <div className="nav-center">
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#comment" className="nav-link">Comment ça marche</a>
          <a href="#tarifs" className="nav-link">Tarifs</a>
          <a href="/boutiques" className="nav-link">Boutiques</a>
          <a href="/livraison" className="nav-link">🛵 Livraison</a>
          <a href="/devenir-livreur" className="nav-link">Devenir livreur</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="nav-login">Se connecter</a>
          <a href="/register" className="nav-cta">Commencer →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"/><div className="hero-noise"/><div className="hero-grid"/>

        {/* Floating phone mockups */}
        <div className="hero-mockups">
          <div className="mockup-left">
            <div className="mockup-phone">
              <div className="mockup-phone-bar"/>
              <div className="mockup-notif">
                <div className="mockup-notif-title">💬 Nouvelle commande !</div>
                <div className="mockup-notif-text">Fatou K. — Robe Wax · 12 500 FCFA</div>
              </div>
              <div className="mockup-stat">
                <div className="mockup-stat-item"><div className="mockup-stat-val">24</div><div className="mockup-stat-lbl">Commandes</div></div>
                <div className="mockup-stat-item"><div className="mockup-stat-val">142K</div><div className="mockup-stat-lbl">FCFA CA</div></div>
              </div>
              {[{name:'Aminata D.',amount:'18 000',color:'#2ecc87'},{name:'Konan M.',amount:'9 500',color:'#f5a623'},{name:'Ibrahim T.',amount:'24 000',color:'#4d8cff'}].map(o => (
                <div key={o.name} className="mockup-order">
                  <div className="mockup-order-dot" style={{background:o.color}}/>
                  <div className="mockup-order-name">{o.name}</div>
                  <div className="mockup-order-amount">{o.amount} FCFA</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mockup-right">
            <div className="mockup-phone">
              <div className="mockup-phone-bar"/>
              <div style={{fontSize:10,fontWeight:700,color:'#717a8f',marginBottom:8}}>Ma Boutique · 8 produits</div>
              {[{n:'👗 Robe Wax',p:'12 500 FCFA',c:'#f5a623'},{n:'🥻 Boubou Brodé',p:'18 000 FCFA',c:'#4d8cff'},{n:'👘 Bazin',p:'22 000 FCFA',c:'#2ecc87'}].map(p => (
                <div key={p.n} className="mockup-order">
                  <div className="mockup-order-dot" style={{background:p.c}}/>
                  <div className="mockup-order-name">{p.n}</div>
                  <div className="mockup-order-amount">{p.p}</div>
                </div>
              ))}
              <div style={{marginTop:10,background:'linear-gradient(135deg,#f5a623,#ffcc6b)',borderRadius:8,padding:'7px',textAlign:'center',fontSize:9,fontWeight:700,color:'#000'}}>
                🛒 Voir ma boutique →
              </div>
            </div>
          </div>
        </div>

        <div className="hero-eyebrow">
          <div className="eyebrow-dot"/>
          La plateforme N°1 des vendeurs africains
        </div>

        <h1 className="hero-title">
          Votre boutique en ligne<br/>
          <em>en 2 minutes</em>{' '}
          <span className="muted">chrono.</span>
        </h1>

        <p className="hero-sub">
          Vendez sur <strong>Instagram, WhatsApp et TikTok</strong> avec une vraie boutique professionnelle.<br/>
          Gérez vos commandes, stocks, livraisons et paiements — en FCFA, depuis votre téléphone.
        </p>

        <div className="hero-ctas">
          <a href="/register" className="btn-gold">
            🛒 Créer ma boutique gratuitement
          </a>
          <a href="/boutiques" className="btn-ghost">
            Voir les boutiques →
          </a>
        </div>

        <div className="hero-trust">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div className="trust-avatars">
              {['👩🏾','👨🏾','👩🏾‍🦱','👨🏿','👩🏽'].map((a,i) => (
                <div key={i} className="trust-avatar" style={{background:`hsl(${i*40+20},50%,20%)`}}>{a}</div>
              ))}
            </div>
            <div>
              <div className="trust-stars">★★★★★</div>
              <div className="trust-text"><strong>+500 vendeurs</strong> nous font confiance</div>
            </div>
          </div>
          <div className="trust-sep"/>
          <div className="trust-text">✓ <strong>Gratuit</strong> pour commencer</div>
          <div className="trust-sep"/>
          <div className="trust-text">✓ Aucune carte requise</div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stats-inner" id="stats" data-animate>
          {[
            { val: '500+', label: 'Vendeurs actifs' },
            { val: '12 000+', label: 'Commandes traitées' },
            { val: '5', label: 'Pays couverts' },
            { val: '98%', label: 'Satisfaction client' },
          ].map((s,i) => (
            <div key={i} className="stat-item">
              <div className="stat-val">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="section" id="features">
        <div style={{marginBottom:64}} id="feat-head" data-animate>
          <div className="section-label">✦ Fonctionnalités</div>
          <h2 className="section-h2">Tout ce dont vous avez besoin<br/>pour <em>vendre plus</em></h2>
        </div>

        <div className="features-wrap">
          <div className="features-tabs" id="feat-tabs" data-animate>
            {features.map((f, i) => (
              <div key={i} className={`feature-tab${activeFeature===i?' active':''}`} onClick={() => setActiveFeature(i)}>
                <div className="feature-tab-top">
                  <div className="feature-tab-icon">{f.icon}</div>
                  <div className="feature-tab-title">{f.title}</div>
                </div>
                <div className="feature-tab-desc">{f.desc}</div>
                <div className="feature-progress"><div className="feature-progress-fill"/></div>
              </div>
            ))}
          </div>

          <div className="phone-preview" id="feat-phone" data-animate data-animate-delay="2">
            <div className="phone-outer">
              <div className="phone-notch"/>
              <div className="phone-screen">
                <div className="phone-screen-header">
                  <div className="phone-screen-header-text">
                    {activeFeature === 0 && '🏪 Boutique Aminata Mode'}
                    {activeFeature === 1 && '📊 Dashboard'}
                    {activeFeature === 2 && '🛵 Livraisons'}
                    {activeFeature === 3 && '💬 WhatsApp'}
                  </div>
                </div>
                <div className="phone-screen-body">
                  {activeFeature === 0 && <>
                    {[
                      {name:'Robe Wax Premium',price:'12 500',promo:'15 000',img:'👗'},
                      {name:'Boubou Brodé',price:'18 000',img:'🥻'},
                      {name:'Ensemble Bazin',price:'22 000',img:'👘'},
                    ].map(p => (
                      <div key={p.name} className="screen-product">
                        <div className="screen-product-img">{p.img}</div>
                        <div style={{flex:1}}>
                          <div className="screen-product-name">{p.name}</div>
                          {p.promo && <div className="screen-product-promo">{p.promo} FCFA</div>}
                        </div>
                        <div className="screen-product-price">{p.price} FCFA</div>
                      </div>
                    ))}
                    <div className="screen-cart">🛒 Panier (2 articles) — Commander →</div>
                  </>}
                  {activeFeature === 1 && <>
                    <div className="screen-stat">
                      <div className="screen-stat-card"><div className="screen-stat-val">24</div><div className="screen-stat-lbl">Commandes</div><div className="screen-stat-delta">+3 aujourd'hui</div></div>
                      <div className="screen-stat-card"><div className="screen-stat-val">142K</div><div className="screen-stat-lbl">CA FCFA</div><div className="screen-stat-delta">+12%</div></div>
                    </div>
                    {[
                      {name:'Fatou K.',amount:'15 000',status:'Nouveau',color:'#f5a623'},
                      {name:'Aminata D.',amount:'8 500',status:'Payé',color:'#2ecc87'},
                      {name:'Konan M.',amount:'22 000',status:'Livré',color:'#4d8cff'},
                    ].map(o => (
                      <div key={o.name} className="screen-order">
                        <div className="screen-order-dot" style={{background:o.color}}/>
                        <div className="screen-order-name">{o.name}</div>
                        <div className="screen-order-amount">{o.amount} FCFA</div>
                        <div className="screen-order-badge" style={{background:`${o.color}18`,color:o.color}}>{o.status}</div>
                      </div>
                    ))}
                  </>}
                  {activeFeature === 2 && <>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {[
                        {name:'Fatou K.',route:'Cocody → Plateau',status:'En route 🛵',color:'#2ecc87'},
                        {name:'Aminata D.',route:'Yopougon → Marcory',status:'Assigné 🏍',color:'#4d8cff'},
                        {name:'Ibrahim T.',route:'Cocody → Abobo',status:'Livré ✓',color:'#a78bfa'},
                      ].map(o => (
                        <div key={o.name} className="screen-order">
                          <div className="screen-order-dot" style={{background:o.color}}/>
                          <div style={{flex:1}}>
                            <div className="screen-order-name">{o.name}</div>
                            <div style={{fontSize:9,color:'#404550'}}>{o.route}</div>
                          </div>
                          <div className="screen-order-badge" style={{background:`${o.color}18`,color:o.color}}>{o.status}</div>
                        </div>
                      ))}
                      <div style={{marginTop:6,background:'linear-gradient(135deg,#a78bfa,#c4b5fd)',borderRadius:10,padding:'10px',textAlign:'center',fontSize:10,fontWeight:700,color:'#000'}}>
                        + Demander une livraison
                      </div>
                    </div>
                  </>}
                  {activeFeature === 3 && <>
                    <div style={{fontSize:10,color:'#404550',marginBottom:8}}>Message envoyé à Fatou Koné 💬</div>
                    <div className="screen-wa">
                      {['🛒 Nouvelle commande !','👤 Fatou Koné','📦 Robe Wax x1 + Boubou x1','💰 Total : 30 500 FCFA','✅ Statut : Confirmé','📍 Livraison : Cocody, Abidjan'].map((l,i) => (
                        <div key={i} className="screen-wa-line">{l}</div>
                      ))}
                    </div>
                    <div style={{background:'rgba(37,211,102,0.08)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:8,padding:'9px 12px',textAlign:'center',fontSize:10,fontWeight:700,color:'#25d366'}}>
                      💬 Envoyer sur WhatsApp →
                    </div>
                  </>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{background:'#060708',borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'100px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div id="testi-head" data-animate style={{textAlign:'center',marginBottom:56}}>
            <div className="section-label" style={{margin:'0 auto 20px'}}>💬 Témoignages</div>
            <h2 className="section-h2">Ils ont transformé leur<br/><em>business avec Vendify</em></h2>
          </div>
          <div className="testimonials-grid" id="testi-grid" data-animate>
            {testimonials.map((t, i) => (
              <div key={i} className="testi-card">
                <div className="testi-stars">{'★'.repeat(t.stars)}</div>
                <div className="testi-text">"{t.text}"</div>
                <div className="testi-author">
                  <div className="testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                  <div className="testi-badge">{t.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPARAISON */}
      <div className="section" style={{textAlign:'center'}}>
        <div id="compare-head" data-animate>
          <div className="section-label" style={{margin:'0 auto 20px'}}>📊 Comparaison</div>
          <h2 className="section-h2" style={{marginBottom:48}}>Pourquoi Vendify <em>plutôt que</em> le reste</h2>
        </div>
        <div id="compare-table" data-animate style={{background:'#0a0b0d',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,overflow:'hidden',maxWidth:760,margin:'0 auto'}}>
          <table className="compare-table">
            <thead>
              <tr className="compare-head">
                <th style={{textAlign:'left',padding:'18px 20px'}}>Fonctionnalité</th>
                <th className="vendify-col">🛒 Vendify</th>
                <th>Carnet papier</th>
                <th>Excel</th>
              </tr>
            </thead>
            <tbody>
              {comparaison.map((row, i) => (
                <tr key={i} className="compare-row">
                  <td>{row.feature}</td>
                  <td className="vendify-col"><span className="check-yes">✓</span></td>
                  <td>{row.carnet ? <span className="check-yes">✓</span> : <span className="check-no">✕</span>}</td>
                  <td>{(row as any).excel ? <span className="check-yes">✓</span> : <span className="check-no">✕</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{background:'#060708',borderTop:'1px solid rgba(255,255,255,0.04)',padding:'100px 24px'}} id="comment">
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div id="steps-head" data-animate style={{textAlign:'center',marginBottom:56}}>
            <div className="section-label" style={{margin:'0 auto 20px'}}>🚀 Démarrage rapide</div>
            <h2 className="section-h2">Lancez-vous en <em>3 étapes</em></h2>
            <p className="section-p" style={{margin:'0 auto',textAlign:'center'}}>Pas besoin de connaissances techniques. Si vous avez un téléphone, vous pouvez vendre avec Vendify.</p>
          </div>
          <div className="steps-row" id="steps-row" data-animate>
            {[
              { n:'1', icon:'✏️', title:'Créez votre compte', desc:'Inscription gratuite en 2 minutes. Renseignez le nom de votre boutique, votre numéro WhatsApp et commencez à ajouter vos produits.' },
              { n:'2', icon:'📸', title:'Ajoutez vos produits', desc:"Photos, prix, stock, catégories et prix promotionnels. Votre boutique est automatiquement en ligne avec un lien unique à partager." },
              { n:'3', icon:'💰', title:'Recevez des commandes', desc:"Partagez votre lien sur Instagram, WhatsApp ou TikTok. Les clients commandent et vous recevez une notification WhatsApp instantanée." },
            ].map(s => (
              <div key={s.n} className="step-card" data-num={s.n}>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COUNTRIES */}
      <div className="section" style={{textAlign:'center',paddingTop:80,paddingBottom:80}}>
        <div id="countries" data-animate>
          <div className="section-label" style={{margin:'0 auto 20px'}}>🌍 Disponible dans</div>
          <h2 className="section-h2" style={{marginBottom:12}}>5 pays d'<em>Afrique de l'Ouest</em></h2>
          <p className="section-p" style={{margin:'0 auto 0',textAlign:'center'}}>Et bientôt dans toute l'Afrique subsaharienne.</p>
          <div className="countries-row">
            {[
              {flag:'🇨🇮',name:"Côte d'Ivoire",badge:'Disponible'},
              {flag:'🇸🇳',name:'Sénégal',badge:'Disponible'},
              {flag:'🇧🇯',name:'Bénin',badge:'Disponible'},
              {flag:'🇨🇲',name:'Cameroun',badge:'Bientôt'},
              {flag:'🇹🇬',name:'Togo',badge:'Bientôt'},
            ].map(c => (
              <div key={c.name} className="country-pill">
                <span style={{fontSize:22}}>{c.flag}</span>
                <span>{c.name}</span>
                <span style={{fontSize:9,background:c.badge==='Disponible'?'rgba(46,204,135,0.1)':'rgba(245,166,35,0.1)',color:c.badge==='Disponible'?'#2ecc87':'#f5a623',border:`1px solid ${c.badge==='Disponible'?'rgba(46,204,135,0.2)':'rgba(245,166,35,0.2)'}`,padding:'2px 8px',borderRadius:20,fontWeight:700}}>
                  {c.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{background:'#060708',borderTop:'1px solid rgba(255,255,255,0.04)',padding:'100px 24px'}} id="tarifs">
        <div style={{maxWidth:900,margin:'0 auto',textAlign:'center'}}>
          <div id="pricing-head" data-animate>
            <div className="section-label" style={{margin:'0 auto 20px'}}>💰 Tarifs</div>
            <h2 className="section-h2" style={{marginBottom:12}}>Simple et <em>transparent</em></h2>
            <p className="section-p" style={{margin:'0 auto 48px',textAlign:'center'}}>Commencez gratuitement. Passez Premium quand vous voulez, sans engagement.</p>
          </div>
          <div className="pricing-wrap" id="pricing-wrap" data-animate>
            {/* Gratuit */}
            <div className="plan">
              <div className="plan-tier">Gratuit</div>
              <div className="plan-price">0 <span>FCFA</span></div>
              <div className="plan-period">Pour toujours</div>
              <div className="plan-divider"/>
              <div className="plan-features">
                {[
                  {t:'20 commandes / mois',ok:true},
                  {t:'5 produits maximum',ok:true},
                  {t:'Gestion des commandes',ok:true},
                  {t:'Stats de base',ok:true},
                  {t:'Boutique publique',ok:false},
                  {t:'Commandes en ligne',ok:false},
                  {t:'Bannière personnalisable',ok:false},
                  {t:'Support prioritaire',ok:false},
                ].map((f,i) => (
                  <div key={i} className={`plan-feat${!f.ok?' dimmed':''}`}>
                    <div className={`plan-feat-check${!f.ok?' plan-feat-no':''}`}>{f.ok?'✓':'✕'}</div>
                    {f.t}
                  </div>
                ))}
              </div>
              <a href="/register" className="plan-btn-outline">Commencer gratuitement</a>
            </div>

            {/* Premium */}
            <div className="plan featured">
              <div className="plan-badge">⚡ RECOMMANDÉ</div>
              <div className="plan-tier" style={{color:'#f5a623'}}>Premium</div>
              <div className="plan-price" style={{background:'linear-gradient(135deg,#f5a623,#ffcc6b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>3 000 <span style={{WebkitTextFillColor:'#5a6070'}}>FCFA</span></div>
              <div className="plan-period">par mois · sans engagement</div>
              <div className="plan-divider"/>
              <div className="plan-features">
                {[
                  'Commandes illimitées',
                  'Produits illimités',
                  'Boutique publique en ligne',
                  'Panier + commandes en ligne',
                  'Bannière & catégories',
                  'Prix promotionnels',
                  'Statistiques avancées',
                  'Reçus PDF',
                  'Livraisons intégrées',
                  'Support prioritaire WhatsApp',
                ].map((f,i) => (
                  <div key={i} className="plan-feat">
                    <div className="plan-feat-check">✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <a href="/register" className="plan-btn-gold">⚡ Commencer Premium</a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA LIVREUR */}
      <div style={{background:'#060708',borderTop:'1px solid rgba(255,255,255,0.04)',padding:'80px 24px'}}>
        <div style={{maxWidth:860,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}} className="livreur-cta-grid">
          <div>
            <div className="section-label">🛵 Pour les livreurs</div>
            <h2 className="section-h2" style={{marginBottom:16}}>Trouvez des courses<br/><em>près de chez vous</em></h2>
            <p style={{fontSize:15,color:'#5a6070',lineHeight:1.75,marginBottom:28}}>
              Inscrivez-vous gratuitement comme livreur sur Vendify. Recevez des demandes de livraison dans votre quartier et augmentez vos revenus à votre rythme.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:32}}>
              {[
                'Aucun abonnement — 100% gratuit',
                'Choisissez vos courses librement',
                'Contactez directement les vendeurs via WhatsApp',
                'Valable à Abidjan, Bouaké, Dakar et plus',
              ].map((item, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:'#a0a8b8'}}>
                  <div style={{width:20,height:20,borderRadius:6,background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#a78bfa',flexShrink:0}}>✓</div>
                  {item}
                </div>
              ))}
            </div>
            <a href="/devenir-livreur" style={{display:'inline-flex',alignItems:'center',gap:9,background:'linear-gradient(135deg,#a78bfa,#c4b5fd)',color:'#000',borderRadius:12,padding:'14px 26px',fontSize:15,fontWeight:700,textDecoration:'none',transition:'all 0.2s',boxShadow:'0 6px 24px rgba(167,139,250,0.3)'}}>
              🛵 Devenir livreur gratuitement
            </a>
          </div>
          <div style={{background:'#0d0f11',border:'1px solid rgba(167,139,250,0.15)',borderRadius:24,padding:28}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:16,fontWeight:800,marginBottom:20,color:'#edeae4'}}>
              Comment ça marche
            </div>
            {[
              {n:'1',icon:'✏️',title:"S'inscrire en 2 min",desc:'Renseignez votre zone, votre moyen de transport et vos tarifs.'},
              {n:'2',icon:'📍',title:'Voir les courses dispo',desc:'Accédez à votre lien personnel et voyez les livraisons dans votre ville.'},
              {n:'3',icon:'💬',title:'Accepter & contacter',desc:"Un clic pour accepter. WhatsApp s'ouvre automatiquement avec le vendeur."},
            ].map(s => (
              <div key={s.n} style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:20}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#edeae4',marginBottom:3}}>{s.title}</div>
                  <div style={{fontSize:12,color:'#404550',lineHeight:1.5}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`.livreur-cta-grid { grid-template-columns: 1fr 1fr !important; } @media(max-width:767px){.livreur-cta-grid{grid-template-columns:1fr!important;}}`}</style>

      {/* CTA FINAL */}
      <div style={{padding:'80px 0'}}>
        <div className="cta-final" id="cta-final" data-animate>
          <h2 className="cta-h2">
            Prêt à vendre<br/>
            <em>comme un pro ?</em>
          </h2>
          <p className="cta-sub">
            Rejoignez +500 vendeurs africains qui utilisent Vendify<br/>pour gérer leur business depuis leur téléphone.
          </p>
          <div className="cta-btns">
            <a href="/register" className="btn-gold" style={{fontSize:16,padding:'16px 32px'}}>
              🛒 Créer ma boutique — C'est gratuit
            </a>
            <a href="/boutiques" className="btn-ghost" style={{fontSize:15}}>
              Voir les boutiques →
            </a>
          </div>
          <div className="cta-guarantee">✓ Aucune carte de crédit requise &nbsp;·&nbsp; ✓ Gratuit pour commencer &nbsp;·&nbsp; ✓ Annulable à tout moment</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <div className="footer-brand-name">🛒 Vendify</div>
            <div className="footer-brand-desc">La plateforme de gestion et de vente en ligne pour les vendeurs d'Afrique de l'Ouest. Gérez vos commandes, produits et boutique depuis votre téléphone.</div>
          </div>
          <div>
            <div className="footer-col-title">Produit</div>
            <a href="/boutiques" className="footer-lnk">Boutiques</a>
            <a href="#features" className="footer-lnk">Fonctionnalités</a>
            <a href="#tarifs" className="footer-lnk">Tarifs</a>
            <a href="#comment" className="footer-lnk">Comment ça marche</a>
          </div>
          <div>
            <div className="footer-col-title">Compte</div>
            <a href="/login" className="footer-lnk">Se connecter</a>
            <a href="/register" className="footer-lnk">S'inscrire</a>
            <a href="/dashboard" className="footer-lnk">Dashboard</a>
            <a href="/premium" className="footer-lnk">Premium ⚡</a>
            <a href="/devenir-livreur" className="footer-lnk">🛵 Devenir livreur</a>
            <a href="/livraison" className="footer-lnk">Demander une livraison</a>
          </div>
          <div>
            <div className="footer-col-title">Pays</div>
            <a href="#" className="footer-lnk">🇨🇮 Côte d'Ivoire</a>
            <a href="#" className="footer-lnk">🇸🇳 Sénégal</a>
            <a href="#" className="footer-lnk">🇧🇯 Bénin</a>
            <a href="#" className="footer-lnk">🇨🇲 Cameroun</a>
            <a href="#" className="footer-lnk">🇹🇬 Togo</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 Vendify · Tous droits réservés</div>
          <div style={{fontSize:12,color:'#252830'}}>Fait avec ❤️ pour l'Afrique de l'Ouest</div>
        </div>
      </footer>

      {/* Scroll animations activation */}
      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          var els = document.querySelectorAll('[data-animate]');
          var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
              if (e.isIntersecting) e.target.classList.add('visible');
            });
          }, { threshold: 0.12 });
          els.forEach(function(el) { io.observe(el); });
        })();
      `}}/>
    </>
  )
}