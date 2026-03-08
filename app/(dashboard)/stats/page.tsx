'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCFA } from '@/lib/utils/formatCFA'

type StatRow = {
  user_id: string
  mois: string
  nb_commandes: number
  nb_clients: number
  chiffre_affaires: number
  benefice: number
}

function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 2, boxShadow: `0 0 6px ${color}60`,
          transition: 'width 0.6s ease'
        }} />
      </div>
      <span style={{ fontSize: 10, color: '#717a8f', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

export default function StatsPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<StatRow[]>([])
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [statsRes, profileRes] = await Promise.all([
        supabase.from('stats_monthly').select('*').eq('user_id', user.id).order('mois', { ascending: false }).limit(6),
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
      ])
      setStats(statsRes.data || [])
      setPlan(profileRes.data?.plan || 'free')
      setLoading(false)
    }
    load()
  }, [])

  const current = stats[0]
  const prev = stats[1]

  const growth = (curr: number, prev: number) => {
    if (!prev || prev === 0) return null
    const pct = Math.round(((curr - prev) / prev) * 100)
    return pct
  }

  const caGrowth = current && prev ? growth(current.chiffre_affaires, prev.chiffre_affaires) : null
  const benGrowth = current && prev ? growth(current.benefice, prev.benefice) : null

  const maxCA = Math.max(...stats.map(s => s.chiffre_affaires), 1)
  const maxBen = Math.max(...stats.map(s => s.benefice), 1)
  const maxCmds = Math.max(...stats.map(s => s.nb_commandes), 1)

  const totalCA = stats.reduce((s, r) => s + r.chiffre_affaires, 0)
  const totalBen = stats.reduce((s, r) => s + r.benefice, 0)
  const totalCmds = stats.reduce((s, r) => s + r.nb_commandes, 0)
  const avgMarge = current?.chiffre_affaires > 0
    ? Math.round((current.benefice / current.chiffre_affaires) * 100)
    : 0

  const statCards = [
    {
      label: "CA ce mois", icon: '💰', color: '#f5a623',
      value: formatCFA(current?.chiffre_affaires || 0),
      growth: caGrowth, sub: `Total 6 mois : ${formatCFA(totalCA)}`
    },
    {
      label: 'Bénéfice ce mois', icon: '💎', color: '#4d8cff',
      value: formatCFA(current?.benefice || 0),
      growth: benGrowth, sub: `Total 6 mois : ${formatCFA(totalBen)}`
    },
    {
      label: 'Commandes', icon: '📦', color: '#2ecc87',
      value: current?.nb_commandes || 0,
      growth: null, sub: `Total 6 mois : ${totalCmds}`
    },
    {
      label: 'Marge nette', icon: '📈', color: '#c77dff',
      value: `+${avgMarge}%`,
      growth: null, sub: 'Ce mois vs ventes'
    },
  ]

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Statistiques
          </h1>
          {plan === 'premium' && (
            <div style={{
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
              color: '#f5a623', fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20, letterSpacing: '1px', textTransform: 'uppercase'
            }}>
              ⚡ Premium
            </div>
          )}
        </div>
        <p style={{ color: '#717a8f', fontSize: 13 }}>
          Analyse des 6 derniers mois · {stats.length} période{stats.length > 1 ? 's' : ''} disponible{stats.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = 'none'
          }}
          >
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: card.color, opacity: 0.7 }} />

            {/* Glow bg */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: card.color, opacity: 0.04, filter: 'blur(20px)'
            }} />

            <div style={{ fontSize: 22, marginBottom: 14 }}>{card.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#717a8f', marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', marginBottom: 6 }}>
              {loading ? <span style={{ color: '#2a3040' }}>——</span> : card.value}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 11, color: '#4a5266' }}>{card.sub}</div>
              {card.growth !== null && card.growth !== undefined && (
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: card.growth >= 0 ? 'rgba(46,204,135,0.1)' : 'rgba(255,94,94,0.1)',
                  color: card.growth >= 0 ? '#2ecc87' : '#ff5e5e',
                  border: `1px solid ${card.growth >= 0 ? 'rgba(46,204,135,0.2)' : 'rgba(255,94,94,0.2)'}`,
                  whiteSpace: 'nowrap'
                }}>
                  {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── VISUAL BARS ── */}
      {stats.length > 0 && (
        <div style={{
          background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18, padding: '22px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Évolution mensuelle
            </h2>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              {[
                { color: '#f5a623', label: "CA" },
                { color: '#2ecc87', label: 'Bénéfice' },
                { color: '#4d8cff', label: 'Commandes' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#717a8f' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...stats].reverse().map((row, i) => {
              const mois = new Date(row.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
              const isLatest = i === stats.length - 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, fontSize: 11, fontWeight: isLatest ? 700 : 400,
                    color: isLatest ? '#f5a623' : '#717a8f', flexShrink: 0, textAlign: 'right'
                  }}>
                    {mois}
                    {isLatest && <div style={{ fontSize: 8, color: '#f5a623', letterSpacing: '1px' }}>CE MOIS</div>}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <SparkBar value={row.chiffre_affaires} max={maxCA} color="#f5a623" />
                    <SparkBar value={row.benefice} max={maxBen} color="#2ecc87" />
                    <SparkBar value={row.nb_commandes} max={maxCmds} color="#4d8cff" />
                  </div>
                  <div style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, color: '#f5a623' }}>
                      {formatCFA(row.chiffre_affaires)}
                    </div>
                    <div style={{ fontSize: 10, color: '#2ecc87' }}>+{formatCFA(row.benefice)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      <div style={{
        background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18, overflow: 'hidden', marginBottom: 20
      }}>
        <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, paddingBottom: 14 }}>
            Historique mensuel
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#717a8f', fontSize: 13 }}>Chargement...</div>
        ) : stats.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ color: '#717a8f', fontSize: 13 }}>Créez vos premières commandes pour voir les statistiques</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Mois', 'Commandes', 'Clients', "Chiffre d'affaires", 'Bénéfice', 'Marge'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 16px',
                      fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
                      textTransform: 'uppercase', color: '#717a8f'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((row, i) => {
                  const marge = row.chiffre_affaires > 0
                    ? Math.round((row.benefice / row.chiffre_affaires) * 100) : 0
                  const isFirst = i === 0

                  return (
                    <tr key={i}
                      style={{
                        borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        background: isFirst ? 'rgba(245,166,35,0.02)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => !isFirst && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => !isFirst && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: isFirst ? 700 : 500 }}>
                            {new Date(row.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </span>
                          {isFirst && (
                            <span style={{
                              background: '#f5a623', color: '#000',
                              fontSize: 9, fontWeight: 800, padding: '2px 7px',
                              borderRadius: 20, letterSpacing: '0.5px', textTransform: 'uppercase'
                            }}>
                              En cours
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>{row.nb_commandes}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>{row.nb_clients}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13 }}>
                        {formatCFA(row.chiffre_affaires)}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#2ecc87' }}>
                        {formatCFA(row.benefice)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: marge >= 25 ? 'rgba(46,204,135,0.08)' : 'rgba(245,166,35,0.08)',
                          border: `1px solid ${marge >= 25 ? 'rgba(46,204,135,0.2)' : 'rgba(245,166,35,0.2)'}`,
                          borderRadius: 8, padding: '2px 8px',
                          fontSize: 12, fontWeight: 800, fontFamily: 'Syne, sans-serif',
                          color: marge >= 25 ? '#2ecc87' : '#f5a623'
                        }}>
                          +{marge}%
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '12px 20px',
              display: 'flex', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.01)', fontSize: 12
            }}>
              <span style={{ color: '#717a8f' }}>Total sur {stats.length} mois</span>
              <div style={{ display: 'flex', gap: 20 }}>
                <span style={{ color: '#717a8f' }}>
                  CA : <span style={{ color: '#f5a623', fontWeight: 700 }}>{formatCFA(totalCA)}</span>
                </span>
                <span style={{ color: '#717a8f' }}>
                  Bénéfice : <span style={{ color: '#2ecc87', fontWeight: 700 }}>{formatCFA(totalBen)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PREMIUM UPSELL ── */}
      {plan === 'free' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(255,204,107,0.02))',
          border: '1px solid rgba(245,166,35,0.18)',
          borderRadius: 18, padding: '28px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
            Débloquez les statistiques avancées
          </div>
          <div style={{ color: '#717a8f', fontSize: 13, marginBottom: 20, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 20px' }}>
            Graphiques interactifs, top produits par rentabilité, analyse clients, export Excel et bien plus
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {['📉 Graphiques', '🏆 Top produits', '👥 Analyse clients', '📥 Export Excel'].map(f => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '6px 14px', fontSize: 12, color: '#a0a8b8'
              }}>
                {f}
              </div>
            ))}
          </div>

          <button style={{
            background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
            color: '#000', border: 'none', borderRadius: 12,
            padding: '12px 28px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,166,35,0.3)'
          }}>
            ⚡ Passer Premium — 3 000 FCFA/mois
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}