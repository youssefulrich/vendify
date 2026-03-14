'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

function fCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function normalizePhone(raw: string) {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  if (p.length >= 11) return p
  if (p.length === 10 && p.startsWith('0')) return '225' + p.slice(1)
  if (p.length === 8) return '225' + p
  return p
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: 'En attente',       color: '#f5a623', bg: 'rgba(245,166,35,.1)',   icon: '⏳' },
  accepted:   { label: 'Livreur assigné',  color: '#4d8cff', bg: 'rgba(77,140,255,.1)',   icon: '🏍' },
  picked_up:  { label: 'Colis récupéré',   color: '#a78bfa', bg: 'rgba(167,139,250,.1)',  icon: '📦' },
  in_transit: { label: 'En route',         color: '#2ecc87', bg: 'rgba(46,204,135,.1)',   icon: '🛵' },
  delivered:  { label: 'Livré',            color: '#2ecc87', bg: 'rgba(46,204,135,.1)',   icon: '✅' },
  cancelled:  { label: 'Annulé',           color: '#ff5e5e', bg: 'rgba(255,94,94,.1)',    icon: '❌' },
}

const POIDS_OPTIONS = [
  { value: 'leger',  label: 'Léger',  sub: '< 2 kg', icon: '🪶' },
  { value: 'moyen',  label: 'Moyen',  sub: '2–10 kg', icon: '📦' },
  { value: 'lourd',  label: 'Lourd',  sub: '> 10 kg', icon: '🏋️' },
]

const MOYEN_ICONS: Record<string, string> = {
  moto: '🏍', voiture: '🚗', tricycle: '🛺', velo: '🚲'
}

