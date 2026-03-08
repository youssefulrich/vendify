'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCFA } from '@/lib/utils/formatCFA'

type Stats = {
  total_commandes: number
  ca_total: number
  benefice_total: number
  commandes_en_attente: number
}

type RecentOrder = {
  id: string
  client_nom: string
  total: number
  statut: string
  created_at: string
  canal: string
}

const STATUT_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#f5a623', bg: 'rgba(245,166,35,0.08)' },
  paye:       { label: 'Payé',       color: '#2ecc87', bg: 'rgba(46,204,135,0.08)' },
  livre:      { label: 'Livré',      color: '#4d8cff', bg: 'rgba(77,140,255,0.08)' },
  annule:     { label: 'Annulé',     color: '#ff5e5e', bg: 'rgba(255,94,94,0.08)' },
}

const CANAL_COLOR: Record<string, string> = {
  whatsapp: '#25d366', instagram: '#e1306c', tiktok: '#69c9d0', direct: '#a78bfa'
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
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length]
}

export default function DashboardPage() {
  const supabase = createClient()
  const [shopName, setShopName] = useState('')
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [stats, setStats] = useState<Stats>({ total_commandes: 0, ca_total: 0, benefice_total: 0, commandes_en_attente: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [lowStock, setLowStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, ordersRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('shop_name, full_name, plan').eq('id', user.id).single(),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('products').select('stock, stock_alerte').eq('user_id', user.id).eq('actif', true),
      ])

      const profile = profileRes.data as any
      setShopName(profile?.shop_name || profile?.full_name || 'Vendeur')
      setPlan(profile?.plan || 'free')

      const orders = ordersRes.data || []
      const products = productsRes.data || []

      setStats({
        total_commandes: orders.length,
        ca_total: orders.reduce((s, o) => s + o.total, 0),
        benefice_total: 0,
        commandes_en_attente: orders.filter(o => o.statut === 'en_attente').length,
      })

      setRecentOrders(
        [...orders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      )

      setTotalProducts(products.length)
      setLowStock(products.filter(p => p.stock <= p.stock_alerte).length)
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    {
      label: 'Chiffre d\'affaires', icon: '💰',
      value: formatCFA(stats.ca_total), color: '#f5a623',
      sub: `${stats.total_commandes} commande${stats.total_commandes > 1 ? 's' : ''} au total`,
      href: '/commandes'
    },
    {
      label: 'En attente', icon: '⏳',
      value: stats.commandes_en_attente, color: '#ff8c00',
      sub: 'Commandes à traiter',
      href: '/commandes'
    },
    {
      label: 'Produits actifs', icon: '🏷️',
      value: totalProducts, color: '#4d8cff',
      sub: lowStock > 0 ? `⚠️ ${lowStock} en stock faible` : 'Stock OK',
      subColor: lowStock > 0 ? '#f5a623' : '#2ecc87',
      href: '/produits'
    },
    {
      label: 'Statistiques', icon: '📈',
      value: plan === 'premium' ? '✦ Premium' : 'Gratuit',
      color: plan === 'premium' ? '#f5a623' : '#717a8f',
      sub: plan === 'free' ? 'Passez premium pour plus' : 'Accès complet activé',
      href: '/stats'
    },
  ]

  const quickActions = [
    { label: 'Nouvelle commande', icon: '📦', href: '/commandes/nouvelle', color: '#f5a623' },
    { label: 'Ajouter un produit', icon: '🏷️', href: '/produits/nouveau', color: '#4d8cff' },
    { label: 'Voir les stats', icon: '📈', href: '/stats', color: '#2ecc87' },
    { label: 'Paramètres', icon: '⚙️', href: '/parametres', color: '#a78bfa' },
  ]

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#717a8f', fontSize: 13, marginBottom: 4 }}>
              {greeting} 👋
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
              letterSpacing: '-0.5px', lineHeight: 1.1
            }}>
              {loading ? '...' : shopName}
            </h1>
          </div>
          <Link href="/commandes/nouvelle" style={{
            background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
            color: '#000', borderRadius: 12, padding: '11px 20px',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 4px 20px rgba(245,166,35,0.3)'
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nouvelle commande
          </Link>
        </div>

        {/* Plan badge */}
        {plan === 'free' && (
          <div style={{
            marginTop: 14,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(255,204,107,0.02))',
            border: '1px solid rgba(245,166,35,0.15)',
            borderRadius: 12, padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
          }}>
            <div style={{ fontSize: 13, color: '#a0a8b8' }}>
              ✦ Plan gratuit · <span style={{ color: '#717a8f' }}>Limité à 20 commandes/mois et 5 produits</span>
            </div>
            <button style={{
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              color: '#000', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>
              ⚡ Passer Premium
            </button>
          </div>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpis.map((kpi, i) => (
          <Link key={i} href={kpi.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden',
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: kpi.color, opacity: 0.7 }} />
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: kpi.color, opacity: 0.04, filter: 'blur(20px)'
              }} />
              <div style={{ fontSize: 22, marginBottom: 14 }}>{kpi.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#717a8f', marginBottom: 6 }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: kpi.color, marginBottom: 6 }}>
                {loading ? <span style={{ color: '#2a3040' }}>——</span> : kpi.value}
              </div>
              <div style={{ fontSize: 11, color: (kpi as any).subColor || '#4a5266' }}>{kpi.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── RECENT ORDERS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}
        className="dashboard-grid">

        {/* Recent orders */}
        <div style={{
          background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18, overflow: 'hidden'
        }}>
          <div style={{
            padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Commandes récentes
            </h2>
            <Link href="/commandes" style={{
              fontSize: 12, color: '#f5a623', textDecoration: 'none', fontWeight: 600
            }}>
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#717a8f', fontSize: 13 }}>Chargement...</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <div style={{ color: '#717a8f', fontSize: 13, marginBottom: 14 }}>Aucune commande pour l'instant</div>
              <Link href="/commandes/nouvelle" style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', borderRadius: 10, padding: '8px 18px',
                fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-block'
              }}>
                + Créer une commande
              </Link>
            </div>
          ) : (
            recentOrders.map((order, idx) => {
              const s = STATUT_STYLE[order.statut] || STATUT_STYLE.en_attente
              const initials = order.client_nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={order.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  borderBottom: idx < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: getGradient(order.client_nom),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#000'
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{order.client_nom}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: CANAL_COLOR[order.canal] || '#717a8f', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#717a8f' }}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                      {formatCFA(order.total)}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: s.bg, borderRadius: 20, padding: '2px 8px'
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, display: 'inline-block', boxShadow: `0 0 4px ${s.color}` }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '18px 16px'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              Actions rapides
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  textDecoration: 'none', transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `rgba(${action.color === '#f5a623' ? '245,166,35' : action.color === '#4d8cff' ? '77,140,255' : action.color === '#2ecc87' ? '46,204,135' : '167,139,250'},0.06)`
                  el.style.borderColor = `${action.color}20`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.02)'
                  el.style.borderColor = 'rgba(255,255,255,0.04)'
                }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `${action.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {action.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#c8cdd8' }}>{action.label}</span>
                  <span style={{ marginLeft: 'auto', color: '#3a4255', fontSize: 14 }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Tip card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(77,140,255,0.06), rgba(167,139,250,0.04))',
            border: '1px solid rgba(77,140,255,0.12)',
            borderRadius: 18, padding: '16px'
          }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>💡</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#c8cdd8' }}>
              Astuce du jour
            </div>
            <div style={{ fontSize: 11, color: '#717a8f', lineHeight: 1.6 }}>
              Marquez vos commandes comme "Livré" dès la réception pour garder vos stats à jour.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}