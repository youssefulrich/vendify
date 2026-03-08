'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  { label: 'Commandes / mois',     free: '20',        premium: 'Illimitées' },
  { label: 'Produits',             free: '5 max',     premium: 'Illimités' },
  { label: 'Statistiques',         free: 'Basiques',  premium: 'Avancées + graphiques' },
  { label: 'Export Excel',         free: '✗',         premium: '✓' },
  { label: 'Top produits',         free: '✗',         premium: '✓' },
  { label: 'Analyse clients',      free: '✗',         premium: '✓' },
  { label: 'Support prioritaire',  free: '✗',         premium: '✓' },
  { label: 'Multi-boutique',       free: '✗',         premium: 'Bientôt' },
]

const TESTIMONIALS = [
  {
    name: 'Awa Traoré',
    shop: 'Awa Fashion Store · Abidjan',
    text: 'Depuis que je suis passée Premium, je gère 3x plus de commandes sans me perdre. Les stats m\'ont aidée à identifier mes meilleurs produits.',
    avatar: 'A', gradient: 'linear-gradient(135deg, #f5a623, #ff7f50)',
  },
  {
    name: 'Kofi Mensah',
    shop: 'KM Sneakers · Dakar',
    text: 'L\'export Excel est une révolution ! Je partage mes résultats avec ma famille chaque mois. 3000 FCFA c\'est rien comparé à ce que ça rapporte.',
    avatar: 'K', gradient: 'linear-gradient(135deg, #4d8cff, #a78bfa)',
  },
  {
    name: 'Fatou Diallo',
    shop: 'Beauté by Fatou · Cotonou',
    text: 'Les alertes de stock faible m\'ont sauvée plusieurs fois. Je ne rate plus jamais une vente par manque de produit.',
    avatar: 'F', gradient: 'linear-gradient(135deg, #2ecc87, #00d4aa)',
  },
]

const FAQS = [
  {
    q: 'Comment se passe le paiement ?',
    a: 'Vous effectuez un virement Wave ou Orange Money vers notre numéro, puis vous envoyez la capture d\'écran. L\'activation est faite dans les 2h ouvrables.'
  },
  {
    q: 'Est-ce que je peux annuler ?',
    a: 'Oui, vous pouvez annuler à tout moment. Votre accès Premium reste actif jusqu\'à la fin de la période payée.'
  },
  {
    q: 'Mes données sont-elles sauvegardées si je repasse Gratuit ?',
    a: 'Oui, toutes vos données sont conservées. Vous perdez simplement l\'accès aux fonctionnalités Premium.'
  },
  {
    q: 'Le prix va-t-il changer ?',
    a: 'Non ! Les early adopters comme vous gardent le tarif de lancement à 3 000 FCFA/mois même quand le prix augmentera.'
  },
]

type Step = 'offer' | 'payment' | 'confirm'

