'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080a0f;
          font-family: 'DM Sans', sans-serif;
          color: #e8eaf0;
          min-height: 100vh;
        }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 900px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none !important; }
          .login-right { padding: 40px 24px; }
        }

        /* ── AMBIENT BACKGROUND ── */
        .ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.12;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .orb1 { width: 600px; height: 600px; background: #f5a623; top: -200px; left: -100px; animation-delay: 0s; }
        .orb2 { width: 400px; height: 400px; background: #4d8cff; bottom: -100px; right: 200px; animation-delay: -4s; }
        .orb3 { width: 300px; height: 300px; background: #2ecc87; top: 40%; left: 40%; animation-delay: -8s; }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, -20px) scale(1.05); }
        }

        /* ── LEFT PANEL ── */
        .login-left {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          border-right: 1px solid rgba(255,255,255,0.04);
          background: linear-gradient(135deg, rgba(245,166,35,0.03) 0%, transparent 60%);
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 20px rgba(245,166,35,0.3);
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 900;
          font-size: 22px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 48px;
          padding: 40px 0;
        }

        .left-headline {
          font-family: 'Syne', sans-serif;
          font-weight: 900;
          font-size: clamp(32px, 3vw, 44px);
          line-height: 1.1;
          letter-spacing: -1px;
          color: #f0f2f7;
        }

        .left-headline span {
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .left-sub {
          font-size: 15px;
          color: #6b7491;
          line-height: 1.7;
          font-weight: 300;
          max-width: 380px;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--c);
          opacity: 0.6;
        }
        .stat-card:hover { border-color: rgba(255,255,255,0.1); }

        .stat-icon { font-size: 20px; margin-bottom: 10px; }
        .stat-num {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 24px;
          color: var(--c);
          margin-bottom: 4px;
        }
        .stat-lbl { font-size: 11px; color: #4a5470; font-weight: 500; letter-spacing: 0.5px; }

        /* Testimonial */
        .testimonial {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
        }
        .testi-text { font-size: 14px; color: #8892a4; line-height: 1.7; margin-bottom: 14px; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 10px; }
        .testi-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #000;
          flex-shrink: 0;
        }
        .testi-name { font-size: 13px; font-weight: 600; color: #c8d0e0; }
        .testi-role { font-size: 11px; color: #4a5470; }

        /* ── RIGHT PANEL ── */
        .login-right {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
          background: linear-gradient(160deg, rgba(77,140,255,0.02) 0%, transparent 50%);
        }

        .right-inner {
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .right-inner.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .right-header { margin-bottom: 36px; }

        .right-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(46,204,135,0.08);
          border: 1px solid rgba(46,204,135,0.15);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #2ecc87;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2ecc87;
          box-shadow: 0 0 6px #2ecc87;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .right-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #f0f2f7;
          margin-bottom: 8px;
          line-height: 1.15;
        }
        .right-sub { font-size: 14px; color: #5a6480; font-weight: 300; }

        /* Form */
        .field { margin-bottom: 18px; }
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #4a5470;
          margin-bottom: 8px;
        }

        .input-wrap { position: relative; }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #e8eaf0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #e8eaf0;
        }
        .field-input::placeholder { color: #2e3448; }
        .field-input:focus {
          border-color: rgba(245,166,35,0.4);
          background: rgba(245,166,35,0.03);
          box-shadow: 0 0 0 4px rgba(245,166,35,0.06);
        }
        .field-input.has-icon { padding-right: 48px; }

        .eye-btn {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer;
          color: #3a4255;
          font-size: 16px;
          padding: 4px;
          transition: color 0.2s;
          line-height: 1;
        }
        .eye-btn:hover { color: #717a8f; }

        /* Error */
        .error-box {
          background: rgba(255,94,94,0.06);
          border: 1px solid rgba(255,94,94,0.15);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: #ff7070;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000;
          border: none;
          border-radius: 14px;
          padding: 15px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(245,166,35,0.25);
          letter-spacing: -0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(245,166,35,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          background: #1e2430;
          color: #3a4255;
          box-shadow: none;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 24px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .divider-text { font-size: 12px; color: #2e3448; font-weight: 500; }

        /* Register link */
        .register-link {
          text-align: center;
          font-size: 13px;
          color: #3a4255;
          font-weight: 300;
        }
        .register-link a {
          color: #f5a623;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .register-link a:hover { color: #ffcc6b; }

        /* Security note */
        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          font-size: 11px;
          color: #2a3040;
          font-weight: 400;
        }
      `}</style>

      <div className="ambient">
        <div className="ambient-orb orb1" />
        <div className="ambient-orb orb2" />
        <div className="ambient-orb orb3" />
      </div>

      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          <div className="left-logo">
            <div className="logo-icon">🛒</div>
            <span className="logo-text">Vendify</span>
          </div>

          <div className="left-content">
            <div>
              <h1 className="left-headline">
                Gérez votre boutique<br />
                <span>sans limites.</span>
              </h1>
              <p className="left-sub" style={{ marginTop: 16 }}>
                La plateforme des vendeurs africains sur Instagram, WhatsApp et TikTok. Commandes, stocks, stats — tout en un.
              </p>
            </div>

            <div className="stats-grid">
              {[
                { icon: '📦', num: '2 400+', lbl: 'Commandes gérées', color: '#f5a623' },
                { icon: '🏪', num: '180+', lbl: 'Boutiques actives', color: '#4d8cff' },
                { icon: '📈', num: '+34%', lbl: 'Chiffre d\'affaires moy.', color: '#2ecc87' },
                { icon: '🌍', num: '5 pays', lbl: 'Afrique de l\'Ouest', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ '--c': s.color } as any}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            <div className="testimonial">
              <p className="testi-text">
                "Vendify m'a permis de doubler mes ventes en 2 mois. Je gère tout depuis mon téléphone, même les livraisons."
              </p>
              <div className="testi-author">
                <div className="testi-avatar" style={{ background: 'linear-gradient(135deg, #f5a623, #ff7f50)' }}>A</div>
                <div>
                  <div className="testi-name">Awa Traoré</div>
                  <div className="testi-role">Awa Fashion Store · Abidjan</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#2a3040' }}>
            © 2025 Vendify · Fait avec ❤️ pour l'Afrique
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <div className={`right-inner ${mounted ? 'visible' : ''}`}>

            <div className="right-header">
              <div className="right-badge">
                <span className="badge-dot" />
                Plateforme sécurisée
              </div>
              <h2 className="right-title">
                Bon retour 👋
              </h2>
              <p className="right-sub">Connectez-vous pour accéder à votre boutique</p>
            </div>

            <form onSubmit={handleLogin}>
              {error && (
                <div className="error-box">
                  <span>⚠</span> {error}
                </div>
              )}

              <div className="field">
                <label className="field-label">Adresse email</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="field-label" style={{ margin: 0 }}>Mot de passe</label>
                </div>
                <div className="input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="field-input has-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Connexion en cours...</>
                ) : (
                  <>Se connecter <span style={{ opacity: 0.6 }}>→</span></>
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">NOUVEAU SUR VENDIFY ?</span>
              <div className="divider-line" />
            </div>

            <div className="register-link">
              <Link href="/register" style={{
                display: 'block',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '13px',
                color: '#c8d0e0',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(245,166,35,0.2)'
                el.style.background = 'rgba(245,166,35,0.03)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.06)'
                el.style.background = 'rgba(255,255,255,0.02)'
              }}
              >
                Créer mon compte gratuitement ✦
              </Link>
            </div>

            <div className="security-note">
              <span>🔒</span>
              <span>Connexion chiffrée SSL · Vos données sont sécurisées</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}