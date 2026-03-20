'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

function normalizePhone(raw: string): string {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  if (p.startsWith('2250') && p.length === 13) return p
  if (p.startsWith('225') && p.length === 12) return '2250' + p.slice(3)
  if (p.startsWith('0') && p.length === 10) return '225' + p
  if (p.length === 9) return '2250' + p
  return p
}

const VILLES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']
const POIDS  = [
  { value: 'leger',  icon: '🪶', label: 'Léger',  sub: '< 2 kg'  },
  { value: 'moyen',  icon: '📦', label: 'Moyen',  sub: '2–10 kg' },
  { value: 'lourd',  icon: '🏋️', label: 'Lourd',  sub: '> 10 kg' },
]
const MOYEN_ICONS: Record<string, string> = { moto: '🏍', voiture: '🚗', tricycle: '🛺', velo: '🚲' }

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: 'En attente d\'un livreur', color: '#f5a623', bg: 'rgba(245,166,35,.1)',  icon: '⏳' },
  accepted:   { label: 'Livreur assigné',          color: '#4d8cff', bg: 'rgba(77,140,255,.1)',  icon: '🏍' },
  picked_up:  { label: 'Colis récupéré',           color: '#a78bfa', bg: 'rgba(167,139,250,.1)', icon: '📦' },
  in_transit: { label: 'En route vers vous',       color: '#2ecc87', bg: 'rgba(46,204,135,.1)',  icon: '🛵' },
  delivered:  { label: 'Livré ✓',                  color: '#2ecc87', bg: 'rgba(46,204,135,.1)',  icon: '✅' },
  cancelled:  { label: 'Annulé',                   color: '#ff5e5e', bg: 'rgba(255,94,94,.1)',   icon: '❌' },
}

