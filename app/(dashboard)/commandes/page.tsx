'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCFA } from '@/lib/utils/formatCFA'
import type { Order } from '@/lib/supabase/types'

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  en_attente: { label: 'En attente', bg: 'rgba(245,166,35,0.08)',  color: '#f5a623' },
  paye:       { label: 'Payé',       bg: 'rgba(46,204,135,0.08)',  color: '#2ecc87' },
  livre:      { label: 'Livré',      bg: 'rgba(77,140,255,0.08)',  color: '#4d8cff' },
  annule:     { label: 'Annulé',     bg: 'rgba(255,94,94,0.08)',   color: '#ff5e5e' },
}
const CANAL_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: '#25d366', emoji: '💬' },
  instagram: { label: 'Instagram', color: '#e1306c', emoji: '📷' },
  tiktok:    { label: 'TikTok',    color: '#69c9d0', emoji: '🎵' },
  direct:    { label: 'Direct',    color: '#a78bfa', emoji: '🛒' },
}
const STATUTS_FILTER = [
  { key: 'tous',       label: 'Toutes',     color: '#ffffff' },
  { key: 'en_attente', label: 'En attente', color: '#f5a623' },
  { key: 'paye',       label: 'Payées',     color: '#2ecc87' },
  { key: 'livre',      label: 'Livrées',    color: '#4d8cff' },
  { key: 'annule',     label: 'Annulées',   color: '#ff5e5e' },
]
const GRADIENTS = [
  'linear-gradient(135deg,#f5a623,#ff7f50)',
  'linear-gradient(135deg,#4d8cff,#a78bfa)',
  'linear-gradient(135deg,#2ecc87,#00d4aa)',
  'linear-gradient(135deg,#ff5e5e,#ff9a3c)',
  'linear-gradient(135deg,#e1306c,#f77737)',
  'linear-gradient(135deg,#69c9d0,#4d8cff)',
]
const getGradient = (name: string) => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length]