export default function PremiumPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('offer')
  const [method, setMethod] = useState<'wave' | 'orange_money'>('wave')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [shopName, setShopName] = useState('')
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [note, setNote] = useState('')

  // Countdown — offre expire dans 48h depuis maintenant (localStorage-free: recalcul à chaque visite)
  const [timeLeft, setTimeLeft] = useState({ h: 47, m: 59, s: 59 })
  useEffect(() => {
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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
    const { data } = await (supabase as any).from('profiles').select('shop_name, plan').eq('id', user.id).single()
      setShopName(data?.shop_name || '')
      setPlan(data?.plan || 'free')
    }
    load()
  }, [])

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleConfirm() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Insert a pending premium request
    await (supabase as any).from('profiles').update({
    plan_request: 'pending',
    plan_request_method: method,
    plan_request_note: note,
    plan_request_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSubmitted(true)
  }

  const pad = (n: number) => String(n).padStart(2, '0')

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

  if (submitted) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #2ecc87, #00d4aa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, boxShadow: '0 8px 32px rgba(46,204,135,0.3)'
        }}>
          ✓
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Demande reçue !
        </h1>
        <p style={{ color: '#717a8f', fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 24px' }}>
          Votre demande d'activation Premium a bien été enregistrée. Vous recevrez une confirmation à <strong style={{ color: '#f0f2f7' }}>{userEmail}</strong> dans les <strong style={{ color: '#f5a623' }}>2 heures ouvrables</strong>.
        </p>
        <div style={{
          background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)',
          borderRadius: 14, padding: '16px 20px', fontSize: 13, color: '#a0a8b8', lineHeight: 1.6
        }}>
          En cas de problème, contactez-nous sur WhatsApp :<br />
          <strong style={{ color: '#25d366' }}>+225 07 00 00 00 00</strong>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── STEP INDICATOR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
        {(['offer', 'payment', 'confirm'] as Step[]).map((s, i) => {
          const labels = ['Offre', 'Paiement', 'Confirmation']
          const active = step === s
          const done = (step === 'payment' && i === 0) || (step === 'confirm' && i < 2)
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#2ecc87' : active ? 'linear-gradient(135deg, #f5a623, #ffcc6b)' : '#1e2430',
                border: `1px solid ${done ? '#2ecc87' : active ? '#f5a623' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 12 : 11, fontWeight: 700,
                color: (active || done) ? '#000' : '#717a8f',
                transition: 'all 0.3s'
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#f0f2f7' : '#717a8f' }}>
                {labels[i]}
              </span>
              {i < 2 && <div style={{ width: 32, height: 1, background: done ? '#2ecc87' : 'rgba(255,255,255,0.08)' }} />}
            </div>
          )
        })}
      </div>

      {/* ══════════════ STEP 1 : OFFER ══════════════ */}
      {step === 'offer' && (
        <div>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 20, padding: '6px 16px', marginBottom: 16,
              fontSize: 12, fontWeight: 700, color: '#f5a623', letterSpacing: '0.5px'
            }}>
              ⚡ OFFRE DE LANCEMENT
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>
              Passez à Vendify <span style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium</span>
            </h1>
            <p style={{ color: '#717a8f', fontSize: 15, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Gérez votre boutique sans limites. Plus de commandes, plus de produits, des stats qui vous aident vraiment à vendre plus.
            </p>

            {/* Price */}
            <div style={{
              display: 'inline-block',
              background: '#161a22', border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 20, padding: '20px 40px', marginBottom: 24
            }}>
              <div style={{ fontSize: 12, color: '#717a8f', marginBottom: 4, textDecoration: 'line-through' }}>
                5 000 FCFA / mois
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 800, color: '#f5a623', lineHeight: 1 }}>
                3 000
                <span style={{ fontSize: 18, color: '#a0a8b8', fontWeight: 500 }}> FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: '#717a8f', marginTop: 4 }}>par mois · sans engagement</div>
            </div>

            {/* Countdown */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.2)',
              borderRadius: 12, padding: '10px 20px', marginBottom: 32
            }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, color: '#ff5e5e', fontWeight: 600 }}>
                Offre expire dans :
              </span>
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
          </div>

          {/* Comparison table */}
          <div style={{
            background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, overflow: 'hidden', marginBottom: 40
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '16px 20px'
            }}>
              <div style={{ fontSize: 12, color: '#717a8f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Fonctionnalité
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#717a8f' }}>Gratuit</div>
              <div style={{
                textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f5a623',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <span style={{ fontSize: 10 }}>✦</span> Premium
              </div>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '13px 20px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ fontSize: 13, color: '#a0a8b8' }}>{f.label}</div>
                <div style={{
                  textAlign: 'center', fontSize: 13,
                  color: f.free === '✗' ? '#3a4255' : '#717a8f',
                  fontWeight: f.free === '✗' ? 400 : 500
                }}>
                  {f.free}
                </div>
                <div style={{
                  textAlign: 'center', fontSize: 13, fontWeight: 600,
                  color: f.premium === '✗' ? '#3a4255' : f.premium === '✓' ? '#2ecc87' : '#f5a623'
                }}>
                  {f.premium}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Ils ont déjà sauté le pas
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 40 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '20px', position: 'relative'
              }}>
                <div style={{ fontSize: 28, color: 'rgba(245,166,35,0.2)', fontFamily: 'serif', lineHeight: 1, marginBottom: 10 }}>
                  "
                </div>
                <p style={{ fontSize: 13, color: '#a0a8b8', lineHeight: 1.7, marginBottom: 16 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: t.gradient, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000', flexShrink: 0
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#717a8f' }}>{t.shop}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Questions fréquentes
          </h2>
          <div style={{ marginBottom: 40 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, marginBottom: 8, overflow: 'hidden'
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f2f7' }}>{faq.q}</span>
                  <span style={{
                    color: '#f5a623', fontSize: 18, flexShrink: 0,
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#717a8f', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setStep('payment')}
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', border: 'none', borderRadius: 14,
                padding: '16px 48px', fontSize: 16, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 6px 32px rgba(245,166,35,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                letterSpacing: '-0.3px'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = '0 10px 40px rgba(245,166,35,0.45)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 6px 32px rgba(245,166,35,0.35)'
              }}
            >
              ⚡ Passer Premium maintenant — 3 000 FCFA/mois
            </button>
            <div style={{ fontSize: 12, color: '#717a8f', marginTop: 10 }}>
              Sans engagement · Activation sous 2h · Support WhatsApp inclus
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2 : PAYMENT ══════════════ */}
      {step === 'payment' && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              Choisissez votre méthode
            </h2>
            <p style={{ color: '#717a8f', fontSize: 13 }}>
              Envoyez <strong style={{ color: '#f5a623' }}>3 000 FCFA</strong> au numéro correspondant
            </p>
          </div>

          {/* Method selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { key: 'wave', label: 'Wave', color: '#2ecc87', emoji: '🟢', number: '+225 07 12 34 56 78' },
              { key: 'orange_money', label: 'Orange Money', color: '#ff8c00', emoji: '🟠', number: '+225 05 98 76 54 32' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key as any)}
                style={{
                  background: method === m.key ? `rgba(${m.color === '#2ecc87' ? '46,204,135' : '255,140,0'},0.08)` : '#161a22',
                  border: `2px solid ${method === m.key ? m.color : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16, padding: '20px', cursor: 'pointer',
                  transition: 'all 0.15s', textAlign: 'center'
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: method === m.key ? m.color : '#f0f2f7', marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 11, color: '#717a8f' }}>{m.number}</div>
              </button>
            ))}
          </div>

          {/* Instructions */}
          {(() => {
            const info = method === 'wave'
              ? { number: '+225 07 12 34 56 78', label: 'Wave', color: '#2ecc87' }
              : { number: '+225 05 98 76 54 32', label: 'Orange Money', color: '#ff8c00' }
            return (
              <div style={{
                background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '24px', marginBottom: 24
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#a0a8b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Instructions
                </div>
                {[
                  `Ouvrez votre application ${info.label}`,
                  `Envoyez exactement 3 000 FCFA au numéro ci-dessous`,
                  'Faites une capture d\'écran de la confirmation',
                  'Revenez ici et cliquez sur "J\'ai payé"',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: info.color, color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: '#a0a8b8', lineHeight: 1.6 }}>{step}</span>
                  </div>
                ))}

                {/* Number to copy */}
                <div style={{
                  background: '#0d0f14', border: `1px solid ${info.color}30`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 16
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#717a8f', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Numéro {info.label}
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: info.color }}>
                      {info.number}
                    </div>
                  </div>
                  <button
                    onClick={() => copyNumber(info.number)}
                    style={{
                      background: copied ? 'rgba(46,204,135,0.15)' : `rgba(${info.color === '#2ecc87' ? '46,204,135' : '255,140,0'},0.1)`,
                      border: `1px solid ${copied ? '#2ecc87' : info.color}30`,
                      borderRadius: 10, padding: '8px 14px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      color: copied ? '#2ecc87' : info.color, transition: 'all 0.2s'
                    }}>
                    {copied ? '✓ Copié !' : 'Copier'}
                  </button>
                </div>

                {/* Amount */}
                <div style={{
                  background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)',
                  borderRadius: 12, padding: '12px 16px', marginTop: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 13, color: '#717a8f' }}>Montant exact à envoyer</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#f5a623' }}>
                    3 000 FCFA
                  </span>
                </div>
              </div>
            )
          })()}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('offer')}
              style={{
                flex: 1, background: '#1e2430', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 600,
                color: '#717a8f', cursor: 'pointer'
              }}>
              ← Retour
            </button>
            <button
              onClick={() => setStep('confirm')}
              style={{
                flex: 2, background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,166,35,0.3)'
              }}>
              ✓ J'ai payé — Confirmer
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3 : CONFIRM ══════════════ */}
      {step === 'confirm' && (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              Confirmation de paiement
            </h2>
            <p style={{ color: '#717a8f', fontSize: 13, lineHeight: 1.6 }}>
              Renseignez vos informations pour que nous puissions activer votre compte rapidement
            </p>
          </div>

          <div style={{
            background: '#161a22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '24px', marginBottom: 20
          }}>
            {/* Summary */}
            <div style={{
              background: '#0d0f14', borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#717a8f', marginBottom: 4 }}>Méthode choisie</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: method === 'wave' ? '#2ecc87' : '#ff8c00' }}>
                  {method === 'wave' ? '🟢 Wave' : '🟠 Orange Money'} · 3 000 FCFA
                </div>
              </div>
              <button onClick={() => setStep('payment')} style={{ fontSize: 11, color: '#f5a623', background: 'none', border: 'none', cursor: 'pointer' }}>
                Modifier
              </button>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#717a8f', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>
                Email de confirmation
              </label>
              <div style={{
                background: '#0d0f14', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#a0a8b8'
              }}>
                {userEmail}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#717a8f', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>
                Référence / Note de paiement (optionnel)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: Numéro de transaction Wave, heure d'envoi..."
                style={{
                  width: '100%', background: '#0d0f14',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '12px 14px',
                  fontSize: 13, color: '#f0f2f7', outline: 'none', resize: 'vertical',
                  minHeight: 80, fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
              />
            </div>

            <div style={{
              background: 'rgba(77,140,255,0.06)', border: '1px solid rgba(77,140,255,0.15)',
              borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#717a8f', lineHeight: 1.6
            }}>
              ℹ️ Votre compte sera activé dans les <strong style={{ color: '#4d8cff' }}>2 heures ouvrables</strong> après réception de votre paiement. Vous recevrez un email de confirmation à <strong style={{ color: '#f0f2f7' }}>{userEmail}</strong>.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('payment')}
              style={{
                flex: 1, background: '#1e2430', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 600,
                color: '#717a8f', cursor: 'pointer'
              }}>
              ← Retour
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 2, background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,166,35,0.3)'
              }}>
              ⚡ Envoyer ma demande
            </button>
          </div>
        </div>
      )}
    </div>
  )
}