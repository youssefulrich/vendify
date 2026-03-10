'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
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

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  en_attente: { label: 'En attente', bg: 'rgba(245,166,35,0.08)',  color: '#f5a623', dot: '#f5a623' },
  paye:       { label: 'Payé',       bg: 'rgba(46,204,135,0.08)',  color: '#2ecc87', dot: '#2ecc87' },
  livre:      { label: 'Livré',      bg: 'rgba(77,140,255,0.08)',  color: '#4d8cff', dot: '#4d8cff' },
  annule:     { label: 'Annulé',     bg: 'rgba(255,94,94,0.08)',   color: '#ff5e5e', dot: '#ff5e5e' },
}

const CANAL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  whatsapp:  { icon: '●', label: 'WhatsApp',  color: '#25d366' },
  instagram: { icon: '◆', label: 'Instagram', color: '#e1306c' },
  tiktok:    { icon: '▲', label: 'TikTok',    color: '#69c9d0' },
  direct:    { icon: '■', label: 'Direct',    color: '#a78bfa' },
}

const PAIEMENT_CONFIG: Record<string, { label: string; color: string }> = {
  wave:         { label: 'Wave',         color: '#2ecc87' },
  orange_money: { label: 'Orange Money', color: '#ff8c00' },
  mtn_momo:     { label: 'MTN MoMo',     color: '#ffcc00' },
  cash:         { label: 'Cash',         color: '#a78bfa' },
  autre:        { label: 'Autre',        color: '#717a8f' },
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f5a623, #ff7f50)',
  'linear-gradient(135deg, #4d8cff, #a78bfa)',
  'linear-gradient(135deg, #2ecc87, #00d4aa)',
  'linear-gradient(135deg, #ff5e5e, #ff9a3c)',
  'linear-gradient(135deg, #e1306c, #f77737)',
  'linear-gradient(135deg, #69c9d0, #4d8cff)',
]