export default function LivraisonsPage() {
  const [user, setUser]           = useState<any>(null)
  const [livraisons, setLivraisons] = useState<any[]>([])
  const [livreurs, setLivreurs]   = useState<any[]>([])
  const [orders, setOrders]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDrivers, setShowDrivers] = useState(false)
  const [selectedLivraison, setSelectedLivraison] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'actives' | 'terminees'>('actives')

  const [form, setForm] = useState({
    order_id: '',
    adresse_pickup: '',
    adresse_livraison: '',
    ville: '',
    quartier: '',
    description: '',
    poids: 'leger',
    note_vendeur: '',
  })

  useEffect(() => {
    // Lire les params URL si on vient de la page commandes
    const params = new URLSearchParams(window.location.search)
    const orderId    = params.get('order_id')
    const clientNom  = params.get('client_nom')
    const clientPhone = params.get('client_phone')
    const description = params.get('description')
    if (orderId) {
      setForm(f => ({
        ...f,
        order_id:    orderId,
        description: description || f.description,
      }))
      setShowModal(true)
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        loadData(data.user.id)
      }
    })

    // Realtime — mise à jour statuts en temps réel
    const channel = supabase
      .channel('livraisons-changes')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'deliveries'
      }, (payload) => {
        setLivraisons(prev => prev.map(l =>
          l.id === payload.new.id ? { ...l, ...payload.new } : l
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData(userId: string) {
    const [{ data: liv }, { data: drv }, { data: ord }] = await Promise.all([
      supabase.from('deliveries')
        .select('*, delivery_drivers(*), orders(client_nom, client_phone, total)')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('delivery_drivers')
        .select('*').eq('actif', true).order('note_moyenne', { ascending: false }),
      (supabase as any).from('orders')
        .select('id, client_nom, client_phone, total, statut')
        .eq('vendor_id', userId)
        .eq('statut', 'confirmee')
        .order('created_at', { ascending: false })
    ])
    setLivraisons(liv || [])
    setLivreurs(drv || [])
    setOrders(ord || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.order_id || !form.adresse_pickup || !form.adresse_livraison || !form.ville) return
    setSubmitting(true)
    const { data: newLiv } = await (supabase as any).from('deliveries').insert({
      ...form,
      vendor_id: user.id,
      status: 'pending',
    }).select().single()

    // Notifier les livreurs (push + WhatsApp)
    if (newLiv?.id) {
      fetch('/api/livraison/notifier-livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: newLiv.id })
      }).then(r => r.json()).then(result => {
        if (result.wa_links?.length > 0) {
          // Ouvrir WhatsApp pour les livreurs sans push
          result.wa_links.slice(0, 3).forEach((l: any, i: number) => {
            setTimeout(() => window.open(l.wa_link, '_blank'), i * 800)
          })
        }
      }).catch(console.error)
    }

    await loadData(user.id)
    setShowModal(false)
    setForm({ order_id: '', adresse_pickup: '', adresse_livraison: '', ville: '', quartier: '', description: '', poids: 'leger', note_vendeur: '' })
    setSubmitting(false)
  }

  async function assignDriver(livraisonId: string, driverId: string, driverWa: string, livraison: any) {
    const driver = livreurs.find(d => d.id === driverId)
    if (!driver) return

    const msg = encodeURIComponent(
      `Bonjour ${driver.full_name} 👋\n\nNous avons une livraison disponible pour vous sur Vendify !\n\n` +
      `📦 *Colis :* ${livraison.description || 'Non précisé'}\n` +
      `📍 *Récupération :* ${livraison.adresse_pickup}\n` +
      `🏠 *Livraison :* ${livraison.adresse_livraison}\n` +
      `🌆 *Ville :* ${livraison.ville}${livraison.quartier ? ` — ${livraison.quartier}` : ''}\n\n` +
      `Répondez OUI pour accepter cette livraison. Merci ! 🙏`
    )
    const waPhone = normalizePhone(driverWa)
    const waLink = `https://wa.me/${waPhone}?text=${msg}`

    await (supabase as any).from('deliveries').update({
      driver_id: driverId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      whatsapp_link: waLink,
    }).eq('id', livraisonId)

    await loadData(user.id)
    setShowDrivers(false)
    setSelectedLivraison(null)
    window.open(waLink, '_blank')
  }

  async function updateStatus(livraisonId: string, newStatus: string) {
    const updates: any = { status: newStatus }
    if (newStatus === 'picked_up')  updates.picked_up_at = new Date().toISOString()
    if (newStatus === 'delivered')  updates.delivered_at = new Date().toISOString()
    await (supabase as any).from('deliveries').update(updates).eq('id', livraisonId)
    await loadData(user.id)
  }

  const actives  = livraisons.filter(l => !['delivered', 'cancelled'].includes(l.status))
  const termines = livraisons.filter(l =>  ['delivered', 'cancelled'].includes(l.status))
  const displayed = activeTab === 'actives' ? actives : termines

  // Commandes sans livraison déjà créée
  const livraisonOrderIds = livraisons.map(l => l.order_id)
  const ordresSansLivraison = orders.filter(o => !livraisonOrderIds.includes(o.id))

  const stats = {
    total: livraisons.length,
    actives: actives.length,
    livrees: livraisons.filter(l => l.status === 'delivered').length,
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,.08)', borderTop: '3px solid #f5a623', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#070809;color:#edeae4}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        .page{max-width:1100px;margin:0 auto;padding:28px 24px 80px}

        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
        .page-title{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;color:#edeae4}
        .page-sub{font-size:13px;color:#404550;margin-top:4px}

        .btn-primary{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:12px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;flex-shrink:0}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(245,166,35,.3)}
        .btn-primary:disabled{background:rgba(255,255,255,.06);color:#303540;cursor:not-allowed;transform:none;box-shadow:none}

        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
        .stat-card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 20px}
        .stat-num{font-family:'Bricolage Grotesque',sans-serif;font-size:28px;font-weight:800;color:#edeae4;margin-bottom:4px}
        .stat-lbl{font-size:11px;color:#303540;font-weight:600;text-transform:uppercase;letter-spacing:.8px}

        .tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:20px}
        .tab{padding:11px 20px;font-size:13px;font-weight:600;color:#404550;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s;display:flex;align-items:center;gap:7px}
        .tab.active{color:#f5a623;border-bottom-color:#f5a623}
        .tab-badge{background:rgba(245,166,35,.15);color:#f5a623;border-radius:100px;padding:1px 8px;font-size:11px;font-weight:800}

        .livraison-card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;margin-bottom:14px;animation:fadeUp .35s ease both;transition:border-color .2s}
        .livraison-card:hover{border-color:rgba(245,166,35,.18)}
        .lcard-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
        .lcard-ref{font-size:12px;color:#252830;font-weight:600}
        .lcard-client{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:700;color:#edeae4;margin-top:3px}
        .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:100px;font-size:11px;font-weight:700;flex-shrink:0}

        .route{display:flex;align-items:stretch;gap:0;margin-bottom:14px}
        .route-point{flex:1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px 14px}
        .route-point:first-child{border-radius:10px 0 0 10px;border-right:none}
        .route-point:last-child{border-radius:0 10px 10px 0}
        .route-arrow{display:flex;align-items:center;justify-content:center;width:32px;flex-shrink:0;background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);font-size:14px;color:#303540}
        .route-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#252830;margin-bottom:4px}
        .route-addr{font-size:12px;color:#c8cdd8;font-weight:500;line-height:1.4}

        .driver-section{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;flex-wrap:wrap}
        .driver-info{display:flex;align-items:center;gap:10px}
        .driver-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f5a623,#ffcc6b);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .driver-name{font-size:13px;font-weight:600;color:#edeae4}
        .driver-meta{font-size:11px;color:#404550;margin-top:2px}

        .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
        .btn-sm{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none}
        .btn-assign{background:rgba(77,140,255,.1);border:1px solid rgba(77,140,255,.2);color:#4d8cff}
        .btn-assign:hover{background:rgba(77,140,255,.18)}
        .btn-wa{background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.2);color:#25d366;text-decoration:none}
        .btn-wa:hover{background:rgba(37,211,102,.18)}
        .btn-status{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#c8cdd8}
        .btn-status:hover{background:rgba(255,255,255,.09)}
        .btn-cancel{background:rgba(255,94,94,.07);border:1px solid rgba(255,94,94,.15);color:#ff7070}
        .btn-cancel:hover{background:rgba(255,94,94,.13)}

        .empty{text-align:center;padding:60px 20px}
        .empty-icon{font-size:48px;margin-bottom:14px;opacity:.2}
        .empty-title{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;color:#303540;margin-bottom:6px}
        .empty-sub{font-size:13px;color:#252830}

        /* ── MODAL ── */
        .modal-over{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.88);backdrop-filter:blur(16px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .modal-box{background:#0a0b0d;border:1px solid rgba(255,255,255,.09);border-radius:24px 24px 0 0;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;animation:slideUp .3s ease;padding:28px 24px 36px}
        .modal-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;margin-bottom:4px}
        .modal-sub{font-size:13px;color:#404550;margin-bottom:24px}
        .field-group{display:flex;flex-direction:column;gap:16px}
        .field{display:flex;flex-direction:column;gap:7px}
        .field label{font-size:11px;font-weight:700;color:#303540;text-transform:uppercase;letter-spacing:.8px}
        .inp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 15px;color:#edeae4;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;width:100%}
        .inp:focus{border-color:rgba(245,166,35,.3)}
        .inp::placeholder{color:#252830}
        select.inp{cursor:pointer}
        select.inp option{background:#0d0f11;color:#edeae4}

        .poids-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .poids-opt{padding:12px 8px;border-radius:12px;border:1.5px solid rgba(255,255,255,.07);cursor:pointer;text-align:center;transition:all .2s;background:rgba(255,255,255,.02)}
        .poids-opt.active{border-color:#f5a623;background:rgba(245,166,35,.07)}
        .poids-opt-icon{font-size:22px;margin-bottom:5px}
        .poids-opt-name{font-size:12px;font-weight:700;color:#edeae4}
        .poids-opt-sub{font-size:10px;color:#404550;margin-top:2px}

        /* ── LIVREURS DRAWER ── */
        .drivers-over{position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s}
        .drivers-box{background:#0a0b0d;border:1px solid rgba(255,255,255,.09);border-radius:24px 24px 0 0;width:100%;max-width:560px;max-height:86vh;overflow-y:auto;animation:slideUp .3s ease;padding:24px 20px 36px}
        .driver-card{background:#0d0f11;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;transition:border-color .2s;cursor:pointer}
        .driver-card:hover{border-color:rgba(245,166,35,.2)}
        .driver-card-avatar{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1a1e2a,#252a38);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
        .driver-card-name{font-size:14px;font-weight:700;color:#edeae4;margin-bottom:3px}
        .driver-card-meta{font-size:12px;color:#404550;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .driver-rating{display:flex;align-items:center;gap:4px;color:#f5a623;font-size:12px;font-weight:700}
        .btn-choisir{margin-left:auto;flex-shrink:0;background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border:none;border-radius:9px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap}
        .btn-choisir:hover{transform:scale(1.04)}

        @media(max-width:640px){
          .page{padding:20px 16px 80px}
          .stats-row{grid-template-columns:1fr 1fr}
          .stats-row .stat-card:last-child{grid-column:span 2}
          .route{flex-direction:column}
          .route-point:first-child,.route-point:last-child{border-radius:10px;border:1px solid rgba(255,255,255,.06)}
          .route-arrow{width:100%;height:24px;transform:rotate(90deg)}
        }
      `}</style>

      <div className="page">

        {/* ── HEADER ── */}
        <div className="page-header">
          <div>
            <div className="page-title">🛵 Livraisons</div>
            <div className="page-sub">Gérez vos livraisons et trouvez des livreurs disponibles</div>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}
            disabled={ordresSansLivraison.length === 0}>
            + Demander une livraison
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-lbl">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#f5a623' }}>{stats.actives}</div>
            <div className="stat-lbl">En cours</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#2ecc87' }}>{stats.livrees}</div>
            <div className="stat-lbl">Livrées</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="tabs">
          <button className={`tab${activeTab === 'actives' ? ' active' : ''}`}
            onClick={() => setActiveTab('actives')}>
            En cours
            {actives.length > 0 && <span className="tab-badge">{actives.length}</span>}
          </button>
          <button className={`tab${activeTab === 'terminees' ? ' active' : ''}`}
            onClick={() => setActiveTab('terminees')}>
            Terminées
          </button>
        </div>

        {/* ── LISTE ── */}
        {displayed.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🛵</div>
            <div className="empty-title">
              {activeTab === 'actives' ? 'Aucune livraison en cours' : 'Aucune livraison terminée'}
            </div>
            <div className="empty-sub">
              {activeTab === 'actives' && ordresSansLivraison.length > 0
                ? 'Cliquez sur "Demander une livraison" pour commencer'
                : 'Vos livraisons terminées apparaîtront ici'}
            </div>
          </div>
        ) : displayed.map((liv, i) => {
          const s = STATUS_LABELS[liv.status] || STATUS_LABELS.pending
          const driver = liv.delivery_drivers
          const order  = liv.orders

          return (
            <div key={liv.id} className="livraison-card" style={{ animationDelay: `${i * 0.04}s` }}>

              <div className="lcard-top">
                <div>
                  <div className="lcard-ref">
                    Livraison · {new Date(liv.created_at).toLocaleDateString('fr-FR')}
                    {order && ` · Client : ${order.client_nom}`}
                  </div>
                  <div className="lcard-client">
                    {liv.description || 'Colis non décrit'}
                    {liv.poids && <span style={{ fontSize: 12, color: '#404550', fontWeight: 400, marginLeft: 8 }}>
                      ({liv.poids})
                    </span>}
                  </div>
                </div>
                <div className="status-badge" style={{ color: s.color, background: s.bg }}>
                  {s.icon} {s.label}
                </div>
              </div>

              {/* Route */}
              <div className="route">
                <div className="route-point">
                  <div className="route-lbl">📍 Récupération</div>
                  <div className="route-addr">{liv.adresse_pickup}</div>
                </div>
                <div className="route-arrow">→</div>
                <div className="route-point">
                  <div className="route-lbl">🏠 Livraison</div>
                  <div className="route-addr">{liv.adresse_livraison}</div>
                </div>
              </div>

              {/* Livreur assigné */}
              {driver ? (
                <div className="driver-section">
                  <div className="driver-info">
                    <div className="driver-avatar">{MOYEN_ICONS[driver.moyen] || '🏍'}</div>
                    <div>
                      <div className="driver-name">{driver.full_name}</div>
                      <div className="driver-meta">
                        ⭐ {driver.note_moyenne || '—'} · {driver.nb_livraisons} livraisons · {driver.ville}
                      </div>
                    </div>
                  </div>
                  {liv.whatsapp_link && (
                    <a href={liv.whatsapp_link} target="_blank" rel="noopener noreferrer"
                      className="btn-sm btn-wa">
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: 'rgba(245,166,35,.05)', border: '1px dashed rgba(245,166,35,.2)', borderRadius: 10, fontSize: 12, color: '#f5a623' }}>
                  ⏳ En attente d'un livreur — choisissez un livreur ci-dessous
                </div>
              )}

              {/* Actions */}
              <div className="actions">
                {liv.status === 'pending' && (
                  <button className="btn-sm btn-assign" onClick={() => {
                    setSelectedLivraison(liv)
                    setShowDrivers(true)
                  }}>
                    🏍 Choisir un livreur
                  </button>
                )}
                {liv.status === 'accepted' && (
                  <button className="btn-sm btn-status"
                    onClick={() => updateStatus(liv.id, 'picked_up')}>
                    📦 Marquer récupéré
                  </button>
                )}
                {liv.status === 'picked_up' && (
                  <button className="btn-sm btn-status"
                    onClick={() => updateStatus(liv.id, 'in_transit')}>
                    🛵 Marquer en route
                  </button>
                )}
                {liv.status === 'in_transit' && (
                  <button className="btn-sm btn-status" style={{ color: '#2ecc87', borderColor: 'rgba(46,204,135,.25)', background: 'rgba(46,204,135,.08)' }}
                    onClick={() => updateStatus(liv.id, 'delivered')}>
                    ✅ Marquer livré
                  </button>
                )}
                {!['delivered', 'cancelled'].includes(liv.status) && (
                  <button className="btn-sm btn-cancel"
                    onClick={() => updateStatus(liv.id, 'cancelled')}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ MODAL CRÉER LIVRAISON ══ */}
      {showModal && (
        <div className="modal-over" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div className="modal-title">Nouvelle livraison 🛵</div>
                <div className="modal-sub">Renseignez les informations de livraison</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#404550', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div className="field-group">

              {/* Commande associée */}
              <div className="field">
                <label>Commande associée *</label>
                <select className="inp" value={form.order_id}
                  onChange={e => {
                    const order = ordresSansLivraison.find(o => o.id === e.target.value)
                    setForm(f => ({
                      ...f,
                      order_id: e.target.value,
                      description: order ? `Commande ${order.client_nom}` : f.description
                    }))
                  }}>
                  <option value="">Sélectionner une commande</option>
                  {ordresSansLivraison.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.client_nom} — {new Intl.NumberFormat('fr-FR').format(o.total)} FCFA
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="field">
                <label>Description du colis</label>
                <input className="inp" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: 2 robes, 1 sac à main..." />
              </div>

              {/* Poids */}
              <div className="field">
                <label>Poids estimé</label>
                <div className="poids-grid">
                  {POIDS_OPTIONS.map(opt => (
                    <div key={opt.value}
                      className={`poids-opt${form.poids === opt.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, poids: opt.value }))}>
                      <div className="poids-opt-icon">{opt.icon}</div>
                      <div className="poids-opt-name">{opt.label}</div>
                      <div className="poids-opt-sub">{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adresse pickup */}
              <div className="field">
                <label>Adresse de récupération * (votre adresse)</label>
                <input className="inp" value={form.adresse_pickup}
                  onChange={e => setForm(f => ({ ...f, adresse_pickup: e.target.value }))}
                  placeholder="Ex: Cocody Riviera 3, résidence les Palmiers" />
              </div>

              {/* Adresse livraison */}
              <div className="field">
                <label>Adresse de livraison * (adresse du client)</label>
                <input className="inp" value={form.adresse_livraison}
                  onChange={e => setForm(f => ({ ...f, adresse_livraison: e.target.value }))}
                  placeholder="Ex: Plateau, Immeuble Traoré, 3ème étage" />
              </div>

              {/* Ville + Quartier */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Ville *</label>
                  <select className="inp" value={form.ville}
                    onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>
                    <option value="">Choisir</option>
                    {['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Quartier (optionnel)</label>
                  <input className="inp" value={form.quartier}
                    onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))}
                    placeholder="Ex: Cocody, Yopougon..." />
                </div>
              </div>

              {/* Note */}
              <div className="field">
                <label>Note pour le livreur (optionnel)</label>
                <textarea className="inp" value={form.note_vendeur}
                  onChange={e => setForm(f => ({ ...f, note_vendeur: e.target.value }))}
                  placeholder="Instructions particulières, horaires, code portail..."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <button onClick={handleCreate}
              disabled={submitting || !form.order_id || !form.adresse_pickup || !form.adresse_livraison || !form.ville}
              className="btn-primary"
              style={{ width: '100%', marginTop: 24, padding: 15, justifyContent: 'center', fontSize: 15 }}>
              {submitting ? '⏳ Création...' : '🛵 Créer la livraison'}
            </button>
          </div>
        </div>
      )}

      {/* ══ DRAWER LISTE LIVREURS ══ */}
      {showDrivers && selectedLivraison && (
        <div className="drivers-over" onClick={() => setShowDrivers(false)}>
          <div className="drivers-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800 }}>
                Choisir un livreur
              </div>
              <button onClick={() => setShowDrivers(false)} style={{ background: 'none', border: 'none', color: '#404550', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#404550', marginBottom: 20 }}>
              {livreurs.filter(d => !form.ville || d.ville === selectedLivraison.ville).length} livreur{livreurs.length > 1 ? 's' : ''} disponible{livreurs.length > 1 ? 's' : ''} à {selectedLivraison.ville}
            </div>

            {livreurs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🏍</div>
                <div className="empty-title">Aucun livreur disponible</div>
                <div className="empty-sub">Revenez plus tard ou contactez un livreur manuellement</div>
              </div>
            ) : livreurs
              .filter(d => !selectedLivraison.ville || d.ville === selectedLivraison.ville || d.ville === 'Toutes')
              .map(driver => (
              <div key={driver.id} className="driver-card">
                <div className="driver-card-avatar">{MOYEN_ICONS[driver.moyen] || '🏍'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="driver-card-name">{driver.full_name}</div>
                  <div className="driver-card-meta">
                    <span className="driver-rating">⭐ {driver.note_moyenne || 'Nouveau'}</span>
                    <span>·</span>
                    <span>{driver.nb_livraisons} livraisons</span>
                    <span>·</span>
                    <span>{driver.moyen}</span>
                  </div>
                  {driver.tarif_base && (
                    <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 600, marginTop: 4 }}>
                      À partir de {new Intl.NumberFormat('fr-FR').format(driver.tarif_base)} FCFA
                    </div>
                  )}
                </div>
                <button className="btn-choisir"
                  onClick={() => assignDriver(selectedLivraison.id, driver.id, driver.whatsapp, selectedLivraison)}>
                  Choisir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}