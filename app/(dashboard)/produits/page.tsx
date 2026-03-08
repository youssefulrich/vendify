export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCFA } from '@/lib/utils/formatCFA'
import type { Product } from '@/lib/supabase/types'

const PRODUCT_EMOJIS = ['👟', '👜', '🌸', '🧵', '💍', '👗', '🕶️', '👒', '🧴', '💎', '🎁', '📦']

function getEmoji(nom: string) {
  return PRODUCT_EMOJIS[nom.charCodeAt(0) % PRODUCT_EMOJIS.length]
}

const PRODUCT_GRADIENTS = [
  'linear-gradient(135deg, #f5a62315, #ffcc6b08)',
  'linear-gradient(135deg, #4d8cff15, #a78bfa08)',
  'linear-gradient(135deg, #2ecc8715, #00d4aa08)',
  'linear-gradient(135deg, #ff5e5e15, #ff9a3c08)',
  'linear-gradient(135deg, #e1306c15, #f7773708)',
  'linear-gradient(135deg, #69c9d015, #4d8cff08)',
]

function getGradient(nom: string) {
  return PRODUCT_GRADIENTS[nom.charCodeAt(0) % PRODUCT_GRADIENTS.length]
}

type SortField = 'nom' | 'prix_vente' | 'stock' | 'marge'

