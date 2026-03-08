'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

export default function ParametresPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data || {})
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase as any).from('profiles').update({
      full_name: profile.full_name,
      shop_name: profile.shop_name,
      phone: profile.phone,
      pays: profile.pays,
    }).eq('id', user.id)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const inputStyle = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6, display: 'block',
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 40 }}>Chargement...</div>

  return (
    <div className="max-w-xl">
      <h1 className="font-syne text-2xl font-bold mb-6">Paramètres</h1>

      {/* Plan badge */}
      <div className="rounded-2xl p-4 mb-6 flex items-center gap-4"
        style={{
          background: profile.plan === 'premium' ? 'rgba(245,166,35,0.08)' : 'var(--surface)',
          border: profile.plan === 'premium' ? '1px solid rgba(245,166,35,0.3)' : '1px solid var(--border)'
        }}>
        <span className="text-2xl">{profile.plan === 'premium' ? '⚡' : '🆓'}</span>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: profile.plan === 'premium' ? 'var(--gold)' : 'var(--text)' }}>
            {profile.plan === 'premium' ? 'Plan Premium' : 'Plan Gratuit'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {profile.plan === 'premium'
              ? `Actif jusqu'au ${profile.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString('fr-FR') : '—'}`
              : 'Limite : 20 commandes/mois, 5 produits'}
          </div>
        </div>
        {profile.plan === 'free' && (
          <button className="rounded-xl px-3 py-2 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', color: '#000', border: 'none', cursor: 'pointer' }}>
            Passer Premium
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-bold mb-4">Mon profil</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input style={inputStyle} value={profile.full_name || ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Nom de la boutique</label>
              <input style={inputStyle} value={profile.shop_name || ''} onChange={e => setProfile(p => ({ ...p, shop_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+225..." />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <select style={inputStyle} value={profile.pays || 'CI'} onChange={e => setProfile(p => ({ ...p, pays: e.target.value }))}>
                <option value="CI">🇨🇮 Côte d'Ivoire</option>
                <option value="SN">🇸🇳 Sénégal</option>
                <option value="BJ">🇧🇯 Bénin</option>
                <option value="CM">🇨🇲 Cameroun</option>
                <option value="TG">🇹🇬 Togo</option>
              </select>
            </div>
          </div>
        </div>

        {success && (
          <div className="rounded-xl p-3 text-sm text-center font-semibold"
            style={{ background: '#2ecc8720', border: '1px solid #2ecc8740', color: 'var(--green)' }}>
            ✅ Profil mis à jour avec succès !
          </div>
        )}

        <button type="submit" disabled={saving}
          className="rounded-xl py-3 text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #f5a623, #ffcc6b)', color: '#000', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Enregistrement...' : '✓ Sauvegarder'}
        </button>
      </form>
    </div>
  )
}
