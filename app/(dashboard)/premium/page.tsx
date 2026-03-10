'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  { label: 'Commandes / mois',    free: '20',       premium: 'Illimitées' },
  { label: 'Produits',            free: '5 max',    premium: 'Illimités' },
  { label: 'Statistiques',        free: 'Basiques', premium: 'Avancées + graphiques' },
  { label: 'Export Excel',        free: '✗',        premium: '✓' },
  { label: 'Top produits',        free: '✗',        premium: '✓' },
  { label: 'Analyse clients',     free: '✗',        premium: '✓' },
  { label: 'Support prioritaire', free: '✗',        premium: '✓' },
  { label: 'Multi-boutique',      free: '✗',        premium: 'Bientôt' },
]

const TESTIMONIALS = [
  {
    name: 'Awa Traoré', shop: 'Awa Fashion Store · Abidjan',
    text: 'Depuis que je suis passée Premium, je gère 3x plus de commandes sans me perdre.',
    avatar: 'A', gradient: 'linear-gradient(135deg, #f5a623, #ff7f50)',
  },
  {
    name: 'Kofi Mensah', shop: 'KM Sneakers · Dakar',
    text: 'L\'export Excel est une révolution ! 3000 FCFA c\'est rien comparé à ce que ça rapporte.',
    avatar: 'K', gradient: 'linear-gradient(135deg, #4d8cff, #a78bfa)',
  },
  {
    name: 'Fatou Diallo', shop: 'Beauté by Fatou · Cotonou',
    text: 'Les alertes de stock faible m\'ont sauvée plusieurs fois.',
    avatar: 'F', gradient: 'linear-gradient(135deg, #2ecc87, #00d4aa)',
  },
]

const FAQS = [
  { q: 'Comment se passe le paiement ?', a: 'Vous payez via GeniusPay avec Wave, Orange Money ou carte. Le paiement est sécurisé et l\'activation est instantanée.' },
  { q: 'Est-ce que je peux annuler ?', a: 'Oui, à tout moment. Votre accès Premium reste actif jusqu\'à la fin de la période payée.' },
  { q: 'Mes données sont-elles sauvegardées si je repasse Gratuit ?', a: 'Oui, toutes vos données sont conservées. Vous perdez simplement l\'accès aux fonctionnalités Premium.' },
  { q: 'Le prix va-t-il changer ?', a: 'Non ! Les early adopters gardent le tarif de lancement à 3 000 FCFA/mois.' },
]