export default function ProduitsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('nom')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterStock, setFilterStock] = useState<'tous' | 'ok' | 'faible' | 'rupture'>('tous')
  const [toast, setToast] = useState('')
  const [archivingId, setArchivingId] = useState<string | null>(null)

  useEffect(() => { loadProducts() }, [])

  useEffect(() => {
    let list = [...products]
    if (search) list = list.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))
    if (filterStock === 'ok') list = list.filter(p => p.stock > p.stock_alerte)
    if (filterStock === 'faible') list = list.filter(p => p.stock > 0 && p.stock <= p.stock_alerte)
    if (filterStock === 'rupture') list = list.filter(p => p.stock <= 0)

    list.sort((a, b) => {
      let va: number | string, vb: number | string
      if (sortField === 'marge') {
        va = a.prix_achat > 0 ? ((a.prix_vente - a.prix_achat) / a.prix_achat) * 100 : 0
        vb = b.prix_achat > 0 ? ((b.prix_vente - b.prix_achat) / b.prix_achat) * 100 : 0
      } else {
        va = a[sortField]
        vb = b[sortField]
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    setFiltered(list)
  }, [products, search, sortField, sortDir, filterStock])

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('products').select('*').eq('user_id', user.id).eq('actif', true)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

async function archiver(id: string) {
    setArchivingId(id)
    await (supabase as any).from('products').update({ actif: false }).eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setArchivingId(null)
    showToast('Produit archivé')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const marge = (p: Product) =>
    p.prix_achat > 0 ? Math.round(((p.prix_vente - p.prix_achat) / p.prix_achat) * 100) : 0

  const stockStatus = (p: Product) => {
    if (p.stock <= 0) return { label: 'Rupture', color: '#ff5e5e', bg: 'rgba(255,94,94,0.08)', glow: '#ff5e5e' }
    if (p.stock <= p.stock_alerte) return { label: 'Stock faible', color: '#f5a623', bg: 'rgba(245,166,35,0.08)', glow: '#f5a623' }
    return { label: 'Disponible', color: '#2ecc87', bg: 'rgba(46,204,135,0.08)', glow: '#2ecc87' }
  }

  const stockPct = (p: Product) => Math.min(100, (p.stock / Math.max(p.stock + 5, 20)) * 100)

  const totalValeur = products.reduce((s, p) => s + p.prix_vente * p.stock, 0)
  const avgMarge = products.length > 0
    ? Math.round(products.reduce((s, p) => s + marge(p), 0) / products.length)
    : 0
  const enRupture = products.filter(p => p.stock <= 0).length
  const stockFaible = products.filter(p => p.stock > 0 && p.stock <= p.stock_alerte).length

  const STOCK_FILTERS = [
    { key: 'tous',    label: 'Tous',         count: products.length },
    { key: 'ok',      label: 'Disponibles',  count: products.filter(p => p.stock > p.stock_alerte).length },
    { key: 'faible',  label: 'Stock faible', count: stockFaible },
    { key: 'rupture', label: 'Rupture',      count: enRupture },
  ]

  const SORT_COLS = [
    { field: 'nom' as SortField,       label: 'Produit' },
    { field: 'prix_vente' as SortField, label: 'Prix vente' },
    { field: 'marge' as SortField,     label: 'Marge' },
    { field: 'stock' as SortField,     label: 'Stock' },
  ]

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Produits
            </h1>
            <div style={{
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
              color: '#f5a623', fontSize: 11, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20, letterSpacing: '0.5px'
            }}>
              {products.length} produit{products.length > 1 ? 's' : ''}
            </div>
          </div>
          <p style={{ color: '#717a8f', fontSize: 13 }}>
            Valeur stock : <span style={{ color: '#f5a623', fontWeight: 700 }}>{formatCFA(totalValeur)}</span>
            <span style={{ margin: '0 8px', color: '#2a3040' }}>·</span>
            Marge moy. : <span style={{ color: '#2ecc87', fontWeight: 700 }}>+{avgMarge}%</span>
          </p>
        </div>
        <Link href="/produits/nouveau" style={{
          background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
          color: '#000', borderRadius: 12, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 20px rgba(245,166,35,0.25)'
        }}>
          <span style={{ fontSize: 16 }}>+</span> Nouveau produit
        </Link>
      </div>

      {/* ── MINI STATS ── */}
      {products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total produits', value: products.length, icon: '🏷️', color: '#f5a623' },
            { label: 'Valeur totale', value: formatCFA(totalValeur), icon: '💰', color: '#4d8cff' },
            { label: 'Marge moyenne', value: `+${avgMarge}%`, icon: '📈', color: '#2ecc87' },
            { label: 'Alertes stock', value: enRupture + stockFaible, icon: '⚠️', color: enRupture > 0 ? '#ff5e5e' : '#f5a623' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: stat.color, opacity: 0.6
              }} />
              <div style={{ fontSize: 18, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#717a8f', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-wrap">
        {STOCK_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilterStock(f.key as any)}
            style={{
              background: filterStock === f.key ? 'rgba(245,166,35,0.08)' : '#1e2430',
              border: `1px solid ${filterStock === f.key ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', color: filterStock === f.key ? '#f5a623' : '#717a8f',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 7
            }}>
            {f.key === 'faible' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5a623', display: 'inline-block' }} />}
            {f.key === 'rupture' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5e5e', display: 'inline-block' }} />}
            {f.label}
            <span style={{
              background: filterStock === f.key ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.04)',
              padding: '1px 7px', borderRadius: 20, fontSize: 11
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#717a8f', fontSize: 14 }}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: '#161a22',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '10px 14px 10px 38px',
            fontSize: 13, color: '#f0f2f7', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
        />
      </div>

      {/* ── TABLE ── */}
      <div style={{
        background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#f5a623', opacity: 0.4,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <div style={{ color: '#717a8f', fontSize: 13 }}>Chargement des produits...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              {products.length === 0 ? 'Aucun produit encore' : 'Aucun résultat'}
            </div>
            <div style={{ color: '#717a8f', fontSize: 13, marginBottom: 20 }}>
              {products.length === 0 ? 'Ajoutez votre premier produit pour commencer' : 'Essayez un autre filtre'}
            </div>
            {products.length === 0 && (
              <Link href="/produits/nouveau" style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', borderRadius: 12, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block'
              }}>+ Ajouter un produit</Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {SORT_COLS.map(col => (
                    <th key={col.field}
                      onClick={() => toggleSort(col.field)}
                      style={{
                        textAlign: 'left', padding: '14px 16px',
                        fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        color: sortField === col.field ? '#f5a623' : '#717a8f',
                        cursor: 'pointer', userSelect: 'none',
                        transition: 'color 0.15s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.label}
                        <span style={{ fontSize: 9, opacity: 0.7 }}>
                          {sortField === col.field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#717a8f' }}>
                    Statut
                  </th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#717a8f' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const m = marge(p)
                  const ss = stockStatus(p)
                  const pct = stockPct(p)
                  const isArchiving = archivingId === p.id

                  return (
                    <tr key={p.id}
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Produit */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                            background: getGradient(p.nom),
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20
                          }}>
                            {p.photo_url
                              ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} alt="" />
                              : getEmoji(p.nom)
                            }
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nom}</div>
                            {p.description && (
                              <div style={{ fontSize: 11, color: '#717a8f', marginTop: 2 }}>
                                {p.description.slice(0, 35)}{p.description.length > 35 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Prix vente */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14 }}>
                          {formatCFA(p.prix_vente)}
                        </div>
                        <div style={{ fontSize: 11, color: '#717a8f', marginTop: 1 }}>
                          Achat : {formatCFA(p.prix_achat)}
                        </div>
                      </td>

                      {/* Marge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: m >= 30 ? 'rgba(46,204,135,0.08)' : m >= 15 ? 'rgba(245,166,35,0.08)' : 'rgba(255,94,94,0.08)',
                          border: `1px solid ${m >= 30 ? 'rgba(46,204,135,0.2)' : m >= 15 ? 'rgba(245,166,35,0.2)' : 'rgba(255,94,94,0.2)'}`,
                          borderRadius: 8, padding: '3px 10px'
                        }}>
                          <span style={{
                            fontSize: 13, fontWeight: 800, fontFamily: 'Syne, sans-serif',
                            color: m >= 30 ? '#2ecc87' : m >= 15 ? '#f5a623' : '#ff5e5e'
                          }}>
                            +{m}%
                          </span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 52, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: 3,
                              background: ss.color,
                              boxShadow: `0 0 6px ${ss.glow}60`,
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: ss.color, minWidth: 20 }}>
                            {p.stock}
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: ss.bg, borderRadius: 20, padding: '4px 10px',
                          border: `1px solid ${ss.color}20`
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: ss.color, display: 'inline-block',
                            boxShadow: `0 0 4px ${ss.glow}`
                          }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: ss.color }}>{ss.label}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/produits/${p.id}`} style={{
                            fontSize: 12, padding: '6px 12px', borderRadius: 8, fontWeight: 600,
                            background: '#1e2430', color: '#f0f2f7',
                            border: '1px solid rgba(255,255,255,0.08)',
                            textDecoration: 'none', display: 'inline-block',
                            transition: 'all 0.15s'
                          }}>
                            Modifier
                          </Link>
                          <button
                            onClick={() => archiver(p.id)}
                            disabled={isArchiving}
                            style={{
                              fontSize: 12, padding: '6px 12px', borderRadius: 8, fontWeight: 600,
                              background: 'rgba(255,94,94,0.08)', color: '#ff5e5e',
                              border: '1px solid rgba(255,94,94,0.15)',
                              cursor: isArchiving ? 'not-allowed' : 'pointer',
                              opacity: isArchiving ? 0.5 : 1, transition: 'all 0.15s'
                            }}>
                            {isArchiving ? '...' : 'Archiver'}
                          </button>
                        </div>
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
                {filtered.length} produit{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 12, color: '#717a8f' }}>
                Valeur : <span style={{ color: '#f5a623', fontWeight: 700 }}>{formatCFA(filtered.reduce((s, p) => s + p.prix_vente * p.stock, 0))}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── TOAST ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: '#161a22', border: '1px solid rgba(46,204,135,0.3)',
        color: '#2ecc87', padding: '12px 20px', borderRadius: 12,
        fontSize: 13, fontWeight: 600,
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