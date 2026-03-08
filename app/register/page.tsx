'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Attendre que le trigger crée le profil
    await new Promise(r => setTimeout(r, 1000))

    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          shop_name: shopName || 'Ma Boutique',
        })
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg)' }}>
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
          <h1 className="font-syne text-2xl font-bold mb-1">Créer votre boutique 🚀</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Gratuit — pas de carte bancaire requise</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">

            {error && (
              <div className="rounded-xl p-3 text-sm text-center"
                style={{ background: '#ff5e5e15', border: '1px solid #ff5e5e30', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            {[
              { label: 'Votre nom', value: fullName, setter: setFullName, placeholder: 'Amara Koné', type: 'text' },
              { label: 'Nom de votre boutique', value: shopName, setter: setShopName, placeholder: 'Boutique Amara', type: 'text' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'vous@exemple.com', type: 'email' },
              { label: 'Mot de passe', value: password, setter: setPassword, placeholder: '••••••••', type: 'password' },
            ].map(({ label, value, setter, placeholder, type }) => (
              <div key={label}>
                <label className="block mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  required
                  minLength={type === 'password' ? 6 : undefined}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-bold text-sm transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ffcc6b)',
                color: '#000',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none'
              }}>
              {loading ? 'Création en cours...' : 'Créer mon compte gratuitement'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

