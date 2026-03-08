'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)' }}>
              🛒
            </div>
            <span className="font-syne text-2xl font-black"
              style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Vendify
            </span>
          </div>
          <h1 className="font-syne text-2xl font-bold mb-1">Bon retour 👋</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Connectez-vous à votre boutique</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {error && (
              <div className="rounded-xl p-3 text-sm text-center"
                style={{ background: '#ff5e5e15', border: '1px solid #ff5e5e30', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-bold text-sm transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
