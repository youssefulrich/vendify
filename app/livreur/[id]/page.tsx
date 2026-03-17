'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

function normalizePhone(raw: string) {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  if (p.length >= 11) return p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  if (p.length === 9) return '2250' + p
  if (p.length === 8) return '225' + p
  return p
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string; next?: string; nextLabel?: string }> = {
  accepted:   { label: 'Acceptée',       color: '#4d8cff', bg: 'rgba(77,140,255,.1)',  icon: '🏍', next: 'picked_up',  nextLabel: 'Confirmer récupération' },
  picked_up:  { label: 'Colis récupéré', color: '#a78bfa', bg: 'rgba(167,139,250,.1)', icon: '📦', next: 'in_transit', nextLabel: 'Je suis en route' },
  in_transit: { label: 'En route',       color: '#2ecc87', bg: 'rgba(46,204,135,.1)',  icon: '🛵', next: 'delivered',  nextLabel: 'Confirmer livraison' },
  delivered:  { label: 'Livré ✓',        color: '#2ecc87', bg: 'rgba(46,204,135,.1)',  icon: '✅' },
}

export default function LivreurDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: driverId } = React.use(params)
  const [driver, setDriver]           = useState<any>(null)
  const [disponibles, setDisponibles] = useState<any[]>([])
  const [mesCourses, setMesCourses]   = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [activeTab, setActiveTab]     = useState<'dispo' | 'mes-courses'>('dispo')
  const [accepting, setAccepting]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate]   = useState<Date>(new Date())

  useEffect(() => {
    loadAll()

    // Polling toutes les 10s pour mobile
    const interval = setInterval(() => {
      loadAll()
      setLastUpdate(new Date())
    }, 10000)

    // Realtime Supabase
    const channel = supabase
      .channel(`livreur-${driverId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
        loadAll()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [driverId])

  async function loadAll() {
    const { data: drv } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('id', driverId)
      .single()

    if (!drv) { setNotFound(true); setLoading(false); return }
    setDriver(drv)

    const { data: dispo } = await supabase
      .from('deliveries')
      .select('*, orders(client_nom, total)')
      .eq('status', 'pending')
      .eq('ville', drv.ville)
      .order('created_at', { ascending: false })

    const { data: courses } = await supabase
      .from('deliveries')
      .select('*, orders(client_nom, total)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    setDisponibles(dispo || [])
    setMesCourses(courses || [])
    setLoading(false)
  }

  async function accepterLivraison(livraison: any) {
    setAccepting(livraison.id)

    const { error } = await (supabase as any).from('deliveries').update({
      driver_id:     driverId,
      status:        'accepted',
      accepted_at:   new Date().toISOString(),
      whatsapp_link: null,
    }).eq('id', livraison.id).eq('status', 'pending')

    if (!error) {
      // Notifier le vendeur via Green API (automatique)
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'livraison_acceptee', id: livraison.id, driverId })
      }).catch(() => null)

      await loadAll()
      setActiveTab('mes-courses')
    }
    setAccepting(null)
  }

  async function updateStatus(livraisonId: string, newStatus: string, livraison: any) {
    const updates: any = { status: newStatus }
    if (newStatus === 'picked_up')  updates.picked_up_at  = new Date().toISOString()
    if (newStatus === 'in_transit') updates.in_transit_at = new Date().toISOString()
    if (newStatus === 'delivered')  updates.delivered_at  = new Date().toISOString()

    await (supabase as any).from('deliveries').update(updates).eq('id', livraisonId)

    // Notifier le vendeur via Green API (automatique)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'livraison_statut', id: livraisonId, statut: newStatus, driverId })
    }).catch(() => null)

    await loadAll()
  }

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#070809', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 56 }}>❓</div>
      <div style={{ color: '#edeae4', fontSize: 20, fontWeight: 700 }}>Livreur introuvable</div>
      <a href="/devenir-livreur" style={{ color: '#f5a623', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>→ S'inscrire comme livreur</a>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#070809', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,.08)', borderTop: '3px solid #f5a623', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const enCours = mesCourses.filter(c => !['delivered', 'cancelled'].includes(c.status))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#070809;font-family:'DM Sans',sans-serif;color:#edeae4;min-height:100vh}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.92)}}

        .topbar{position:sticky;top:0;z-index:100;background:rgba(7,8,9,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 20px;height:58px;display:flex;align-items:center;justify-content:space-between}
        .tb-brand{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:800;background:linear-gradient(135deg,#f5a623,#ffcc6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .tb-driver{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#edeae4}
        .tb-dot{width:8px;height:8px;border-radius:50%;background:#2ecc87;animation:pulse 2s infinite;flex-shrink:0}

        .page{max-width:680px;margin:0 auto;padding:24px 20px 80px}

        .hero-card{background:linear-gradient(135deg,#0d1117,#131b12);border:1px solid rgba(245,166,35,.15);border-radius:20px;padding:24px;margin-bottom:20px;position:relative;overflow:visible}
        .hero-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 80% 50%,rgba(245,166,35,.06) 0%,transparent 70%);border-radius:20px;pointer-events:none}
        .hero-name{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px}
        .hero-meta{font-size:13px;color:#5a6070;margin-bottom:16px}
        .hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .hero-stat{background:rgba(255,255,255,.04);border-radius:12px;padding:12px;text-align:center}
        .hero-stat-num{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#f5a623}
        .hero-stat-lbl{font-size:10px;color:#303540;font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-top:3px}

        .notif-banner{background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.18);border-radius:14px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:13px;color:#2ecc87;font-weight:600;animation:fadeUp .4s ease}
        .notif-dot{width:8px;height:8px;border-radius:50%;background:#2ecc87;animation:pulse 1.5s infinite;flex-shrink:0}

        .tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:20px}
        .tab{padding:11px 20px;font-size:13px;font-weight:600;color:#404550;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s;display:flex;align-items:center;gap:7px}
        .tab.active{color:#f5a623;border-bottom-color:#f5a623}
        .tab-badge{background:rgba(245,166,35,.15);color:#f5a623;border-radius:100px;padding:1px 8px;font-size:11px;font-weight:800}

        .liv-card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px;margin-bottom:12px;animation:fadeUp .35s ease both;transition:border-color .2s}
        .liv-card:hover{border-color:rgba(245,166,35,.18)}

        .liv-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap}
        .liv-desc{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700}
        .liv-date{font-size:11px;color:#252830;margin-top:3px}
        .status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;flex-shrink:0}

        .route{display:grid;grid-template-columns:1fr auto 1fr;gap:0;margin-bottom:12px}
        .route-point{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);padding:10px 12px;border-radius:10px}
        .route-point:first-child{border-radius:10px 0 0 10px;border-right:none}
        .route-point:last-child{border-radius:0 10px 10px 0}
        .route-arrow{display:flex;align-items:center;justify-content:center;width:28px;background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;color:#303540;flex-shrink:0}
        .route-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#252830;margin-bottom:3px}
        .route-addr{font-size:12px;color:#c8cdd8;line-height:1.4}

        .btn-accept{width:100%;padding:13px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(245,166,35,.2)}
        .btn-accept:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(245,166,35,.3)}
        .btn-accept:disabled{background:rgba(255,255,255,.05);color:#303540;cursor:not-allowed;transform:none;box-shadow:none}
        .spinner{width:14px;height:14px;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite}

        .btn-next-status{width:100%;padding:13px;background:rgba(77,140,255,.1);border:1px solid rgba(77,140,255,.25);color:#4d8cff;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s}
        .btn-next-status:hover{background:rgba(77,140,255,.18)}
        .btn-next-status.green{background:rgba(46,204,135,.1);border-color:rgba(46,204,135,.25);color:#2ecc87}
        .btn-next-status.green:hover{background:rgba(46,204,135,.18)}

        .empty{text-align:center;padding:50px 20px}
        .empty-icon{font-size:44px;margin-bottom:12px;opacity:.2}
        .empty-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;color:#303540;margin-bottom:6px}
        .empty-sub{font-size:12px;color:#252830}

        .update-indicator{font-size:10px;color:#252830;text-align:center;margin-bottom:8px}

        @media(max-width:480px){
          .route{grid-template-columns:1fr;grid-template-rows:auto auto auto}
          .route-point:first-child,.route-point:last-child{border-radius:10px;border:1px solid rgba(255,255,255,.06)}
          .route-arrow{width:100%;height:20px;justify-content:center}
          .hero-stats{grid-template-columns:1fr 1fr}
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <span className="tb-brand">🛵 Vendify Livraisons</span>
        <div className="tb-driver">
          <div className="tb-dot" />
          {driver?.full_name}
        </div>
      </div>

      <div className="page">

        {/* HERO PROFIL */}
        <div className="hero-card">
          <div className="hero-name">
            {driver.full_name} {driver.moyen === 'moto' ? '🏍' : driver.moyen === 'voiture' ? '🚗' : '🛺'}
          </div>
          <div className="hero-meta">
            {driver.ville} · Tarif min. {new Intl.NumberFormat('fr-FR').format(driver.tarif_base)} FCFA
          </div>

          {/* BANDEAU NOTIFICATIONS WhatsApp */}
          <div style={{
            background: 'rgba(37,211,102,.06)',
            border: '1px solid rgba(37,211,102,.15)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#25d366' }}>
                Notifications WhatsApp activées
              </div>
              <div style={{ fontSize: 11, color: '#404550', marginTop: 2 }}>
                Vous recevrez un message WhatsApp dès qu'une livraison est disponible
              </div>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">{driver.nb_livraisons}</div>
              <div className="hero-stat-lbl">Livraisons</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{driver.note_moyenne || '—'}</div>
              <div className="hero-stat-lbl">Note ⭐</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{enCours.length}</div>
              <div className="hero-stat-lbl">En cours</div>
            </div>
          </div>
        </div>

        {/* Indicateur de mise à jour */}
        <div className="update-indicator">
          Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Actualisation auto toutes les 10s
        </div>

        {/* Notification nouvelles livraisons */}
        {disponibles.length > 0 && activeTab === 'dispo' && (
          <div className="notif-banner">
            <div className="notif-dot" />
            {disponibles.length} livraison{disponibles.length > 1 ? 's' : ''} disponible{disponibles.length > 1 ? 's' : ''} dans votre zone !
          </div>
        )}

        {/* TABS */}
        <div className="tabs">
          <button className={`tab${activeTab === 'dispo' ? ' active' : ''}`} onClick={() => setActiveTab('dispo')}>
            Disponibles
            {disponibles.length > 0 && <span className="tab-badge">{disponibles.length}</span>}
          </button>
          <button className={`tab${activeTab === 'mes-courses' ? ' active' : ''}`} onClick={() => setActiveTab('mes-courses')}>
            Mes courses
            {enCours.length > 0 && <span className="tab-badge">{enCours.length}</span>}
          </button>
        </div>

        {/* LIVRAISONS DISPONIBLES */}
        {activeTab === 'dispo' && (
          disponibles.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-title">Aucune livraison disponible</div>
              <div className="empty-sub">Vous recevrez un WhatsApp dès qu'une livraison arrive dans votre zone</div>
            </div>
          ) : disponibles.map((liv, i) => (
            <div key={liv.id} className="liv-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="liv-top">
                <div>
                  <div className="liv-desc">{liv.description || 'Colis à livrer'}</div>
                  <div className="liv-date">
                    {liv.quartier && `${liv.quartier} · `}
                    {new Date(liv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {liv.poids && ` · ${liv.poids}`}
                  </div>
                </div>
                {liv.tarif && (
                  <div style={{ background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#f5a623', flexShrink: 0 }}>
                    {new Intl.NumberFormat('fr-FR').format(liv.tarif)} FCFA
                  </div>
                )}
              </div>
              <div className="route">
                <div className="route-point">
                  <div className="route-lbl">📍 Récupération</div>
                  <div className="route-addr">{liv.adresse_pickup}</div>
                </div>
                <div className="route-arrow">→</div>
                <div className="route-point">
                  <div className="route-lbl">🏠 Destination</div>
                  <div className="route-addr">{liv.adresse_livraison}</div>
                </div>
              </div>
              {liv.note_vendeur && (
                <div style={{ fontSize: 12, color: '#5a6070', background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontStyle: 'italic' }}>
                  📝 {liv.note_vendeur}
                </div>
              )}
              <button className="btn-accept"
                disabled={accepting === liv.id}
                onClick={() => accepterLivraison(liv)}>
                {accepting === liv.id
                  ? <><span className="spinner" /> Acceptation...</>
                  : '🛵 Accepter cette livraison'}
              </button>
            </div>
          ))
        )}

        {/* MES COURSES */}
        {activeTab === 'mes-courses' && (
          mesCourses.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🛵</div>
              <div className="empty-title">Aucune course pour l'instant</div>
              <div className="empty-sub">Acceptez une livraison dans l'onglet Disponibles</div>
            </div>
          ) : mesCourses.map((liv, i) => {
            const s = STATUS_LABELS[liv.status]
            if (!s) return null
            return (
              <div key={liv.id} className="liv-card" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="liv-top">
                  <div>
                    <div className="liv-desc">{liv.description || 'Colis'}</div>
                    <div className="liv-date">{new Date(liv.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="status-badge" style={{ color: s.color, background: s.bg }}>
                    {s.icon} {s.label}
                  </div>
                </div>
                <div className="route">
                  <div className="route-point">
                    <div className="route-lbl">📍 Récupération</div>
                    <div className="route-addr">{liv.adresse_pickup}</div>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="route-point">
                    <div className="route-lbl">🏠 Destination</div>
                    <div className="route-addr">{liv.adresse_livraison}</div>
                  </div>
                </div>
                {s.next && (
                  <button
                    className={`btn-next-status${s.next === 'delivered' ? ' green' : ''}`}
                    onClick={() => updateStatus(liv.id, s.next!, liv)}>
                    {s.nextLabel} →
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}