function buildWhatsAppMessage(order: Order, shopName: string) {
  const statut = STATUT_STYLE[order.statut]?.label || order.statut
  const canal  = CANAL_CONFIG[order.canal]?.label  || order.canal
  const date   = new Date(order.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  const lines = [
    `🛒 *Récapitulatif de commande*`,
    `━━━━━━━━━━━━━━`,
    `📦 Boutique : *${shopName}*`,
    `👤 Client   : *${order.client_nom}*`,
    `📅 Date     : ${date}`,
    `💳 Canal    : ${canal}`,
    `💰 *Total : ${formatCFA(order.total)}*`,
    `📋 Statut : ${statut}`,
    order.note ? `📝 Note : ${order.note}` : null,
    `━━━━━━━━━━━━━━`,
    `Merci pour votre commande ! 🙏`,
    `_Géré via Vendify.ci_`,
  ].filter(Boolean).join('\n')
  const phone = order.client_phone?.replace(/\D/g, '') || ''
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`
    : `https://wa.me/?text=${encodeURIComponent(lines)}`
}

function generateHTMLReceipt(order: Order, shopName: string) {
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Reçu - ${order.client_nom}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Helvetica Neue',Arial,sans-serif; background:#f5f5f5; padding:20px; }
    .receipt { max-width:420px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1); }
    .header  { background:linear-gradient(135deg,#f5a623,#ffcc6b); padding:24px; }
    .header-top { display:flex; justify-content:space-between; align-items:flex-start; }
    .logo { font-size:22px; font-weight:900; color:#000; }
    .shop { font-size:12px; color:rgba(0,0,0,0.6); margin-top:3px; }
    .receipt-label { background:rgba(0,0,0,0.12); border-radius:8px; padding:4px 10px; font-size:11px; font-weight:700; color:#000; }
    .body    { padding:24px; }
    .section-title { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#999; margin-bottom:10px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .info-item .label { font-size:10px; color:#bbb; margin-bottom:3px; }
    .info-item .value { font-size:13px; font-weight:600; color:#222; }
    .divider { height:1px; background:#f0f0f0; margin:16px 0; }
    .total-box { background:linear-gradient(135deg,#fff8ec,#fff); border:2px solid #f5a623; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin:16px 0; }
    .total-label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px; }
    .total-val   { font-size:28px; font-weight:900; color:#f5a623; }
    .note-box { background:#f9f9f9; border-radius:8px; padding:12px; font-size:12px; color:#666; margin-top:12px; }
    .footer  { background:#fafafa; border-top:1px solid #f0f0f0; padding:16px 24px; text-align:center; font-size:11px; color:#bbb; }
    .print-btn { display:block; width:100%; padding:14px; background:linear-gradient(135deg,#f5a623,#ffcc6b); border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; margin-top:16px; color:#000; }
    @media print { .print-btn { display:none; } body { background:#fff; padding:0; } .receipt { box-shadow:none; } }
  </style></head><body>
  <div class="receipt">
    <div class="header">
      <div class="header-top">
        <div><div class="logo">🛒 Vendify</div><div class="shop">${shopName}</div></div>
        <div class="receipt-label">REÇU OFFICIEL</div>
      </div>
    </div>
    <div class="body">
      <div class="section-title">Informations client</div>
      <div class="info-grid">
        <div class="info-item"><div class="label">Client</div><div class="value">${order.client_nom}</div></div>
        <div class="info-item"><div class="label">Téléphone</div><div class="value">${order.client_phone || '—'}</div></div>
        <div class="info-item"><div class="label">Date</div><div class="value">${date}</div></div>
        <div class="info-item"><div class="label">Canal</div><div class="value">${CANAL_CONFIG[order.canal]?.emoji || ''} ${CANAL_CONFIG[order.canal]?.label || order.canal}</div></div>
        <div class="info-item"><div class="label">Paiement</div><div class="value">${(order.mode_paiement||'').replace('_',' ') || '—'}</div></div>
        <div class="info-item"><div class="label">Statut</div><div class="value">${STATUT_STYLE[order.statut]?.label || order.statut}</div></div>
      </div>
      <div class="divider"></div>
      <div class="total-box">
        <div><div class="total-label">Montant total</div></div>
        <div class="total-val">${formatCFA(order.total)}</div>
      </div>
      ${order.note ? `<div class="note-box">📝 ${order.note}</div>` : ''}
    </div>
    <div class="footer">Merci pour votre confiance • Vendify.ci</div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

export default function CommandesPage() {
  const supabase = createClient()
  const [orders, setOrders]             = useState<Order[]>([])
  const [filteredOrders, setFiltered]   = useState<Order[]>([])
  const [activeStatut, setActiveStatut] = useState('tous')
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [sortField, setSortField]       = useState<'created_at'|'total'>('created_at')
  const [sortDir, setSortDir]           = useState<'desc'|'asc'>('desc')
  const [updatingId, setUpdatingId]     = useState<string|null>(null)
  const [toast, setToast]               = useState<{msg:string;type:'ok'|'wa'|'pdf'}>({msg:'',type:'ok'})
  const [shopName, setShopName]         = useState('Ma Boutique')
  const [isPremium, setIsPremium]       = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<string|null>(null)
  const [expandedCard, setExpandedCard] = useState<string|null>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let f = [...orders]
    if (activeStatut !== 'tous') f = f.filter(o => o.statut === activeStatut)
    if (search) f = f.filter(o =>
      o.client_nom.toLowerCase().includes(search.toLowerCase()) ||
      o.client_phone?.includes(search)
    )
    f.sort((a, b) => {
      const va = sortField === 'total' ? a.total : new Date(a.created_at).getTime()
      const vb = sortField === 'total' ? b.total : new Date(b.created_at).getTime()
      return sortDir === 'desc' ? vb - va : va - vb
    })
    setFiltered(f)
  }, [orders, activeStatut, search, sortField, sortDir])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profile }, { data: ordersData }] = await Promise.all([
      supabase.from('profiles').select('shop_name,plan').eq('id', user.id).single(),
      supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (profile) {
      setShopName((profile as any).shop_name || 'Ma Boutique')
      setIsPremium((profile as any).plan === 'premium')
    }
    setOrders(ordersData || [])
    setLoading(false)
  }

  async function updateStatut(id: string, newStatut: Order['statut']) {
    setUpdatingId(id)
    await (supabase as any).from('orders').update({ statut: newStatut }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, statut: newStatut } : o))
    setUpdatingId(null)
    showToast('Statut mis à jour', 'ok')
  }

  function showToast(msg: string, type: 'ok'|'wa'|'pdf' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3000)
  }

  function toggleSort(field: 'created_at'|'total') {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  function shareWhatsApp(order: Order) {
    window.open(buildWhatsAppMessage(order, shopName), '_blank')
    showToast('Message WhatsApp ouvert !', 'wa')
  }

  function handlePDF(order: Order) {
    if (!isPremium) {
      showToast('Reçu PDF — fonctionnalité Premium ⚡', 'pdf')
      return
    }
    setGeneratingPdf(order.id)
    generateHTMLReceipt(order, shopName)
    setTimeout(() => setGeneratingPdf(null), 800)
    showToast('Reçu généré ! Enregistrez en PDF', 'pdf')
  }

  const totalCA = filteredOrders.reduce((s, o) => s + o.total, 0)
  const counts  = STATUTS_FILTER.map(s => ({
    ...s, count: s.key === 'tous' ? orders.length : orders.filter(o => o.statut === s.key).length,
  }))
  const toastStyle = {
    ok:  { bg:'#0f2218', border:'rgba(46,204,135,0.3)',  color:'#2ecc87', icon:'✓'  },
    wa:  { bg:'#081a0e', border:'rgba(37,211,102,0.35)', color:'#25d366', icon:'💬' },
    pdf: { bg:'#1a1208', border:'rgba(245,166,35,0.35)', color:'#f5a623', icon:'📄' },
  }
  const tc = toastStyle[toast.type]

  return (
    <div>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        .cmd-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:12px;flex-wrap:wrap; }
        .cmd-title  { font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.5px; }
        .cmd-new-btn { background:linear-gradient(135deg,#f5a623,#ffcc6b);color:#000;border-radius:12px;padding:10px 18px;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:6px;box-shadow:0 4px 20px rgba(245,166,35,0.25);white-space:nowrap;flex-shrink:0; }

        .cmd-filters { overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin-bottom:16px; }
        .cmd-filters::-webkit-scrollbar { display:none; }
        .cmd-filters-inner { display:flex;gap:8px;min-width:max-content;padding-bottom:2px; }

        .cmd-search-row  { display:flex;gap:10px;margin-bottom:16px;align-items:center; }
        .cmd-search-wrap { position:relative;flex:1; }

        /* Action buttons */
        .abtn { display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:9px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all 0.15s;white-space:nowrap; }
        .abtn:hover { transform:translateY(-1px); }
        .abtn-wa  { background:rgba(37,211,102,0.08);color:#25d366;border:1px solid rgba(37,211,102,0.2); }
        .abtn-wa:hover  { background:rgba(37,211,102,0.16);box-shadow:0 4px 12px rgba(37,211,102,0.15); }
        .abtn-pdf { background:rgba(245,166,35,0.08);color:#f5a623;border:1px solid rgba(245,166,35,0.2); }
        .abtn-pdf:hover { background:rgba(245,166,35,0.15);box-shadow:0 4px 12px rgba(245,166,35,0.15); }
        .abtn-pdf.locked { color:#4a5470;border-color:rgba(255,255,255,0.06);background:rgba(255,255,255,0.02); }
        .abtn-pdf.locked:hover { transform:none;box-shadow:none; }
        .plk { display:inline-flex;align-items:center;gap:3px;background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.2);border-radius:20px;padding:1px 6px;font-size:9px;font-weight:700;color:#f5a623;margin-left:4px; }
        .spinner { width:11px;height:11px;border:2px solid rgba(245,166,35,0.2);border-top-color:#f5a623;border-radius:50%;animation:spin 0.7s linear infinite; }

        /* Desktop table */
        .cmd-table-wrap { background:#161a22;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden; }
        .cmd-table { width:100%;border-collapse:collapse; }

        /* Mobile cards */
        .cmd-cards { display:none;flex-direction:column;gap:10px; }
        .cmd-card  { background:#161a22;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;transition:border-color 0.2s; }
        .cmd-card:hover { border-color:rgba(255,255,255,0.1); }
        .cmd-card-main { padding:14px 16px;cursor:pointer;user-select:none; }
        .cmd-card-r1   { display:flex;align-items:center;gap:12px;margin-bottom:12px; }
        .cmd-card-r2   { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
        .cmd-avatar    { width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#000; }
        .cmd-card-actions { border-top:1px solid rgba(255,255,255,0.05);padding:11px 14px;display:flex;gap:8px;background:rgba(255,255,255,0.01);animation:fadeUp 0.2s ease; }
        .cmd-card-actions .abtn { flex:1;justify-content:center; }

        /* ── RESPONSIVE ── */
        @media (max-width:767px) {
          .cmd-header  { flex-direction:column;align-items:stretch; }
          .cmd-title   { font-size:22px; }
          .cmd-new-btn { justify-content:center; }
          .cmd-search-row  { flex-direction:column;align-items:stretch; }
          .cmd-sort-btns   { display:flex;gap:6px; }
          .cmd-table-wrap  { display:none !important; }
          .cmd-cards       { display:flex !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="cmd-header">
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <h1 className="cmd-title">Commandes</h1>
            <div style={{background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.2)',color:'#f5a623',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20}}>
              {orders.length} total
            </div>
            {isPremium && <div style={{background:'linear-gradient(135deg,rgba(245,166,35,0.1),rgba(255,204,107,0.05))',border:'1px solid rgba(245,166,35,0.2)',color:'#f5a623',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20}}>⚡ Premium</div>}
          </div>
          <p style={{color:'#717a8f',fontSize:13}}>
            CA filtré : <span style={{color:'#f5a623',fontWeight:700}}>{formatCFA(totalCA)}</span>
          </p>
        </div>
        <Link href="/commandes/nouvelle" className="cmd-new-btn">
          <span style={{fontSize:16}}>+</span> Nouvelle commande
        </Link>
      </div>

      {/* ── FILTERS ── */}
      <div className="cmd-filters">
        <div className="cmd-filters-inner">
          {counts.map(s => (
            <button key={s.key} onClick={() => setActiveStatut(s.key)} style={{
              background:activeStatut===s.key?'rgba(245,166,35,0.08)':'#1e2430',
              border:`1px solid ${activeStatut===s.key?'rgba(245,166,35,0.25)':'rgba(255,255,255,0.06)'}`,
              borderRadius:12,padding:'8px 14px',fontSize:12,fontWeight:600,
              cursor:'pointer',color:activeStatut===s.key?'#f5a623':'#717a8f',
              whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6,
            }}>
              {s.key!=='tous'&&<span style={{width:6,height:6,borderRadius:'50%',background:s.color,display:'inline-block'}}/>}
              {s.label}
              <span style={{background:'rgba(255,255,255,0.04)',padding:'1px 7px',borderRadius:20,fontSize:11}}>{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH + SORT ── */}
      <div className="cmd-search-row">
        <div className="cmd-search-wrap">
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#717a8f',fontSize:14}}>🔍</span>
          <input type="text" placeholder="Rechercher client, téléphone…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',background:'#161a22',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'10px 14px 10px 38px',fontSize:13,color:'#f0f2f7',outline:'none'}}/>
        </div>
        <div className="cmd-sort-btns" style={{display:'flex',gap:6,flexShrink:0}}>
          {([{f:'created_at' as const,l:'Date'},{f:'total' as const,l:'Montant'}]).map(s=>(
            <button key={s.f} onClick={()=>toggleSort(s.f)} style={{
              background:sortField===s.f?'rgba(245,166,35,0.08)':'#161a22',
              border:`1px solid ${sortField===s.f?'rgba(245,166,35,0.2)':'rgba(255,255,255,0.06)'}`,
              borderRadius:10,padding:'8px 12px',fontSize:12,fontWeight:600,
              color:sortField===s.f?'#f5a623':'#717a8f',cursor:'pointer',whiteSpace:'nowrap',
            }}>{s.l} {sortField===s.f?(sortDir==='desc'?'↓':'↑'):''}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{padding:60,textAlign:'center',color:'#717a8f',fontSize:13}}>Chargement…</div>
      ) : filteredOrders.length===0 ? (
        <div style={{background:'#161a22',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,padding:60,textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:16}}>📦</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:8}}>
            {orders.length===0?'Aucune commande encore':'Aucun résultat'}
          </div>
          <div style={{color:'#717a8f',fontSize:13,marginBottom:20}}>
            {orders.length===0?'Créez votre première commande':'Essayez un autre filtre'}
          </div>
          {orders.length===0&&(
            <Link href="/commandes/nouvelle" style={{background:'linear-gradient(135deg,#f5a623,#ffcc6b)',color:'#000',borderRadius:12,padding:'10px 20px',fontSize:13,fontWeight:700,textDecoration:'none',display:'inline-block'}}>
              + Créer une commande
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ══ MOBILE CARDS ══ */}
          <div className="cmd-cards">
            {filteredOrders.map(order=>{
              const s=STATUT_STYLE[order.statut]||STATUT_STYLE.en_attente
              const c=CANAL_CONFIG[order.canal]||{label:order.canal,color:'#717a8f',emoji:'🛒'}
              const initials=order.client_nom.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
              const isExp=expandedCard===order.id
              return (
                <div key={order.id} className="cmd-card">
                  <div className="cmd-card-main" onClick={()=>setExpandedCard(isExp?null:order.id)}>
                    <div className="cmd-card-r1">
                      <div className="cmd-avatar" style={{background:getGradient(order.client_nom)}}>{initials}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{order.client_nom}</div>
                        <div style={{fontSize:11,color:'#717a8f'}}>
                          <span style={{color:c.color}}>{c.emoji}</span> {c.label}
                          {order.client_phone&&` · ${order.client_phone}`}
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'#f5a623'}}>{formatCFA(order.total)}</div>
                        <div style={{fontSize:10,color:'#3a4255'}}>{isExp?'▲':'▼'} actions</div>
                      </div>
                    </div>
                    <div className="cmd-card-r2">
                      <div style={{display:'inline-flex',alignItems:'center',gap:5,background:s.bg,borderRadius:20,padding:'4px 10px',border:`1px solid ${s.color}20`}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:s.color,display:'inline-block',boxShadow:`0 0 4px ${s.color}`}}/>
                        <span style={{fontSize:11,fontWeight:600,color:s.color}}>{s.label}</span>
                      </div>
                      <span style={{fontSize:11,color:'#4a5470'}}>{new Date(order.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>
                      <div style={{marginLeft:'auto'}}>
                        <select value={order.statut} disabled={updatingId===order.id}
                          onChange={e=>{e.stopPropagation();updateStatut(order.id,e.target.value as Order['statut'])}}
                          onClick={e=>e.stopPropagation()}
                          style={{background:'#1e2430',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'5px 8px',fontSize:11,color:'#c8cdd8',cursor:'pointer',outline:'none'}}>
                          <option value="en_attente">En attente</option>
                          <option value="paye">Payé</option>
                          <option value="livre">Livré</option>
                          <option value="annule">Annulé</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {isExp&&(
                    <div className="cmd-card-actions">
                      <button className="abtn abtn-wa" onClick={()=>shareWhatsApp(order)}>💬 WhatsApp</button>
                      <button className={`abtn abtn-pdf${!isPremium?' locked':''}`} onClick={()=>handlePDF(order)}>
                        {generatingPdf===order.id?<><span className="spinner"/>...</>:isPremium?'📄 Reçu PDF':'🔒 PDF'}
                        {!isPremium&&<span className="plk">⚡ Premium</span>}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{padding:'8px 4px',display:'flex',justifyContent:'space-between',fontSize:12,color:'#717a8f'}}>
              <span>{filteredOrders.length} commande{filteredOrders.length>1?'s':''}</span>
              <span>CA : <span style={{color:'#f5a623',fontWeight:700}}>{formatCFA(totalCA)}</span></span>
            </div>
          </div>

          {/* ══ DESKTOP TABLE ══ */}
          <div className="cmd-table-wrap">
            <table className="cmd-table">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  {['Client','Canal'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'14px 16px',fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:'#717a8f'}}>{h}</th>
                  ))}
                  <th onClick={()=>toggleSort('created_at')} style={{textAlign:'left',padding:'14px 16px',fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:sortField==='created_at'?'#f5a623':'#717a8f',cursor:'pointer'}}>
                    Date {sortField==='created_at'?(sortDir==='desc'?'↓':'↑'):'↕'}
                  </th>
                  <th onClick={()=>toggleSort('total')} style={{textAlign:'left',padding:'14px 16px',fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:sortField==='total'?'#f5a623':'#717a8f',cursor:'pointer'}}>
                    Montant {sortField==='total'?(sortDir==='desc'?'↓':'↑'):'↕'}
                  </th>
                  <th style={{textAlign:'left',padding:'14px 16px',fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:'#717a8f'}}>Statut</th>
                  <th style={{textAlign:'left',padding:'14px 16px',fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:'#717a8f'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order,idx)=>{
                  const s=STATUT_STYLE[order.statut]||STATUT_STYLE.en_attente
                  const c=CANAL_CONFIG[order.canal]||{label:order.canal,color:'#717a8f',emoji:'🛒'}
                  const initials=order.client_nom.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <tr key={order.id} style={{borderBottom:idx<filteredOrders.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <td style={{padding:'13px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:getGradient(order.client_nom),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#000',flexShrink:0}}>{initials}</div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600}}>{order.client_nom}</div>
                            {order.client_phone&&<div style={{fontSize:11,color:'#717a8f'}}>{order.client_phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'13px 16px'}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:c.color,display:'inline-block',marginRight:6}}/>
                        <span style={{fontSize:12,color:'#a0a8b8'}}>{c.label}</span>
                      </td>
                      <td style={{padding:'13px 16px',fontSize:12,color:'#717a8f'}}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'2-digit'})}
                      </td>
                      <td style={{padding:'13px 16px',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14}}>{formatCFA(order.total)}</td>
                      <td style={{padding:'13px 16px'}}>
                        <div style={{display:'inline-flex',alignItems:'center',gap:5,background:s.bg,borderRadius:20,padding:'4px 10px',border:`1px solid ${s.color}20`}}>
                          <span style={{width:5,height:5,borderRadius:'50%',background:s.color,display:'inline-block',boxShadow:`0 0 4px ${s.color}`}}/>
                          <span style={{fontSize:11,fontWeight:600,color:s.color}}>{s.label}</span>
                        </div>
                      </td>
                      <td style={{padding:'13px 16px'}}>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <button className="abtn abtn-wa" onClick={()=>shareWhatsApp(order)}>💬 WhatsApp</button>
                          <button className={`abtn abtn-pdf${!isPremium?' locked':''}`} onClick={()=>handlePDF(order)}>
                            {generatingPdf===order.id?<><span className="spinner"/>...</>:isPremium?'📄 PDF':'🔒 PDF'}
                            {!isPremium&&<span className="plk">⚡</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',padding:'12px 20px',display:'flex',justifyContent:'space-between',fontSize:12,color:'#717a8f'}}>
              <span>{filteredOrders.length} commande{filteredOrders.length>1?'s':''}</span>
              <span>CA : <span style={{color:'#f5a623',fontWeight:700}}>{formatCFA(totalCA)}</span></span>
            </div>
          </div>
        </>
      )}

      {/* ── TOAST ── */}
      {toast.msg&&(
        <div style={{
          position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',
          background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,
          padding:'12px 20px',borderRadius:14,fontSize:13,fontWeight:600,
          display:'flex',alignItems:'center',gap:8,zIndex:999,
          pointerEvents:'none',whiteSpace:'nowrap',
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          animation:'fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {tc.icon} {toast.msg}
        </div>
      )}
    </div>
  )
}