'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Identité', 'Boutique', 'Accès']

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [pays, setPays] = useState('CI')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (step < 2) setStep(s => s + 1)
    else handleRegister()
  }

  async function handleRegister() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await new Promise(r => setTimeout(r, 1000))

    if (data.user) {
      await (supabase as any).from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        shop_name: shopName || 'Ma Boutique',
        pays,
      })
    }

    router.push('/')
    router.refresh()
  }

  const progress = ((step + 1) / 3) * 100

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080a0f; font-family: 'DM Sans', sans-serif; color: #e8eaf0; min-height: 100vh; }

        .reg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .reg-root { grid-template-columns: 1fr; }
          .reg-left { display: none !important; }
          .reg-right { padding: 40px 24px; }
        }

        .ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.1; animation: drift 14s ease-in-out infinite alternate; }
        .o1 { width: 500px; height: 500px; background: #2ecc87; top: -150px; right: -100px; }
        .o2 { width: 400px; height: 400px; background: #f5a623; bottom: -100px; left: 100px; animation-delay: -5s; }
        .o3 { width: 300px; height: 300px; background: #4d8cff; top: 40%; left: 30%; animation-delay: -9s; }
        @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-15px) scale(1.04); } }

        /* LEFT */
        .reg-left {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px;
          border-right: 1px solid rgba(255,255,255,0.04);
          background: linear-gradient(135deg, rgba(46,204,135,0.03) 0%, transparent 60%);
        }

        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 4px 20px rgba(245,166,35,0.3);
        }
        .logo-text {
          font-family: 'Syne', sans-serif; font-weight: 900; font-size: 22px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .left-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 36px; padding: 40px 0; }

        .left-title {
          font-family: 'Syne', sans-serif; font-weight: 900;
          font-size: clamp(30px, 2.8vw, 42px); line-height: 1.1;
          letter-spacing: -1px; color: #f0f2f7;
        }
        .left-title span { background: linear-gradient(135deg, #2ecc87, #00d4aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .perks { display: flex; flex-direction: column; gap: 14px; }
        .perk {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px; border-radius: 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          transition: border-color 0.3s;
        }
        .perk:hover { border-color: rgba(255,255,255,0.08); }
        .perk-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .perk-title { font-size: 13px; font-weight: 600; color: #c8d0e0; margin-bottom: 3px; }
        .perk-sub { font-size: 12px; color: #4a5470; font-weight: 300; line-height: 1.5; }

        .free-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(46,204,135,0.06); border: 1px solid rgba(46,204,135,0.12);
          border-radius: 14px; padding: 14px 18px;
        }
        .free-badge-text { font-size: 13px; color: #4a6055; }
        .free-badge-text strong { color: #2ecc87; }

        /* RIGHT */
        .reg-right {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 56px;
        }

        .right-inner {
          width: 100%; max-width: 420px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .right-inner.visible { opacity: 1; transform: translateY(0); }

        /* Progress */
        .progress-wrap { margin-bottom: 36px; }
        .step-indicators {
          display: flex; align-items: center; gap: 0;
          margin-bottom: 12px;
        }
        .step-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; flex: 1; position: relative;
        }
        .step-circle {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          transition: all 0.3s;
          position: relative; z-index: 1;
        }
        .step-circle.done { background: linear-gradient(135deg, #2ecc87, #00d4aa); color: #000; box-shadow: 0 4px 12px rgba(46,204,135,0.3); }
        .step-circle.active { background: linear-gradient(135deg, #f5a623, #ffcc6b); color: #000; box-shadow: 0 4px 12px rgba(245,166,35,0.3); }
        .step-circle.idle { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #3a4255; }
        .step-label { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; color: #3a4255; text-transform: uppercase; }
        .step-label.active { color: #f5a623; }
        .step-label.done { color: #2ecc87; }

        .step-connector {
          position: absolute; top: 16px; left: 50%; right: -50%;
          height: 1px; background: rgba(255,255,255,0.06);
          z-index: 0; transition: background 0.3s;
        }
        .step-connector.done { background: rgba(46,204,135,0.3); }

        .progress-bar {
          height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 2px;
          background: linear-gradient(90deg, #2ecc87, #f5a623);
          transition: width 0.4s ease;
          box-shadow: 0 0 8px rgba(46,204,135,0.4);
        }

        .right-header { margin-bottom: 28px; }
        .step-title {
          font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
          letter-spacing: -0.5px; color: #f0f2f7; margin-bottom: 6px;
        }
        .step-sub { font-size: 14px; color: #4a5470; font-weight: 300; }

        .field { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase; color: #4a5470; margin-bottom: 8px;
        }
        .input-wrap { position: relative; }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px 18px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #e8eaf0; outline: none;
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
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #3a4255;
          font-size: 16px; padding: 4px; transition: color 0.2s; line-height: 1;
        }
        .eye-btn:hover { color: #717a8f; }

        .error-box {
          background: rgba(255,94,94,0.06); border: 1px solid rgba(255,94,94,0.15);
          border-radius: 12px; padding: 12px 16px; font-size: 13px;
          color: #ff7070; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }

        .btn-row { display: flex; gap: 10px; margin-top: 8px; }
        .btn-back {
          flex: 1; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px;
          font-size: 14px; font-weight: 500; color: #5a6480;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-back:hover { border-color: rgba(255,255,255,0.12); color: #8892a4; }

        .btn-next {
          flex: 2; background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000; border: none; border-radius: 14px; padding: 14px;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(245,166,35,0.25);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(245,166,35,0.35); }
        .btn-next:disabled { background: #1e2430; color: #3a4255; box-shadow: none; cursor: not-allowed; }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-link {
          text-align: center; margin-top: 20px;
          font-size: 13px; color: #2e3448;
        }
        .login-link a { color: #f5a623; font-weight: 600; text-decoration: none; }

        .security-note {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 16px; font-size: 11px; color: #1e2430;
        }

        select.field-input { cursor: pointer; }
        select.field-input option { background: #161a22; color: #e8eaf0; }
      `}</style>

      <div className="ambient">
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      </div>

      <div className="reg-root">

        {/* ── LEFT ── */}
        <div className="reg-left">
          <div className="logo">
            <div className="logo-icon">🛒</div>
            <span className="logo-text">Vendify</span>
          </div>

          <div className="left-mid">
            <div>
              <h1 className="left-title">Lancez votre<br /><span>boutique en ligne</span><br />en 2 minutes.</h1>
              <p style={{ marginTop: 14, fontSize: 14, color: '#4a5470', fontWeight: 300, lineHeight: 1.7, maxWidth: 360 }}>
                Rejoignez 180+ vendeurs africains qui gèrent leurs commandes, stocks et stats depuis Vendify.
              </p>
            </div>

            <div className="perks">
              {[
                { icon: '📦', color: 'rgba(245,166,35,0.1)', title: 'Gestion des commandes', sub: 'WhatsApp, Instagram, TikTok et vente directe centralisés.' },
                { icon: '📊', color: 'rgba(77,140,255,0.1)', title: 'Statistiques en temps réel', sub: 'Chiffre d\'affaires, bénéfices, top produits — tout en un coup d\'œil.' },
                { icon: '📦', color: 'rgba(46,204,135,0.1)', title: 'Gestion des stocks', sub: 'Alertes de stock faible, historique et suivi automatique.' },
              ].map((p, i) => (
                <div key={i} className="perk">
                  <div className="perk-icon" style={{ background: p.color }}>{p.icon}</div>
                  <div>
                    <div className="perk-title">{p.title}</div>
                    <div className="perk-sub">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="free-badge">
              <span style={{ fontSize: 20 }}>🎁</span>
              <div className="free-badge-text">
                <strong>100% gratuit pour commencer</strong><br />
                Pas de carte bancaire · Pas d'engagement
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#1e2430' }}>© 2025 Vendify · Fait avec ❤️ pour l'Afrique</div>
        </div>

        {/* ── RIGHT ── */}
        <div className="reg-right">
          <div className={`right-inner ${mounted ? 'visible' : ''}`}>

            {/* Step indicators */}
            <div className="progress-wrap">
              <div className="step-indicators">
                {STEPS.map((s, i) => (
                  <div key={s} className="step-item">
                    {i < STEPS.length - 1 && (
                      <div className={`step-connector ${i < step ? 'done' : ''}`} />
                    )}
                    <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'idle'}`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`step-label ${i < step ? 'done' : i === step ? 'active' : ''}`}>{s}</span>
                  </div>
                ))}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Step headers */}
            <div className="right-header">
              {step === 0 && <><h2 className="step-title">Qui êtes-vous ? 👋</h2><p className="step-sub">Dites-nous comment vous appeler</p></>}
              {step === 1 && <><h2 className="step-title">Votre boutique 🏪</h2><p className="step-sub">Donnez un nom à votre espace de vente</p></>}
              {step === 2 && <><h2 className="step-title">Votre accès 🔐</h2><p className="step-sub">Créez vos identifiants de connexion</p></>}
            </div>

            <form onSubmit={nextStep}>
              {error && <div className="error-box"><span>⚠</span>{error}</div>}

              {/* STEP 0 — Identity */}
              {step === 0 && (
                <div className="field">
                  <label className="field-label">Votre nom complet</label>
                  <input
                    className="field-input" type="text" placeholder="Amara Koné"
                    value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus
                  />
                </div>
              )}

              {/* STEP 1 — Shop */}
              {step === 1 && (
                <>
                  <div className="field">
                    <label className="field-label">Nom de la boutique</label>
                    <input
                      className="field-input" type="text" placeholder="Boutique Amara"
                      value={shopName} onChange={e => setShopName(e.target.value)} required autoFocus
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Pays</label>
                    <select className="field-input" value={pays} onChange={e => setPays(e.target.value)}>
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                      <option value="SN">🇸🇳 Sénégal</option>
                      <option value="BJ">🇧🇯 Bénin</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="TG">🇹🇬 Togo</option>
                    </select>
                  </div>
                </>
              )}

              {/* STEP 2 — Access */}
              {step === 2 && (
                <>
                  <div className="field">
                    <label className="field-label">Adresse email</label>
                    <input
                      className="field-input" type="email" placeholder="vous@exemple.com"
                      value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Mot de passe</label>
                    <div className="input-wrap">
                      <input
                        className="field-input has-icon"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••" minLength={6}
                        value={password} onChange={e => setPassword(e.target.value)} required
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPass(p => !p)}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#2e3448', marginTop: 6 }}>Minimum 6 caractères</div>
                  </div>
                </>
              )}

              <div className="btn-row">
                {step > 0 && (
                  <button type="button" className="btn-back" onClick={() => setStep(s => s - 1)}>
                    ← Retour
                  </button>
                )}
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? (
                    <><span className="spinner" /> Création...</>
                  ) : step < 2 ? (
                    <>Continuer <span style={{ opacity: 0.6 }}>→</span></>
                  ) : (
                    <>🚀 Créer mon compte</>
                  )}
                </button>
              </div>
            </form>

            <div className="login-link">
              Déjà un compte ? <Link href="/login">Se connecter</Link>
            </div>

            <div className="security-note">
              <span>🔒</span>
              <span>Données sécurisées · Pas de spam · Résiliable à tout moment</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}