function getGradient(name: string) {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

export default function CommandesPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [activeStatut, setActiveStatut] = useState('tous')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'created_at' | 'total'>('created_at')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadOrders() }, [])

  useEffect(() => {
    let filtered = [...orders]
    if (activeStatut !== 'tous') filtered = filtered.filter(o => o.statut === activeStatut)
    if (search) filtered = filtered.filter(o =>
      o.client_nom.toLowerCase().includes(search.toLowerCase()) ||
      o.client_phone?.includes(search)
    )
    filtered.sort((a, b) => {
      const va = sortField === 'total' ? a.total : new Date(a.created_at).getTime()
      const vb = sortField === 'total' ? b.total : new Date(b.created_at).getTime()
      return sortDir === 'desc' ? vb - va : va - vb
    })
    setFilteredOrders(filtered)
  }, [orders, activeStatut, search, sortField, sortDir])

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('orders').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatut(orderId: string, newStatut: Order['statut']) {
    setUpdatingId(orderId)
    await (supabase as any).from('orders').update({ statut: newStatut }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, statut: newStatut } : o))
    setUpdatingId(null)
    showToast('Statut mis à jour')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function toggleSort(field: 'created_at' | 'total') {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  function toggleSelect(id: string) {
    setSelectedOrders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalCA = filteredOrders.reduce((s, o) => s + o.total, 0)
  const counts = STATUTS.map(s => ({
    ...s,
    count: s.key === 'tous' ? orders.length : orders.filter(o => o.statut === s.key).length
  }))

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Commandes
            </h1>
            <div style={{
              background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.2)',
              color: '#f5a623',
              fontSize: 11, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20,
              letterSpacing: '0.5px'
            }}>
              {orders.length} total
            </div>
          </div>
          <p style={{ color: '#717a8f', fontSize: 13 }}>
            CA filtré : <span style={{ color: '#f5a623', fontWeight: 700 }}>{formatCFA(totalCA)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedOrders.size > 0 && (
            <div style={{
              background: 'rgba(77,140,255,0.08)',
              border: '1px solid rgba(77,140,255,0.2)',
              borderRadius: 12, padding: '8px 14px',
              fontSize: 12, color: '#4d8cff', fontWeight: 600
            }}>
              {selectedOrders.size} sélectionnée{selectedOrders.size > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => searchRef.current?.focus()}
            style={{
              background: '#1e2430', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer', color: '#717a8f'
            }}>
            🔍
          </button>
          <Link href="/commandes/nouvelle" style={{
            background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
            color: '#000', borderRadius: 12,
            padding: '10px 18px', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(245,166,35,0.25)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nouvelle commande
          </Link>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 flex-wrap">
        {counts.map(s => (
          <button key={s.key} onClick={() => setActiveStatut(s.key)}
            style={{
              background: activeStatut === s.key
                ? `rgba(${s.key === 'tous' ? '255,255,255' : s.key === 'en_attente' ? '245,166,35' : s.key === 'paye' ? '46,204,135' : s.key === 'livre' ? '77,140,255' : '255,94,94'},0.08)`
                : '#1e2430',
              border: `1px solid ${activeStatut === s.key
                ? `rgba(${s.key === 'tous' ? '255,255,255' : s.key === 'en_attente' ? '245,166,35' : s.key === 'paye' ? '46,204,135' : s.key === 'livre' ? '77,140,255' : '255,94,94'},0.25)`
                : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12, padding: '8px 16px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: activeStatut === s.key ? s.color : '#717a8f',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            {s.key !== 'tous' && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: s.color, display: 'inline-block',
                boxShadow: activeStatut === s.key ? `0 0 6px ${s.color}` : 'none'
              }} />
            )}
            {s.label}
            <span style={{
              background: activeStatut === s.key ? `rgba(${s.key === 'tous' ? '255,255,255' : s.key === 'en_attente' ? '245,166,35' : s.key === 'paye' ? '46,204,135' : s.key === 'livre' ? '77,140,255' : '255,94,94'},0.15)` : 'rgba(255,255,255,0.04)',
              padding: '1px 8px', borderRadius: 20, fontSize: 11
            }}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── SEARCH + SORT ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#717a8f', fontSize: 14 }}>
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Rechercher client, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#161a22',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '10px 14px 10px 38px',
              fontSize: 13, color: '#f0f2f7', outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { field: 'created_at' as const, label: 'Date' },
            { field: 'total' as const, label: 'Montant' },
          ].map(({ field, label }) => (
            <button key={field} onClick={() => toggleSort(field)}
              style={{
                background: sortField === field ? 'rgba(245,166,35,0.08)' : '#1e2430',
                border: `1px solid ${sortField === field ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: sortField === field ? '#f5a623' : '#717a8f',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
              }}>
              {label}
              <span style={{ fontSize: 10 }}>
                {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{
        background: '#161a22',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#f5a623', opacity: 0.4,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <div style={{ color: '#717a8f', fontSize: 13 }}>Chargement des commandes...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              {orders.length === 0 ? 'Aucune commande pour l\'instant' : 'Aucun résultat'}
            </div>
            <div style={{ color: '#717a8f', fontSize: 13, marginBottom: 20 }}>
              {orders.length === 0 ? 'Créez votre première commande pour commencer' : 'Essayez un autre filtre'}
            </div>
            {orders.length === 0 && (
              <Link href="/commandes/nouvelle" style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', borderRadius: 12, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                display: 'inline-block'
              }}>
                + Créer une commande
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ width: 40, padding: '14px 16px' }}>
                    <input type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={e => {
                        if (e.target.checked) setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
                        else setSelectedOrders(new Set())
                      }}
                      style={{ accentColor: '#f5a623', width: 14, height: 14, cursor: 'pointer' }}
                    />
                  </th>
                  {['Client', 'Canal', 'Montant', 'Paiement', 'Statut', 'Date', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: 'left', padding: '14px 16px',
                      fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
                      textTransform: 'uppercase', color: '#717a8f'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => {
                  const s = STATUT_STYLE[order.statut]
                  const canal = CANAL_CONFIG[order.canal] || CANAL_CONFIG.direct
                  const paiement = PAIEMENT_CONFIG[order.mode_paiement] || PAIEMENT_CONFIG.autre
                  const initials = order.client_nom.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  const isSelected = selectedOrders.has(order.id)
                  const isUpdating = updatingId === order.id

                  return (
                    <tr key={order.id}
                      style={{
                        borderBottom: idx < filteredOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: isSelected ? 'rgba(245,166,35,0.03)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => toggleSelect(order.id)}
                          style={{ accentColor: '#f5a623', width: 14, height: 14, cursor: 'pointer' }}
                        />
                      </td>

                      {/* Client */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: getGradient(order.client_nom),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#000', flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{order.client_nom}</div>
                            {order.client_phone && (
                              <div style={{ fontSize: 11, color: '#717a8f', marginTop: 1 }}>{order.client_phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Canal */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: canal.color, fontSize: 8 }}>{canal.icon}</span>
                          <span style={{ fontSize: 12, color: '#a0a8b8', fontWeight: 500 }}>{canal.label}</span>
                        </div>
                      </td>

                      {/* Montant */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14 }}>
                          {formatCFA(order.total)}
                        </span>
                      </td>

                      {/* Paiement */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: paiement.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#a0a8b8' }}>{paiement.label}</span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: s.bg, borderRadius: 20,
                          padding: '4px 10px', border: `1px solid ${s.color}20`
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: s.dot, display: 'inline-block',
                            boxShadow: `0 0 4px ${s.dot}`
                          }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: '#717a8f' }}>
                          {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={{ fontSize: 10, color: '#4a5266', marginTop: 1 }}>
                          {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={order.statut}
                          disabled={isUpdating}
                          onChange={e => updateStatut(order.id, e.target.value as Order['statut'])}
                          style={{
                            background: '#1e2430',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, padding: '6px 10px',
                            fontSize: 11, color: '#f0f2f7', outline: 'none',
                            cursor: 'pointer', fontWeight: 500,
                            opacity: isUpdating ? 0.5 : 1,
                            transition: 'all 0.15s'
                          }}>
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

            {/* Footer */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <span style={{ fontSize: 12, color: '#717a8f' }}>
                {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
                {selectedOrders.size > 0 && ` · ${selectedOrders.size} sélectionnée${selectedOrders.size > 1 ? 's' : ''}`}
              </span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#f5a623' }}>
                {formatCFA(totalCA)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── TOAST ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: '#161a22',
        border: '1px solid rgba(46,204,135,0.3)',
        color: '#2ecc87', padding: '12px 20px',
        borderRadius: 12, fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
        transform: toast ? 'translateY(0)' : 'translateY(80px)',
        opacity: toast ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 999, pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <span>✓</span> {toast}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}