'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

const navItems = [
  { href: '/dashboard',  icon: '▣', label: 'Tableau de bord' },
  { href: '/commandes',  icon: '◈', label: 'Commandes' },
  { href: '/produits',   icon: '◉', label: 'Produits' },
  { href: '/stats',      icon: '◎', label: 'Statistiques' },
]

const bottomItems = [
  { href: '/parametres', icon: '◌', label: 'Paramètres' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [profile, setProfile]       = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }, [])

  useEffect(() => {
    loadProfile()

    // ── Recharge le profil quand l'utilisateur revient sur la page ──
    // (ex: après paiement GeniusPay → retour sur l'app)
    const onFocus = () => loadProfile()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadProfile])

  // ── Recharge aussi à chaque changement de route ──
  useEffect(() => {
    loadProfile()
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const isPremium = (profile as any)?.plan === 'premium'
  const shopSlug  = (profile as any)?.shop_slug

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const NavLink = ({ href, icon, label, badge }: { href: string; icon: string; label: string; badge?: string }) => {
    const active  = isActive(href)
    const hovered = hoveredItem === href
    return (
      <Link href={href} onClick={() => setSidebarOpen(false)}
        onMouseEnter={() => setHoveredItem(href)}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          fontSize: 13, fontWeight: active ? 600 : 500,
          textDecoration: 'none',
          color: active ? '#f5a623' : hovered ? '#c8cdd8' : '#717a8f',
          background: active
            ? 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(255,204,107,0.05))'
            : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: active ? '1px solid rgba(245,166,35,0.18)' : '1px solid transparent',
          transition: 'all 0.15s ease',
          position: 'relative', overflow: 'hidden',
        }}>
        {active && (
          <div style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: '60%', borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(180deg, #f5a623, #ffcc6b)',
            boxShadow: '0 0 8px rgba(245,166,35,0.5)'
          }} />
        )}
        <span style={{ fontSize: 14, filter: active ? 'drop-shadow(0 0 4px rgba(245,166,35,0.4))' : 'none', transition: 'filter 0.15s' }}>
          {icon}
        </span>
        {label}
        {badge && (
          <span style={{ marginLeft: 'auto', background: '#f5a623', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0f14' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: 240, display: 'flex', flexDirection: 'column',
        background: '#0d0f14',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 14px',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }} className="lg-sidebar">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px', marginBottom: 32 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, boxShadow: '0 4px 16px rgba(245,166,35,0.3)'
          }}>🛒</div>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Vendify</div>
            {isPremium && (
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f5a623', marginTop: -2 }}>
                ⚡ Premium
              </div>
            )}
          </div>
        </div>

        {/* Nav label */}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3a4255', marginBottom: 6, paddingLeft: 10 }}>
          Navigation
        </div>

        {/* Main nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'auto' }}>
          <NavLink href="/dashboard" icon="▣" label="Tableau de bord" />
          <NavLink href="/commandes" icon="◈" label="Commandes" badge="NEW" />
          <NavLink href="/produits"  icon="◉" label="Produits" />
          <NavLink href="/stats"     icon="◎" label="Statistiques" />

          {/* ── Boutique publique — Premium uniquement ── */}
          {isPremium && shopSlug && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3a4255', margin: '12px 0 4px', paddingLeft: 10 }}>
                Premium
              </div>
              <a href={`/b/${shopSlug}`} target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => setHoveredItem('boutique')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                  textDecoration: 'none',
                  color: hoveredItem === 'boutique' ? '#f5a623' : '#717a8f',
                  background: hoveredItem === 'boutique' ? 'rgba(245,166,35,0.06)' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 14 }}>🏪</span>
                Ma Boutique
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3a4255' }}>↗</span>
              </a>
            </>
          )}
        </nav>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '16px 0' }} />

        {/* Bottom nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>

          {/* Passer Premium — seulement si gratuit */}
          {!isPremium && (
            <Link href="/premium" onClick={() => setSidebarOpen(false)}
              onMouseEnter={() => setHoveredItem('/premium')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                textDecoration: 'none',
                color: isActive('/premium') ? '#f5a623' : hoveredItem === '/premium' ? '#c8cdd8' : '#717a8f',
                background: isActive('/premium') ? 'rgba(245,166,35,0.08)' : hoveredItem === '/premium' ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: isActive('/premium') ? '1px solid rgba(245,166,35,0.18)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              Passer Premium
            </Link>
          )}

          <NavLink href="/parametres" icon="◌" label="Paramètres" />

          {/* Upsell card — gratuit uniquement */}
          {!isPremium && (
            <Link href="/premium" onClick={() => setSidebarOpen(false)} style={{
              display: 'block', margin: '8px 0',
              background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,204,107,0.04))',
              border: '1px solid rgba(245,166,35,0.15)',
              borderRadius: 12, padding: '10px 12px',
              textDecoration: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f5a623' }}>Passer Premium</span>
              </div>
              <div style={{ fontSize: 10, color: '#717a8f', lineHeight: 1.4 }}>
                Commandes illimitées · Stats avancées · Export Excel
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, fontWeight: 700, color: '#000',
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                borderRadius: 8, padding: '5px 10px', textAlign: 'center'
              }}>
                3 000 FCFA / mois
              </div>
            </Link>
          )}

          {/* Badge Premium actif */}
          {isPremium && (
            <div style={{
              margin: '8px 0',
              background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,204,107,0.04))',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 12, padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>✦</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f5a623' }}>Plan Premium actif</span>
              </div>
              <div style={{ fontSize: 10, color: '#717a8f', lineHeight: 1.4 }}>
                Toutes les fonctionnalités débloquées
              </div>
            </div>
          )}
        </nav>

        {/* User card */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #f5a623, #ff7f50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#000',
              boxShadow: '0 2px 8px rgba(245,166,35,0.3)'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(profile as any)?.shop_name || profile?.full_name || 'Vendeur'}
              </div>
              <div style={{ fontSize: 10, color: isPremium ? '#f5a623' : '#4a5266', marginTop: 1 }}>
                {isPremium ? '✦ Premium' : '● Plan Gratuit'}
              </div>
            </div>
            <button onClick={handleLogout} title="Déconnexion"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ff5e5e'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3a4255'}
              style={{ color: '#3a4255', fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s', padding: 4 }}>
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 0 }}>
        <div className="lg-content">
          <div className="mobile-topbar" style={{
            display: 'none', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: '#0d0f14', position: 'sticky', top: 0, zIndex: 30
          }}>
            <button onClick={() => setSidebarOpen(true)} style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer', color: '#f0f2f7'
            }}>☰</button>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Vendify</div>
            {isPremium && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 20, padding: '2px 8px' }}>
                ⚡ Premium
              </div>
            )}
            <Link href="/commandes/nouvelle" style={{
              marginLeft: 'auto',
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              color: '#000', borderRadius: 10, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, textDecoration: 'none'
            }}>+ Commande</Link>
          </div>

          <main style={{ padding: '32px' }} className="main-content">
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar    { transform: translateX(0) !important; }
          .lg-content    { margin-left: 240px; }
          .mobile-topbar { display: none !important; }
        }
        @media (max-width: 1023px) {
          .mobile-topbar { display: flex !important; }
          .main-content  { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}