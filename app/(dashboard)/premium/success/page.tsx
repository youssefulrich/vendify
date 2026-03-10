'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function PremiumSuccessPage() {
  const [checking, setChecking] = useState(true)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    // Vérifier toutes les 3 secondes si le plan a été activé (max 30s)
    let attempts = 0
    const supabase = createClient()

    const interval = setInterval(async () => {
      attempts++
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await (supabase as any)
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (data?.plan === 'premium') {
        setActivated(true)
        setChecking(false)
        clearInterval(interval)
      }

      if (attempts >= 10) {
        setChecking(false)
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0f14', padding: 20
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>

        {checking && !activated ? (
          <>
            <div style={{ marginBottom: 24 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  background: '#f5a623', margin: '0 4px', opacity: 0.4,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Activation en cours...
            </h1>
            <p style={{ color: '#717a8f', fontSize: 14 }}>
              Votre paiement a été reçu. Nous activons votre compte Premium.
            </p>
          </>
        ) : activated ? (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, boxShadow: '0 8px 32px rgba(245,166,35,0.4)'
            }}>
              ⚡
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#f5a623' }}>
              Bienvenue en Premium !
            </h1>
            <p style={{ color: '#a0a8b8', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Votre compte est maintenant actif. Profitez de toutes les fonctionnalités sans limite.
            </p>
            <Link href="/dashboard" style={{
              background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
              color: '#000', borderRadius: 14, padding: '14px 32px',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              display: 'inline-block', boxShadow: '0 4px 20px rgba(245,166,35,0.3)'
            }}>
              Accéder à mon tableau de bord →
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Activation en cours...
            </h1>
            <p style={{ color: '#717a8f', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Votre paiement a bien été reçu. L'activation peut prendre jusqu'à 2 heures.<br />
              Vous recevrez une notification par email.
            </p>
            <Link href="/dashboard" style={{
              color: '#f5a623', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Retourner au tableau de bord →
            </Link>
          </>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
      </div>
    </div>
  )
}