export default function LivraisonPubliquePage() {
  const [step, setStep]           = useState<'form' | 'livreurs' | 'suivi'>('form')
  const [livreurs, setLivreurs]   = useState<any[]>([])
  const [livraison, setLivraison] = useState<any>(null)
  const [loading, setLoading]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [trackRef, setTrackRef]   = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackData, setTrackData] = useState<any>(null)
  const [trackError, setTrackError] = useState('')
  const [waLinks, setWaLinks]         = useState<any[]>([])
  const [showTrack, setShowTrack] = useState(false)

  const [form, setForm] = useState({
    client_nom: '',
    client_phone: '',
    adresse_pickup: '',
    adresse_livraison: '',
    ville: 'Abidjan',
    quartier: '',
    description: '',
    poids: 'leger',
    note_vendeur: '',
  })

  // Vérifier si un ref de suivi est dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setTrackRef(ref)
      handleTrack(ref)
    }
  }, [])

  // Realtime suivi
  useEffect(() => {
    if (!livraison?.id) return
    const channel = supabase
      .channel(`livraison-publique-${livraison.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'deliveries',
        filter: `id=eq.${livraison.id}`
      }, (payload) => {
        setLivraison((prev: any) => ({ ...prev, ...payload.new }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [livraison?.id])

  async function handleSubmit() {
    if (!form.client_nom || !form.client_phone || !form.adresse_pickup || !form.adresse_livraison || !form.ville) return
    setSubmitting(true)

    // Générer une référence unique
    const reference = `LIV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const { data, error } = await (supabase as any).from('deliveries').insert({
      ...form,
      vendor_id: null,
      reference,
      status: 'pending',
    }).select().single()

    if (!error && data) {
      setLivraison(data)

      // Charger les livreurs + notifier en parallèle
      const [{ data: drv }, notifResult] = await Promise.all([
        supabase.from('delivery_drivers').select('*')
          .eq('actif', true).eq('ville', form.ville)
          .order('note_moyenne', { ascending: false }),
        fetch('/api/livraison/notifier-livreurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_id: data.id })
        }).then(r => r.json()).catch(() => null)
      ])

      setLivreurs(drv || [])

      // Stocker les liens WhatsApp — pas d'ouverture auto (bloqué sur mobile)
      if (notifResult?.wa_links?.length > 0) {
        setWaLinks(notifResult.wa_links)
      }

      setStep('livreurs')
    }
    setSubmitting(false)
  }

  async function choisirLivreur(driver: any) {
    if (!livraison) return
    setLoading(true)

    const msg = encodeURIComponent(
      `Bonjour ${driver.full_name} 👋\n\n` +
      `Nouvelle demande de livraison sur Vendify !\n\n` +
      `📦 *Colis :* ${livraison.description || 'Non précisé'} (${livraison.poids})\n` +
      `👤 *Client :* ${livraison.client_nom}\n` +
      `📞 *Téléphone :* ${livraison.client_phone}\n` +
      `📍 *Récupération :* ${livraison.adresse_pickup}\n` +
      `🏠 *Livraison :* ${livraison.adresse_livraison}\n` +
      `🌆 *Ville :* ${livraison.ville}${livraison.quartier ? ` — ${livraison.quartier}` : ''}\n` +
      `🔖 *Référence :* ${livraison.reference}\n\n` +
      `Répondez OUI pour accepter. Merci ! 🙏`
    )
    const waPhone = normalizePhone(driver.whatsapp || driver.phone)
    const waLink  = `https://wa.me/${waPhone}?text=${msg}`

    await (supabase as any).from('deliveries').update({
      driver_id:    driver.id,
      status:       'accepted',
      accepted_at:  new Date().toISOString(),
      whatsapp_link: waLink,
    }).eq('id', livraison.id)

    setLivraison((prev: any) => ({ ...prev, status: 'accepted', delivery_drivers: driver }))
    setLoading(false)
    setStep('suivi')

    // Ouvrir WhatsApp
    window.open(waLink, '_blank')
  }

  async function handleTrack(ref?: string) {
    const r = ref || trackRef
    if (!r.trim()) return
    setTrackLoading(true)
    setTrackError('')
    const { data } = await supabase
      .from('deliveries')
      .select('*, delivery_drivers(*)')
      .eq('reference', r.trim().toUpperCase())
      .single()
    if (data) {
      setTrackData(data)
    } else {
      setTrackError('Référence introuvable. Vérifiez et réessayez.')
    }
    setTrackLoading(false)
    setShowTrack(true)
  }

  const s = livraison ? STATUS_LABELS[livraison.status] : null
  const STEPS_TRACK = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;-webkit-font-smoothing:antialiased;min-height:100vh}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.88)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

        .topbar{background:rgba(7,8,9,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 20px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .tb-brand{display:flex;align-items:center;gap:8px;text-decoration:none}
        .tb-icon{width:32px;height:32px;background:linear-gradient(135deg,#f5a623,#ffcc6b);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 3px 12px rgba(245,166,35,.3)}
        .tb-name{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:800;color:#edeae4}
        .tb-track-btn{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:100px;padding:7px 14px;font-size:12px;font-weight:600;color:#717a8f;cursor:pointer;transition:all .15s}
        .tb-track-btn:hover{background:rgba(255,255,255,.09);color:#edeae4}

        .hero{text-align:center;padding:52px 20px 36px;animation:fadeUp .5s ease}
        .hero-icon{font-size:52px;margin-bottom:16px;display:block}
        .hero-title{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(28px,6vw,48px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;margin-bottom:10px}
        .hero-title em{font-style:normal;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .hero-sub{font-size:15px;color:#5a6070;max-width:440px;margin:0 auto;line-height:1.6}

        .container{max-width:560px;margin:0 auto;padding:0 20px 80px}

        .card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:24px;margin-bottom:16px;animation:slideUp .4s ease}

        .section-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:800;margin-bottom:4px}
        .section-sub{font-size:13px;color:#404550;margin-bottom:20px}

        .field{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}
        .field label{font-size:11px;font-weight:700;color:#303540;text-transform:uppercase;letter-spacing:.8px}
        .inp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 15px;color:#edeae4;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;width:100%}
        .inp:focus{border-color:rgba(245,166,35,.35)}
        .inp::placeholder{color:#252830}
        select.inp{cursor:pointer}
        select.inp option{background:#0d0f11;color:#edeae4}

        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

        .poids-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .poids-opt{padding:14px 8px;border-radius:12px;border:1.5px solid rgba(255,255,255,.07);cursor:pointer;text-align:center;transition:all .2s;background:rgba(255,255,255,.02)}
        .poids-opt.active{border-color:#f5a623;background:rgba(245,166,35,.07)}
        .poids-opt:hover:not(.active){border-color:rgba(255,255,255,.12)}
        .poids-icon{font-size:22px;margin-bottom:5px}
        .poids-name{font-size:12px;font-weight:700}
        .poids-sub{font-size:10px;color:#404550;margin-top:2px}

        .btn-submit{width:100%;padding:15px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(245,166,35,.2);display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px}
        .btn-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(245,166,35,.3)}
        .btn-submit:disabled{background:rgba(255,255,255,.05);color:#303540;cursor:not-allowed;box-shadow:none;transform:none}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite}

        .driver-card{background:#111418;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;transition:border-color .2s;animation:fadeUp .3s ease both}
        .driver-card:hover{border-color:rgba(245,166,35,.2)}
        .driver-avatar{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1a1e2a,#252a38);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
        .driver-name{font-size:14px;font-weight:700;margin-bottom:3px}
        .driver-meta{font-size:12px;color:#404550;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .driver-tarif{font-size:11px;color:#f5a623;font-weight:600;margin-top:3px}
        .btn-choisir{margin-left:auto;flex-shrink:0;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:10px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s}
        .btn-choisir:hover{transform:scale(1.04)}
        .btn-choisir:disabled{background:rgba(255,255,255,.08);color:#303540;cursor:not-allowed;transform:none}

        /* Suivi */
        .suivi-card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:28px 24px;animation:slideUp .4s ease}
        .status-big{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:28px}
        .status-icon{font-size:52px;margin-bottom:12px}
        .status-label{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;margin-bottom:6px}
        .status-sub{font-size:13px;color:#5a6070}

        .timeline{display:flex;flex-direction:column;gap:0;margin-bottom:24px}
        .timeline-item{display:flex;align-items:flex-start;gap:14px;position:relative}
        .timeline-item:not(:last-child)::after{content:'';position:absolute;left:15px;top:32px;width:2px;height:calc(100% + 4px);background:rgba(255,255,255,.06)}
        .timeline-item.done::after{background:rgba(46,204,135,.3)}
        .timeline-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;border:2px solid rgba(255,255,255,.08);background:#111418;position:relative;z-index:1}
        .timeline-dot.done{background:rgba(46,204,135,.15);border-color:rgba(46,204,135,.3)}
        .timeline-dot.active{background:rgba(245,166,35,.15);border-color:rgba(245,166,35,.4);box-shadow:0 0 12px rgba(245,166,35,.2)}
        .timeline-content{padding:6px 0 20px}
        .timeline-title{font-size:13px;font-weight:600;color:#edeae4;margin-bottom:2px}
        .timeline-title.muted{color:#303540}
        .timeline-time{font-size:11px;color:#252830}

        .ref-box{background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.15);border-radius:14px;padding:16px;text-align:center;margin-bottom:20px}
        .ref-lbl{font-size:11px;color:#f5a623;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
        .ref-val{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;letter-spacing:2px;color:#edeae4}
        .ref-hint{font-size:11px;color:#303540;margin-top:6px}

        .driver-assigned{background:rgba(77,140,255,.06);border:1px solid rgba(77,140,255,.15);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .btn-wa-livreur{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.2);color:#25d366;border-radius:12px;padding:13px;font-size:14px;font-weight:600;text-decoration:none;width:100%;transition:all .15s}
        .btn-wa-livreur:hover{background:rgba(37,211,102,.18)}

        /* Track modal */
        .track-over{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.88);backdrop-filter:blur(16px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .track-box{background:#0a0b0d;border:1px solid rgba(255,255,255,.09);border-radius:24px 24px 0 0;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease;padding:28px 24px 36px}

        @media(max-width:480px){
          .grid-2{grid-template-columns:1fr}
          .hero{padding:36px 20px 24px}
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <a href="/" className="tb-brand">
          <div className="tb-icon">🛒</div>
          <span className="tb-name">Vendify</span>
        </a>
        <button className="tb-track-btn" onClick={() => setShowTrack(true)}>
          📍 Suivre ma livraison
        </button>
      </div>

      {/* ── HERO ── */}
      <div className="hero">
        <span className="hero-icon">🛵</span>
        <h1 className="hero-title">
          Livraison rapide<br />à <em>Abidjan</em> et ailleurs
        </h1>
        <p className="hero-sub">
          Envoyez un colis en quelques clics. Choisissez votre livreur, suivez en temps réel.
        </p>
      </div>

      <div className="container">

        {/* ══ ÉTAPE 1 : FORMULAIRE ══ */}
        {step === 'form' && (
          <>
            <div className="card">
              <div className="section-title">Vos informations</div>
              <div className="section-sub">Pour que le livreur puisse vous contacter</div>
              <div className="grid-2">
                <div className="field">
                  <label>Votre nom *</label>
                  <input className="inp" value={form.client_nom}
                    onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))}
                    placeholder="Aminata Koné" />
                </div>
                <div className="field">
                  <label>Téléphone / WhatsApp *</label>
                  <input className="inp" type="tel" value={form.client_phone}
                    onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                    placeholder="0700000000" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">Détails de la livraison</div>
              <div className="section-sub">Où on récupère et où on livre</div>

              <div className="field">
                <label>Adresse de récupération *</label>
                <input className="inp" value={form.adresse_pickup}
                  onChange={e => setForm(f => ({ ...f, adresse_pickup: e.target.value }))}
                  placeholder="Ex: Cocody Riviera 3, résidence les Palmiers" />
              </div>
              <div className="field">
                <label>Adresse de livraison *</label>
                <input className="inp" value={form.adresse_livraison}
                  onChange={e => setForm(f => ({ ...f, adresse_livraison: e.target.value }))}
                  placeholder="Ex: Plateau, Immeuble Traoré, 3ème étage" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Ville *</label>
                  <select className="inp" value={form.ville}
                    onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>
                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Quartier</label>
                  <input className="inp" value={form.quartier}
                    onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))}
                    placeholder="Ex: Yopougon, Cocody..." />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">Votre colis</div>
              <div className="section-sub">Décrivez ce que vous envoyez</div>

              <div className="field">
                <label>Description</label>
                <input className="inp" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Vêtements, téléphone, documents..." />
              </div>
              <div className="field">
                <label>Poids estimé</label>
                <div className="poids-grid">
                  {POIDS.map(p => (
                    <div key={p.value}
                      className={`poids-opt${form.poids === p.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, poids: p.value }))}>
                      <div className="poids-icon">{p.icon}</div>
                      <div className="poids-name">{p.label}</div>
                      <div className="poids-sub">{p.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Note pour le livreur</label>
                <textarea className="inp" value={form.note_vendeur}
                  onChange={e => setForm(f => ({ ...f, note_vendeur: e.target.value }))}
                  placeholder="Instructions, code portail, horaires préférés..."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>

              <button className="btn-submit"
                disabled={submitting || !form.client_nom || !form.client_phone || !form.adresse_pickup || !form.adresse_livraison || !form.ville}
                onClick={handleSubmit}>
                {submitting
                  ? <><span className="spinner" /> Recherche de livreurs...</>
                  : '🛵 Trouver un livreur'}
              </button>
            </div>
          </>
        )}

        {/* ══ ÉTAPE 2 : CHOISIR LIVREUR ══ */}
        {step === 'livreurs' && (
          <div className="card">
            <div className="section-title">Choisissez votre livreur</div>
            <div className="section-sub">
              {livreurs.length} livreur{livreurs.length > 1 ? 's' : ''} disponible{livreurs.length > 1 ? 's' : ''} à {form.ville}
            </div>

            {livreurs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 44, marginBottom: 12, opacity: .2 }}>🏍</div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, color: '#303540', marginBottom: 8 }}>
                  Notifications envoyées aux livreurs !
                </div>
                <div style={{ fontSize: 13, color: '#252830', marginBottom: 20 }}>
                  Les livreurs de votre zone ont été alertés. L'un d'eux acceptera bientôt.
                </div>
                {waLinks.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#404550', marginBottom: 10 }}>
                      Vous pouvez aussi contacter directement un livreur :
                    </div>
                    {waLinks.slice(0, 3).map((l: any) => (
                      <a key={l.driver_id} href={l.wa_link} target="_blank" rel="noopener noreferrer"
                        style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(37,211,102,.08)',border:'1px solid rgba(37,211,102,.15)',borderRadius:10,padding:'10px 14px',marginBottom:8,textDecoration:'none',fontSize:13,color:'#25d366',fontWeight:600 }}>
                        💬 Contacter {l.driver_name}
                      </a>
                    ))}
                  </div>
                )}
                <button onClick={() => setStep('suivi')} style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#f5a623,#ffcc6b)', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Suivre ma livraison →
                </button>
              </div>
            ) : livreurs.map((driver, i) => (
              <div key={driver.id} className="driver-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="driver-avatar">{MOYEN_ICONS[driver.moyen] || '🏍'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="driver-name">{driver.full_name}</div>
                  <div className="driver-meta">
                    <span style={{ color: '#f5a623', fontWeight: 700 }}>⭐ {driver.note_moyenne || 'Nouveau'}</span>
                    <span>·</span>
                    <span>{driver.nb_livraisons} courses</span>
                    <span>·</span>
                    <span>{driver.moyen}</span>
                  </div>
                  <div className="driver-tarif">
                    À partir de {new Intl.NumberFormat('fr-FR').format(driver.tarif_base)} FCFA
                  </div>
                </div>
                <button className="btn-choisir" disabled={loading}
                  onClick={() => choisirLivreur(driver)}>
                  {loading ? '...' : 'Choisir'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ══ ÉTAPE 3 : SUIVI ══ */}
        {step === 'suivi' && livraison && (
          <div className="suivi-card">

            {/* Référence */}
            <div className="ref-box">
              <div className="ref-lbl">Référence de suivi</div>
              <div className="ref-val">{livraison.reference}</div>
              <div className="ref-hint">Gardez cette référence pour suivre votre livraison</div>
              <button onClick={() => navigator.clipboard?.writeText(livraison.reference)}
                style={{ marginTop: 10, padding: '6px 14px', background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.2)', color: '#f5a623', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                📋 Copier
              </button>
            </div>

            {/* Statut actuel */}
            {s && (
              <div className="status-big">
                <div className="status-icon">{s.icon}</div>
                <div className="status-label" style={{ color: s.color }}>{s.label}</div>
                {livraison.status === 'pending' && (
                  <div className="status-sub">En attente qu'un livreur accepte votre demande</div>
                )}
                {livraison.status === 'in_transit' && (
                  <div className="status-sub" style={{ color: '#2ecc87', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc87', animation: 'pulse 1.5s infinite', display: 'inline-block', flexShrink: 0 }} />
                    Suivi en temps réel activé
                  </div>
                )}
              </div>
            )}

            {/* Livreur assigné */}
            {livraison.delivery_drivers && (
              <div className="driver-assigned">
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(77,140,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {MOYEN_ICONS[livraison.delivery_drivers.moyen] || '🏍'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#edeae4' }}>{livraison.delivery_drivers.full_name}</div>
                  <div style={{ fontSize: 11, color: '#404550' }}>
                    ⭐ {livraison.delivery_drivers.note_moyenne || '—'} · {livraison.delivery_drivers.nb_livraisons} courses
                  </div>
                </div>
                {livraison.whatsapp_link && (
                  <a href={livraison.whatsapp_link} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 14px', background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.2)', color: '#25d366', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                    💬 WA
                  </a>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="timeline">
              {[
                { key: 'pending',    label: 'Demande créée',     time: livraison.created_at },
                { key: 'accepted',   label: 'Livreur assigné',   time: livraison.accepted_at },
                { key: 'picked_up',  label: 'Colis récupéré',    time: livraison.picked_up_at },
                { key: 'in_transit', label: 'En route',          time: livraison.in_transit_at },
                { key: 'delivered',  label: 'Livré',             time: livraison.delivered_at },
              ].map((item, i) => {
                const currentIdx = STEPS_TRACK.indexOf(livraison.status)
                const itemIdx    = STEPS_TRACK.indexOf(item.key)
                const isDone     = itemIdx < currentIdx || livraison.status === item.key
                const isActive   = livraison.status === item.key
                const icons      = ['📝', '🏍', '📦', '🛵', '✅']
                return (
                  <div key={item.key} className={`timeline-item${isDone ? ' done' : ''}`}>
                    <div className={`timeline-dot${isActive ? ' active' : isDone ? ' done' : ''}`}>
                      {isDone ? (isActive ? icons[i] : '✓') : icons[i]}
                    </div>
                    <div className="timeline-content">
                      <div className={`timeline-title${!isDone ? ' muted' : ''}`}>{item.label}</div>
                      {item.time && (
                        <div className="timeline-time">
                          {new Date(item.time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Route recap */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#252830', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>📍 Récupération</div>
                  <div style={{ fontSize: 13, color: '#c8cdd8' }}>{livraison.adresse_pickup}</div>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.05)' }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#252830', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>🏠 Destination</div>
                  <div style={{ fontSize: 13, color: '#c8cdd8' }}>{livraison.adresse_livraison}</div>
                </div>
              </div>
            </div>

            <button onClick={() => { setStep('form'); setLivraison(null); setForm({ client_nom: '', client_phone: '', adresse_pickup: '', adresse_livraison: '', ville: 'Abidjan', quartier: '', description: '', poids: 'leger', note_vendeur: '' }) }}
              style={{ width: '100%', padding: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#717a8f', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Nouvelle livraison
            </button>
          </div>
        )}
      </div>

      {/* ══ MODAL SUIVI PAR RÉFÉRENCE ══ */}
      {showTrack && (
        <div className="track-over" onClick={() => setShowTrack(false)}>
          <div className="track-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800 }}>📍 Suivre ma livraison</div>
              <button onClick={() => setShowTrack(false)} style={{ background: 'none', border: 'none', color: '#404550', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input className="inp" style={{ flex: 1 }} value={trackRef}
                onChange={e => setTrackRef(e.target.value.toUpperCase())}
                placeholder="Ex: LIV-1710000000000-A1B2"
                onKeyDown={e => e.key === 'Enter' && handleTrack()} />
              <button onClick={() => handleTrack()} disabled={trackLoading || !trackRef.trim()}
                style={{ padding: '13px 18px', background: 'linear-gradient(135deg,#f5a623,#ffcc6b)', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                {trackLoading ? '...' : 'Chercher'}
              </button>
            </div>
            {trackError && (
              <div style={{ background: 'rgba(255,94,94,.07)', border: '1px solid rgba(255,94,94,.15)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#ff7070', marginBottom: 14 }}>
                ⚠ {trackError}
              </div>
            )}
            {trackData && (() => {
              const ts = STATUS_LABELS[trackData.status]
              return (
                <div style={{ background: '#0d0f11', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 32 }}>{ts?.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, fontWeight: 800, color: ts?.color }}>{ts?.label}</div>
                      <div style={{ fontSize: 12, color: '#303540', marginTop: 3 }}>Réf: {trackData.reference}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#c8cdd8', marginBottom: 6 }}>
                    <span style={{ color: '#303540' }}>📍</span> {trackData.adresse_pickup}
                  </div>
                  <div style={{ fontSize: 13, color: '#c8cdd8', marginBottom: 16 }}>
                    <span style={{ color: '#303540' }}>🏠</span> {trackData.adresse_livraison}
                  </div>
                  {trackData.delivery_drivers && (
                    <div style={{ background: 'rgba(77,140,255,.07)', border: '1px solid rgba(77,140,255,.15)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#4d8cff' }}>
                      🏍 Livreur : <strong>{trackData.delivery_drivers.full_name}</strong>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}