export default function PremiumPage() {
  const router = useRouter()
  const supabase = createClient()
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState({ h: 47, m: 59, s: 59 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await (supabase as any).from('profiles').select('plan').eq('id', user.id).single()
      setPlan(data?.plan || 'free')
    }
    load()

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 0; m = 0; s = 0 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/premium/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id}) })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) throw new Error(data.error || 'Erreur')
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message || 'Erreur lors du paiement')
      setLoading(false)
    }
  }

  if (plan === 'premium') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✦</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#f5a623' }}>
          Vous êtes déjà Premium !
        </h1>
        <p style={{ color: '#717a8f', fontSize: 14, lineHeight: 1.7 }}>
          Profitez de toutes les fonctionnalités sans limite. Merci de votre confiance.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 16,
          fontSize: 12, fontWeight: 700, color: '#f5a623'
        }}>
          ⚡ OFFRE DE LANCEMENT
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>
          Passez à Vendify{' '}
          <span style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Premium
          </span>
        </h1>
        <p style={{ color: '#717a8f', fontSize: 15, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Gérez votre boutique sans limites. Paiement sécurisé via Wave, Orange Money ou carte bancaire.
        </p>

        {/* Price */}
        <div style={{
          display: 'inline-block',
          background: '#161a22', border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 20, padding: '20px 40px', marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: '#717a8f', marginBottom: 4, textDecoration: 'line-through' }}>5 000 FCFA / mois</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 800, color: '#f5a623', lineHeight: 1 }}>
            3 000 <span style={{ fontSize: 18, color: '#a0a8b8', fontWeight: 500 }}>FCFA</span>
          </div>
          <div style={{ fontSize: 12, color: '#717a8f', marginTop: 4 }}>par mois · sans engagement</div>
        </div>

        {/* Countdown */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.2)',
          borderRadius: 12, padding: '10px 20px', marginBottom: 32
        }}>
          <span>🔥</span>
          <span style={{ fontSize: 12, color: '#ff5e5e', fontWeight: 600 }}>Offre expire dans :</span>
          {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                background: '#ff5e5e', color: '#000', borderRadius: 6,
                padding: '3px 8px', fontSize: 14, fontWeight: 800,
                fontFamily: 'Syne, sans-serif', minWidth: 32, textAlign: 'center'
              }}>
                {pad(val)}
              </div>
              {i < 2 && <span style={{ color: '#ff5e5e', fontWeight: 700 }}>:</span>}
            </div>
          ))}
        </div>

        {/* GeniusPay CTA */}
        <div>
          {error && (
            <div style={{
              background: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.2)',
              borderRadius: 12, padding: '12px 20px', marginBottom: 16,
              fontSize: 13, color: '#ff5e5e'
            }}>
              ⚠️ {error}
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              background: loading ? '#2a3040' : 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              color: loading ? '#717a8f' : '#000', border: 'none', borderRadius: 14,
              padding: '16px 48px', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 32px rgba(245,166,35,0.35)',
              transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 10
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #717a8f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Redirection en cours...
              </>
            ) : (
              <>⚡ Payer 3 000 FCFA avec GeniusPay</>
            )}
          </button>
          <div style={{ fontSize: 12, color: '#717a8f', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span>🟢 Wave</span>
            <span>🟠 Orange Money</span>
            <span>💳 Carte bancaire</span>
          </div>
          <div style={{ fontSize: 11, color: '#4a5266', marginTop: 6 }}>
            Paiement sécurisé · Activation instantanée · Sans engagement
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ background: '#161a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', marginBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: '#717a8f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Fonctionnalité</div>
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#717a8f' }}>Gratuit</div>
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f5a623' }}>✦ Premium</div>
        </div>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '13px 20px',
            borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
          }}>
            <div style={{ fontSize: 13, color: '#a0a8b8' }}>{f.label}</div>
            <div style={{ textAlign: 'center', fontSize: 13, color: f.free === '✗' ? '#3a4255' : '#717a8f' }}>{f.free}</div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: f.premium === '✗' ? '#3a4255' : f.premium === '✓' ? '#2ecc87' : '#f5a623' }}>{f.premium}</div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>Ils ont déjà sauté le pas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 40 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} style={{ background: '#161a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: 28, color: 'rgba(245,166,35,0.2)', fontFamily: 'serif', marginBottom: 10 }}>"</div>
            <p style={{ fontSize: 13, color: '#a0a8b8', lineHeight: 1.7, marginBottom: 16 }}>{t.text}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000' }}>{t.avatar}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#717a8f' }}>{t.shop}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>Questions fréquentes</h2>
      <div style={{ marginBottom: 40 }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: '#161a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f2f7' }}>{faq.q}</span>
              <span style={{ color: '#f5a623', fontSize: 18, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
            </button>
            {openFaq === i && (
              <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#717a8f', lineHeight: 1.7 }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <button onClick={handlePay} disabled={loading} style={{
          background: loading ? '#2a3040' : 'linear-gradient(135deg, #f5a623, #ffcc6b)',
          color: loading ? '#717a8f' : '#000', border: 'none', borderRadius: 14,
          padding: '16px 48px', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 6px 32px rgba(245,166,35,0.35)'
        }}>
          ⚡ Payer maintenant — 3 000 FCFA/mois
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}