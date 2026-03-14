'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const VILLES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']
const QUARTIERS_ABIDJAN = ['Cocody','Plateau','Yopougon','Adjamé','Abobo','Koumassi','Marcory','Treichville','Attécoubé','Port-Bouët']
const MOYENS = [
  { value: 'moto',     icon: '🏍',  label: 'Moto' },
  { value: 'voiture',  icon: '🚗',  label: 'Voiture' },
  { value: 'tricycle', icon: '🛺',  label: 'Tricycle' },
  { value: 'velo',     icon: '🚲',  label: 'Vélo' },
]

export default function DevenirLivreurPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [driverId, setDriverId] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [countdown, setCountdown] = useState(3)
  useEffect(() => {
    if (!done || !driverId) return
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          window.location.href = `/livreur/${driverId}`
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [done, driverId])

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    ville: 'Abidjan',
    quartiers: [] as string[],
    moyen: 'moto',
    tarif_base: '500',
    tarif_km: '200',
  })

  async function handleLoginLivreur() {
    if (!loginPhone.trim()) return
    setLoginLoading(true)
    setLoginError('')
    const phone = loginPhone.trim()
    const { data } = await supabase
      .from('delivery_drivers')
      .select('id, full_name, actif')
      .or(`phone.eq.${phone},whatsapp.eq.${phone}`)
      .eq('actif', true)
      .single()
    if (data) {
      window.location.href = `/livreur/${data.id}`
    } else {
      setLoginError('Aucun livreur trouvé avec ce numéro. Vérifiez ou inscrivez-vous.')
    }
    setLoginLoading(false)
  }

  function toggleQuartier(q: string) {
    setForm(f => ({
      ...f,
      quartiers: f.quartiers.includes(q)
        ? f.quartiers.filter(x => x !== q)
        : [...f.quartiers, q]
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    setErrMsg('')
    try {
      const { data, error } = await (supabase as any).from('delivery_drivers').insert({
        full_name:  form.full_name,
        phone:      form.phone,
        whatsapp:   form.whatsapp || form.phone,
        email:      form.email || null,
        ville:      form.ville,
        quartiers:  form.quartiers,
        moyen:      form.moyen,
        tarif_base: parseInt(form.tarif_base) || 500,
        tarif_km:   parseInt(form.tarif_km) || 200,
        actif:      true,
        verified:   false,
      }).select().single()

      if (error) {
        console.error('Supabase error:', error)
        setErrMsg(error.message || "Erreur lors de l'inscription")
      } else if (data) {
        setDriverId(data.id)
        setDone(true)
      }
    } catch (e: any) {
      console.error('Exception:', e)
      setErrMsg(e.message || 'Erreur inattendue')
    }
    setLoading(false)
  }

  const STEPS = ['Identité', 'Zone', 'Tarifs']
  const progress = ((step + 1) / 3) * 100

  if (done) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;min-height:100vh}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#0d0f11', border: '1px solid rgba(46,204,135,.2)', borderRadius: 24, padding: '40px 28px', textAlign: 'center', maxWidth: 400, width: '100%', animation: 'fadeUp .4s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
            Inscription réussie !
          </div>
          <div style={{ fontSize: 13, color: '#5a6070', lineHeight: 1.7, marginBottom: 28 }}>
            Bienvenue sur Vendify Livraisons. Voici votre lien personnel pour voir et accepter les livraisons dans votre zone.
          </div>
          <div style={{ background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>
              Votre lien livreur
            </div>
            <div style={{ fontSize: 13, color: '#edeae4', fontWeight: 600, wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/livreur/{driverId}
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/livreur/${driverId}`)
            }}
            style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#f5a623,#ffcc6b)', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
            📋 Copier mon lien
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ! Je suis maintenant livreur sur Vendify. Voici mon lien pour suivre mes livraisons : ${typeof window !== 'undefined' ? window.location.origin : ''}/livreur/${driverId}`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', padding: 13, background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.2)', color: '#25d366', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
            💬 Partager sur WhatsApp
          </a>
          <div style={{ fontSize: 13, color: '#2ecc87', marginTop: 16, fontWeight: 600 }}>
            Redirection dans {countdown}s vers votre espace livreur...
          </div>
          <button
            onClick={() => { window.location.href = `/livreur/${driverId}` }}
            style={{ marginTop: 12, width: '100%', padding: 13, background: 'rgba(46,204,135,.1)', border: '1px solid rgba(46,204,135,.2)', color: '#2ecc87', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            → Accéder à mon espace maintenant
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;min-height:100vh}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .root{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
        .card{background:#0a0b0d;border:1px solid rgba(255,255,255,.08);border-radius:24px;width:100%;max-width:480px;padding:32px 28px;animation:fadeUp .4s ease}

        .logo{display:flex;align-items:center;gap:8px;margin-bottom:28px}
        .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px}
        .logo-text{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:800;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}

        .progress-bar{height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:8px}
        .progress-fill{height:100%;background:linear-gradient(90deg,#2ecc87,#f5a623);transition:width .4s ease;border-radius:2px}
        .step-labels{display:flex;justify-content:space-between;margin-bottom:28px}
        .step-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;transition:color .2s}

        .step-title{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;margin-bottom:6px}
        .step-sub{font-size:13px;color:#404550;margin-bottom:24px}

        .field{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
        .field label{font-size:11px;font-weight:700;color:#303540;text-transform:uppercase;letter-spacing:.8px}
        .inp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 15px;color:#edeae4;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;width:100%}
        .inp:focus{border-color:rgba(245,166,35,.3)}
        .inp::placeholder{color:#252830}
        select.inp{cursor:pointer}
        select.inp option{background:#0d0f11;color:#edeae4}

        .moyen-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .moyen-opt{padding:14px 8px;border-radius:12px;border:1.5px solid rgba(255,255,255,.07);cursor:pointer;text-align:center;transition:all .2s;background:rgba(255,255,255,.02)}
        .moyen-opt.active{border-color:#f5a623;background:rgba(245,166,35,.07)}
        .moyen-opt-icon{font-size:24px;margin-bottom:6px}
        .moyen-opt-name{font-size:11px;font-weight:700}

        .quartiers-grid{display:flex;flex-wrap:wrap;gap:8px}
        .quartier-chip{padding:6px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.09);font-size:12px;font-weight:600;color:#717a8f;cursor:pointer;transition:all .15s;background:rgba(255,255,255,.03)}
        .quartier-chip.active{border-color:#f5a623;color:#f5a623;background:rgba(245,166,35,.08)}

        .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}

        .btn-row{display:flex;gap:10px;margin-top:24px}
        .btn-back{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px;font-size:14px;font-weight:600;color:#5a6070;cursor:pointer;transition:all .2s}
        .btn-back:hover{background:rgba(255,255,255,.08);color:#a0a8b8}
        .btn-next{flex:2;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(245,166,35,.2)}
        .btn-next:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(245,166,35,.3)}
        .btn-next:disabled{background:rgba(255,255,255,.05);color:#303540;cursor:not-allowed;box-shadow:none}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite}
      `}</style>

      <div className="root">
        {/* ── MODAL CONNEXION LIVREUR ── */}
        {showLogin && (
          <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,.88)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
            <div style={{background:'#0a0b0d',border:'1px solid rgba(255,255,255,.09)',borderRadius:24,width:'100%',maxWidth:420,padding:'32px 28px'}}>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:800,marginBottom:6}}>
                🛵 Retrouver mon espace
              </div>
              <div style={{fontSize:13,color:'#404550',marginBottom:24}}>
                Entrez votre numéro de téléphone pour accéder à votre espace livreur
              </div>
              <div className="field">
                <label>Numéro de téléphone</label>
                <input className="inp" type="tel" value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="0700000000" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleLoginLivreur()} />
              </div>
              {loginError && (
                <div style={{background:'rgba(255,94,94,.07)',border:'1px solid rgba(255,94,94,.2)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#ff7070',marginBottom:14}}>
                  ⚠ {loginError}
                </div>
              )}
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={() => { setShowLogin(false); setLoginError(''); setLoginPhone('') }}
                  style={{flex:1,padding:13,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,fontSize:14,fontWeight:600,color:'#5a6070',cursor:'pointer'}}>
                  Annuler
                </button>
                <button onClick={handleLoginLivreur} disabled={loginLoading || !loginPhone.trim()}
                  style={{flex:2,padding:13,background:'linear-gradient(135deg,#f5a623,#ffcc6b)',color:'#000',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loginLoading||!loginPhone.trim()?0.5:1}}>
                  {loginLoading
                    ? <><span style={{width:14,height:14,border:'2px solid rgba(0,0,0,.2)',borderTopColor:'#000',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Recherche...</>
                    : '→ Accéder à mon espace'}
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="card">

          <div className="logo">
            <div className="logo-icon">🛵</div>
            <span className="logo-text">Vendify Livraisons</span>
          </div>

          {/* Déjà livreur */}
          <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'12px 16px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <div style={{fontSize:13,color:'#5a6070'}}>Déjà inscrit comme livreur ?</div>
            <button onClick={() => setShowLogin(true)}
              style={{background:'rgba(245,166,35,.1)',border:'1px solid rgba(245,166,35,.2)',color:'#f5a623',borderRadius:9,padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
              Se connecter →
            </button>
          </div>

          {/* Progress */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="step-labels">
            {STEPS.map((s, i) => (
              <span key={s} className="step-lbl" style={{ color: i <= step ? '#f5a623' : '#252830' }}>{s}</span>
            ))}
          </div>

          {/* ── ÉTAPE 0 : Identité ── */}
          {step === 0 && (
            <>
              <div className="step-title">Qui êtes-vous ? 👋</div>
              <div className="step-sub">Vos informations de contact</div>
              <div className="field">
                <label>Nom complet *</label>
                <input className="inp" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Kouamé Koffi" autoFocus />
              </div>
              <div className="field">
                <label>Numéro de téléphone *</label>
                <input className="inp" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0700000000" />
              </div>
              <div className="field">
                <label>Numéro WhatsApp (si différent)</label>
                <input className="inp" type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="Laisser vide si identique" />
              </div>
              <div className="field">
                <label>Email (optionnel)</label>
                <input className="inp" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" />
              </div>
              <div className="field">
                <label>Moyen de transport *</label>
                <div className="moyen-grid">
                  {MOYENS.map(m => (
                    <div key={m.value} className={`moyen-opt${form.moyen === m.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, moyen: m.value }))}>
                      <div className="moyen-opt-icon">{m.icon}</div>
                      <div className="moyen-opt-name">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="btn-row">
                <button className="btn-next" style={{ flex: 1 }}
                  disabled={!form.full_name || !form.phone}
                  onClick={() => setStep(1)}>
                  Continuer →
                </button>
              </div>
            </>
          )}

          {/* ── ÉTAPE 1 : Zone ── */}
          {step === 1 && (
            <>
              <div className="step-title">Votre zone 📍</div>
              <div className="step-sub">Où effectuez-vous vos livraisons ?</div>
              <div className="field">
                <label>Ville principale *</label>
                <select className="inp" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value, quartiers: [] }))}>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {form.ville === 'Abidjan' && (
                <div className="field">
                  <label>Quartiers couverts (sélectionnez tout ce qui vous convient)</label>
                  <div className="quartiers-grid">
                    {QUARTIERS_ABIDJAN.map(q => (
                      <div key={q}
                        className={`quartier-chip${form.quartiers.includes(q) ? ' active' : ''}`}
                        onClick={() => toggleQuartier(q)}>
                        {q}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#252830', marginTop: 6 }}>
                    {form.quartiers.length === 0 ? 'Aucun quartier sélectionné = toute la ville' : `${form.quartiers.length} quartier${form.quartiers.length > 1 ? 's' : ''} sélectionné${form.quartiers.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              )}
              <div className="btn-row">
                <button className="btn-back" onClick={() => setStep(0)}>← Retour</button>
                <button className="btn-next" disabled={!form.ville} onClick={() => setStep(2)}>Continuer →</button>
              </div>
            </>
          )}

          {/* ── ÉTAPE 2 : Tarifs ── */}
          {step === 2 && (
            <>
              <div className="step-title">Vos tarifs 💰</div>
              <div className="step-sub">Définissez votre grille tarifaire</div>
              <div className="row">
                <div className="field">
                  <label>Tarif minimum (FCFA) *</label>
                  <input className="inp" type="number" value={form.tarif_base}
                    onChange={e => setForm(f => ({ ...f, tarif_base: e.target.value }))}
                    placeholder="500" min="0" />
                </div>
                <div className="field">
                  <label>Tarif / km supp. (FCFA)</label>
                  <input className="inp" type="number" value={form.tarif_km}
                    onChange={e => setForm(f => ({ ...f, tarif_km: e.target.value }))}
                    placeholder="200" min="0" />
                </div>
              </div>
              <div style={{ background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.15)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#c8a050', lineHeight: 1.6 }}>
                💡 Ces tarifs sont indicatifs. Vous pouvez négocier avec chaque vendeur avant d'accepter une livraison.
              </div>
              {errMsg && (
                <div style={{background:'rgba(255,94,94,.07)',border:'1px solid rgba(255,94,94,.2)',borderRadius:12,padding:'12px 14px',fontSize:13,color:'#ff7070',marginBottom:14}}>
                  ⚠ {errMsg}
                </div>
              )}
              <div className="btn-row">
                <button className="btn-back" onClick={() => setStep(1)}>← Retour</button>
                <button className="btn-next" disabled={loading || !form.tarif_base} onClick={handleSubmit}>
                  {loading ? <><span className="spinner" /> Inscription...</> : '🚀 Finaliser mon inscription'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}