'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCFA } from '@/lib/utils/formatCFA'
import type { Order } from '@/lib/supabase/types'

const STATUTS = [
  { key: 'tous',       label: 'Toutes',     color: '#ffffff' },
  { key: 'en_attente', label: 'En attente', color: '#f5a623' },
  { key: 'paye',       label: 'Payées',     color: '#2ecc87' },
  { key: 'livre',      label: 'Livrées',    color: '#4d8cff' },
  { key: 'annule',     label: 'Annulées',   color: '#ff5e5e' },
]

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

const GRADIENTS = [
  'linear-gradient(135deg,#f5a623,#ff7f50)',
  'linear-gradient(135deg,#4d8cff,#a78bfa)',
  'linear-gradient(135deg,#2ecc87,#00d4aa)',
  'linear-gradient(135deg,#ff5e5e,#ff9a3c)',
  'linear-gradient(135deg,#e1306c,#f77737)',
  'linear-gradient(135deg,#69c9d0,#4d8cff)',
]
const getGradient = (name: string) => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length]

export default function CommandesPage() {
  const supabase = createClient()
  const [orders, setOrders]               = useState<Order[]>([])
  const [filteredOrders, setFiltered]     = useState<Order[]>([])
  const [activeStatut, setActiveStatut]   = useState('tous')
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [sortField, setSortField]         = useState<'created_at'|'total'>('created_at')
  const [sortDir, setSortDir]             = useState<'desc'|'asc'>('desc')
  const [updatingId, setUpdatingId]       = useState<string|null>(null)
  const [toast, setToast]                 = useState('')

  useEffect(() => { loadOrders() }, [])

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

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('orders').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatut(id: string, newStatut: Order['statut']) {
    setUpdatingId(id)
    await (supabase as any).from('orders').update({ statut: newStatut }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, statut: newStatut } : o))
    setUpdatingId(null)
    setToast('Statut mis à jour')
    setTimeout(() => setToast(''), 2500)
  }

  function toggleSort(field: 'created_at'|'total') {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const totalCA = filteredOrders.reduce((s, o) => s + o.total, 0)
  const counts  = STATUTS.map(s => ({
    ...s,
    count: s.key === 'tous' ? orders.length : orders.filter(o => o.statut === s.key).length,
  }))

  return (
    <div>
      <style>{`
        /* ─── HEADER ─── */
        .cmd-header {
          display:flex; align-items:flex-start;
          justify-content:space-between;
          margin-bottom:24px; gap:12px; flex-wrap:wrap;
        }
        .cmd-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
        .cmd-new-btn {
          background:linear-gradient(135deg,#f5a623,#ffcc6b); color:#000;
          border-radius:12px; padding:10px 18px; font-size:13px; font-weight:700;
          text-decoration:none; display:flex; align-items:center; gap:6px;
          box-shadow:0 4px 20px rgba(245,166,35,0.25); white-space:nowrap; flex-shrink:0;
        }

        /* ─── FILTERS ─── */
        .cmd-filters { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; margin-bottom:16px; }
        .cmd-filters::-webkit-scrollbar { display:none; }
        .cmd-filters-inner { display:flex; gap:8px; min-width:max-content; padding-bottom:2px; }

        /* ─── SEARCH ROW ─── */
        .cmd-search-row { display:flex; gap:10px; margin-bottom:16px; align-items:center; }
        .cmd-search-wrap { position:relative; flex:1; }

        /* ─── TABLE (desktop) ─── */
        .cmd-table-wrap {
          background:#161a22; border:1px solid rgba(255,255,255,0.06);
          border-radius:20px; overflow:hidden;
        }
        .cmd-table { width:100%; border-collapse:collapse; }

        /* ─── CARDS (mobile) — hidden by default ─── */
        .cmd-cards { display:none; flex-direction:column; gap:10px; }
        .cmd-card {
          background:#161a22; border:1px solid rgba(255,255,255,0.06);
          border-radius:16px; padding:14px 16px;
        }
        .cmd-card-r1 { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .cmd-card-r2 { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .cmd-avatar {
          width:38px; height:38px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; color:#000;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width:767px) {
          /* header */
          .cmd-header    { flex-direction:column; align-items:stretch; }
          .cmd-title     { font-size:22px; }
          .cmd-new-btn   { justify-content:center; }

          /* search */
          .cmd-search-row { flex-direction:column; align-items:stretch; }
          .cmd-sort-btns  { display:flex; gap:6px; }

          /* show cards, hide table */
          .cmd-table-wrap { display:none !important; }
          .cmd-cards      { display:flex !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="cmd-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 className="cmd-title">Commandes</h1>
            <div style={{ background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.2)', color:'#f5a623', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
              {orders.length} total
            </div>
          </div>
          <p style={{ color:'#717a8f', fontSize:13 }}>
            CA filtré : <span style={{ color:'#f5a623', fontWeight:700 }}>{formatCFA(totalCA)}</span>
          </p>
        </div>
        <Link href="/commandes/nouvelle" className="cmd-new-btn">
          <span style={{ fontSize:16 }}>+</span> Nouvelle commande
        </Link>
      </div>

      {/* ── FILTERS ── */}
      <div className="cmd-filters">
        <div className="cmd-filters-inner">
          {counts.map(s => (
            <button key={s.key} onClick={() => setActiveStatut(s.key)} style={{
              background: activeStatut === s.key ? 'rgba(245,166,35,0.08)' : '#1e2430',
              border:`1px solid ${activeStatut === s.key ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:12, padding:'8px 14px', fontSize:12, fontWeight:600,
              cursor:'pointer', color: activeStatut === s.key ? '#f5a623' : '#717a8f',
              whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
            }}>
              {s.key !== 'tous' && <span style={{ width:6, height:6, borderRadius:'50%', background:s.color, display:'inline-block' }} />}
              {s.label}
              <span style={{ background:'rgba(255,255,255,0.04)', padding:'1px 7px', borderRadius:20, fontSize:11 }}>{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH + SORT ── */}
      <div className="cmd-search-row">
        <div className="cmd-search-wrap">
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#717a8f', fontSize:14 }}>🔍</span>
          <input type="text" placeholder="Rechercher client, téléphone…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', background:'#161a22', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 14px 10px 38px', fontSize:13, color:'#f0f2f7', outline:'none' }}
          />
        </div>
        <div className="cmd-sort-btns" style={{ display:'flex', gap:6, flexShrink:0 }}>
          {([{ f:'created_at' as const, l:'Date' }, { f:'total' as const, l:'Montant' }]).map(s => (
            <button key={s.f} onClick={() => toggleSort(s.f)} style={{
              background: sortField === s.f ? 'rgba(245,166,35,0.08)' : '#161a22',
              border:`1px solid ${sortField === s.f ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:10, padding:'8px 12px', fontSize:12, fontWeight:600,
              color: sortField === s.f ? '#f5a623' : '#717a8f', cursor:'pointer', whiteSpace:'nowrap',
            }}>
              {s.l} {sortField === s.f ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── STATES ── */}
      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#717a8f', fontSize:13 }}>Chargement…</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background:'#161a22', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📦</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:8 }}>
            {orders.length === 0 ? 'Aucune commande encore' : 'Aucun résultat'}
          </div>
          <div style={{ color:'#717a8f', fontSize:13, marginBottom:20 }}>
            {orders.length === 0 ? 'Créez votre première commande' : 'Essayez un autre filtre'}
          </div>
          {orders.length === 0 && (
            <Link href="/commandes/nouvelle" style={{ background:'linear-gradient(135deg,#f5a623,#ffcc6b)', color:'#000', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:700, textDecoration:'none', display:'inline-block' }}>
              + Créer une commande
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ══ MOBILE CARDS — affiché via CSS @media ══ */}
          <div className="cmd-cards">
            {filteredOrders.map(order => {
              const s  = STATUT_STYLE[order.statut] || STATUT_STYLE.en_attente
              const c  = CANAL_CONFIG[order.canal]  || { label:order.canal, color:'#717a8f', emoji:'🛒' }
              const initials = order.client_nom.split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase()
              return (
                <div key={order.id} className="cmd-card">
                  <div className="cmd-card-r1">
                    <div className="cmd-avatar" style={{ background:getGradient(order.client_nom) }}>{initials}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{order.client_nom}</div>
                      <div style={{ fontSize:11, color:'#717a8f' }}>
                        <span style={{ color:c.color }}>{c.emoji}</span> {c.label}
                        {order.client_phone && ` · ${order.client_phone}`}
                      </div>
                    </div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'#f5a623', flexShrink:0 }}>
                      {formatCFA(order.total)}
                    </div>
                  </div>
                  <div className="cmd-card-r2">
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, borderRadius:20, padding:'4px 10px', border:`1px solid ${s.color}20` }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block', boxShadow:`0 0 4px ${s.color}` }} />
                      <span style={{ fontSize:11, fontWeight:600, color:s.color }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize:11, color:'#4a5470' }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR',{ day:'2-digit', month:'short' })}
                    </span>
                    <div style={{ marginLeft:'auto' }}>
                      <select value={order.statut} disabled={updatingId === order.id}
                        onChange={e => updateStatut(order.id, e.target.value as Order['statut'])}
                        style={{ background:'#1e2430', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'5px 8px', fontSize:11, color:'#c8cdd8', cursor:'pointer', outline:'none' }}>
                        <option value="en_attente">En attente</option>
                        <option value="paye">Payé</option>
                        <option value="livre">Livré</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
            <div style={{ padding:'8px 4px', display:'flex', justifyContent:'space-between', fontSize:12, color:'#717a8f' }}>
              <span>{filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}</span>
              <span>CA : <span style={{ color:'#f5a623', fontWeight:700 }}>{formatCFA(totalCA)}</span></span>
            </div>
          </div>

          {/* ══ DESKTOP TABLE — caché via CSS @media ══ */}
          <div className="cmd-table-wrap">
            <table className="cmd-table">
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  {['Client','Canal'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'14px 16px', fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'#717a8f' }}>{h}</th>
                  ))}
                  <th onClick={() => toggleSort('created_at')} style={{ textAlign:'left', padding:'14px 16px', fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color: sortField==='created_at' ? '#f5a623' : '#717a8f', cursor:'pointer' }}>
                    Date {sortField==='created_at' ? (sortDir==='desc' ? '↓':'↑') : '↕'}
                  </th>
                  <th onClick={() => toggleSort('total')} style={{ textAlign:'left', padding:'14px 16px', fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color: sortField==='total' ? '#f5a623' : '#717a8f', cursor:'pointer' }}>
                    Montant {sortField==='total' ? (sortDir==='desc' ? '↓':'↑') : '↕'}
                  </th>
                  <th style={{ textAlign:'left', padding:'14px 16px', fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'#717a8f' }}>Statut</th>
                  <th style={{ textAlign:'left', padding:'14px 16px', fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'#717a8f' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => {
                  const s = STATUT_STYLE[order.statut] || STATUT_STYLE.en_attente
                  const c = CANAL_CONFIG[order.canal]  || { label:order.canal, color:'#717a8f', emoji:'🛒' }
                  const initials = order.client_nom.split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <tr key={order.id}
                      style={{ borderBottom: idx < filteredOrders.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:getGradient(order.client_nom), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#000', flexShrink:0 }}>{initials}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600 }}>{order.client_nom}</div>
                            {order.client_phone && <div style={{ fontSize:11, color:'#717a8f' }}>{order.client_phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:c.color, display:'inline-block', marginRight:6 }} />
                        <span style={{ fontSize:12, color:'#a0a8b8' }}>{c.label}</span>
                      </td>
                      <td style={{ padding:'13px 16px', fontSize:12, color:'#717a8f' }}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR',{ day:'2-digit', month:'short', year:'2-digit' })}
                      </td>
                      <td style={{ padding:'13px 16px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14 }}>
                        {formatCFA(order.total)}
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, borderRadius:20, padding:'4px 10px', border:`1px solid ${s.color}20` }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block', boxShadow:`0 0 4px ${s.color}` }} />
                          <span style={{ fontSize:11, fontWeight:600, color:s.color }}>{s.label}</span>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <select value={order.statut} disabled={updatingId === order.id}
                          onChange={e => updateStatut(order.id, e.target.value as Order['statut'])}
                          style={{ background:'#1e2430', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 10px', fontSize:12, color:'#c8cdd8', cursor:'pointer', outline:'none' }}>
                          <option value="en_attente">En attente</option>
                          <option value="paye">Payé</option>
                          <option value="livre">Livré</option>
                          <option value="annule">Annulé</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'12px 20px', display:'flex', justifyContent:'space-between', fontSize:12, color:'#717a8f' }}>
              <span>{filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}</span>
              <span>CA : <span style={{ color:'#f5a623', fontWeight:700 }}>{formatCFA(totalCA)}</span></span>
            </div>
          </div>
        </>
      )}

      {/* ── TOAST ── */}
      <div style={{
        position:'fixed', bottom:24, left:'50%',
        transform:`translateX(-50%) translateY(${toast ? '0' : '80px'})`,
        background:'#161a22', border:'1px solid rgba(46,204,135,0.3)',
        color:'#2ecc87', padding:'12px 20px', borderRadius:12,
        fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8,
        opacity: toast ? 1 : 0,
        transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex:999, pointerEvents:'none', whiteSpace:'nowrap',
        boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
      }}>
        ✓ {toast}
      </div>
    </div>
  )
}