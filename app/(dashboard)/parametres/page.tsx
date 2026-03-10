'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'

const PAYS_OPTIONS = [
  { value: 'CI', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { value: 'SN', flag: '🇸🇳', label: 'Sénégal' },
  { value: 'BJ', flag: '🇧🇯', label: 'Bénin' },
  { value: 'CM', flag: '🇨🇲', label: 'Cameroun' },
  { value: 'TG', flag: '🇹🇬', label: 'Togo' },
]

export default function ParametresPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [activeTab, setActiveTab] = useState<'profil' | 'plan'>('profil')

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
    const { error } = await (supabase as any).from('profiles').update({
      full_name: profile.full_name,
      shop_name: profile.shop_name,
      phone: profile.phone,
      pays: profile.pays,
    }).eq('id', user.id)
    setSaving(false)
    showToast(error ? 'Erreur lors de la sauvegarde' : 'Profil mis à jour ✓', error ? 'err' : 'ok')
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const isPremium = profile.plan === 'premium'
  const initials = profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const paysLabel = PAYS_OPTIONS.find(p => p.value === profile.pays)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#717a8f', fontSize: 14 }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(245,166,35,0.2)', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Chargement...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

        .param-root { max-width: 600px; animation: fadeUp 0.4s ease both; }

        /* Header */
        .param-header { margin-bottom: 28px; }
        .param-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
        .param-sub { font-size: 13px; color: #717a8f; }

        /* Profile hero */
        .profile-hero {
          background: linear-gradient(135deg, rgba(245,166,35,0.04), rgba(255,204,107,0.02));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .profile-avatar-wrap { position: relative; flex-shrink: 0; }
        .profile-avatar {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #f5a623, #ff7f50);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; color: #000;
          box-shadow: 0 4px 20px rgba(245,166,35,0.3);
        }
        .plan-dot {
          position: absolute; bottom: 2px; right: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid #0d0f14;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px;
        }
        .profile-info { flex: 1; min-width: 0; }
        .profile-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .profile-shop { font-size: 12px; color: #717a8f; margin-bottom: 4px; }
        .plan-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700;
        }

        /* Tabs */
        .param-tabs {
          display: flex; gap: 4px;
          background: #161a22;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 4px;
          margin-bottom: 20px;
        }
        .param-tab {
          flex: 1; padding: 9px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .param-tab.active {
          background: linear-gradient(135deg, rgba(245,166,35,0.1), rgba(255,204,107,0.05));
          color: #f5a623;
          box-shadow: 0 2px 8px rgba(245,166,35,0.1);
          border: 1px solid rgba(245,166,35,0.15);
        }
        .param-tab.inactive { background: transparent; color: #717a8f; border: 1px solid transparent; }
        .param-tab.inactive:hover { color: #c8cdd8; background: rgba(255,255,255,0.02); }

        /* Card */
        .param-card {
          background: #161a22;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
          animation: fadeUp 0.3s ease both;
        }
        .param-card-title {
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          color: #c8cdd8; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .param-card-title-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
        }

        /* Field */
        .param-field { margin-bottom: 16px; }
        .param-field:last-child { margin-bottom: 0; }
        .param-label {
          display: block; font-size: 10px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: #4a5470; margin-bottom: 7px;
        }
        .param-input, .param-select {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 12px 16px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #e8eaf0; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #e8eaf0;
        }
        .param-input::placeholder { color: #2e3448; }
        .param-input:focus, .param-select:focus {
          border-color: rgba(245,166,35,0.4);
          background: rgba(245,166,35,0.02);
          box-shadow: 0 0 0 4px rgba(245,166,35,0.06);
        }
        .param-select { cursor: pointer; }
        .param-select option { background: #161a22; }

        /* Field grid */
        .param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* Save button */
        .param-save {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000; border: none; border-radius: 14px;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(245,166,35,0.25);
        }
        .param-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,166,35,0.35); }
        .param-save:disabled { background: #1e2430; color: #3a4255; box-shadow: none; cursor: not-allowed; }

        /* Plan tab */
        .plan-current {
          border-radius: 16px; padding: 20px;
          display: flex; align-items: flex-start; gap: 16px;
          margin-bottom: 16px;
        }
        .plan-icon-wrap {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 24px;
        }
        .plan-stat { display: flex; flex-direction: column; gap: 4px; }
        .plan-stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
        .plan-stat-label { font-size: 11px; color: #4a5470; text-transform: uppercase; letter-spacing: 0.5px; }

        .plan-stats-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-bottom: 16px;
        }
        .plan-stat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }

        .upgrade-cta {
          background: linear-gradient(135deg, #f5a623, #ffcc6b);
          color: #000; border: none; border-radius: 14px;
          padding: 14px; width: 100%;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(245,166,35,0.25);
          text-decoration: none; display: flex;
          align-items: center; justify-content: center; gap: 8px;
        }
        .upgrade-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,166,35,0.35); }

        .feature-list { display: flex; flex-direction: column; gap: 8px; }
        .feature-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #a0a8b8;
        }
        .feature-check {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 10px;
        }

        /* Toast */
        .param-toast {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          padding: 12px 20px; border-radius: 14px;
          font-size: 13px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
          z-index: 999; pointer-events: none; white-space: nowrap;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .toast-ok { background: #0f2218; border: 1px solid rgba(46,204,135,0.3); color: #2ecc87; }
        .toast-err { background: #1f0f0f; border: 1px solid rgba(255,94,94,0.3); color: #ff7070; }

        /* Spinner */
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.7s linear infinite; }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .param-grid { grid-template-columns: 1fr !important; }
          .profile-hero { flex-direction: column; text-align: center; align-items: center; }
          .profile-avatar { width: 72px; height: 72px; font-size: 26px; }
          .plan-stats-row { grid-template-columns: 1fr 1fr; }
          .param-card { padding: 18px; }
          .param-title { font-size: 24px; }
          .profile-name { white-space: normal; }
        }
      `}</style>

      <div className="param-root">

        {/* ── HEADER ── */}
        <div className="param-header">
          <h1 className="param-title">Paramètres</h1>
          <p className="param-sub">Gérez votre profil et votre abonnement</p>
        </div>

        {/* ── PROFILE HERO ── */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            <div className="plan-dot" style={{ background: isPremium ? '#f5a623' : '#2e3448' }}>
              {isPremium ? '⚡' : ''}
            </div>
          </div>
          <div className="profile-info">
            <div className="profile-name">{profile.full_name || 'Votre nom'}</div>
            <div className="profile-shop">🏪 {profile.shop_name || 'Ma Boutique'} · {paysLabel?.flag} {paysLabel?.label}</div>
            <div className="plan-badge" style={
              isPremium
                ? { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#f5a623' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#717a8f' }
            }>
              {isPremium ? '⚡ Premium' : '● Plan Gratuit'}
            </div>
          </div>
          {isPremium && profile.plan_expires_at && (
            <div style={{ fontSize: 11, color: '#717a8f', flexShrink: 0, textAlign: 'right' }}>
              Expire le<br />
              <span style={{ color: '#c8cdd8', fontWeight: 600 }}>
                {new Date(profile.plan_expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="param-tabs">
          {[
            { key: 'profil', icon: '👤', label: 'Mon profil' },
            { key: 'plan',   icon: '⚡', label: 'Abonnement' },
          ].map(t => (
            <button key={t.key}
              className={`param-tab ${activeTab === t.key ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab(t.key as any)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFIL ── */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSave}>
            <div className="param-card">
              <div className="param-card-title">
                <div className="param-card-title-icon" style={{ background: 'rgba(245,166,35,0.08)' }}>👤</div>
                Informations personnelles
              </div>

              <div className="param-grid">
                <div className="param-field">
                  <label className="param-label">Nom complet</label>
                  <input className="param-input" type="text" placeholder="Amara Koné"
                    value={profile.full_name || ''}
                    onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="param-field">
                  <label className="param-label">Téléphone</label>
                  <input className="param-input" type="tel" placeholder="+225 07 00 00 00"
                    value={profile.phone || ''}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              <div className="param-grid">
                <div className="param-field">
                  <label className="param-label">Nom de la boutique</label>
                  <input className="param-input" type="text" placeholder="Boutique Amara"
                    value={profile.shop_name || ''}
                    onChange={e => setProfile(p => ({ ...p, shop_name: e.target.value }))} />
                </div>
                <div className="param-field">
                  <label className="param-label">Pays</label>
                  <select className="param-select"
                    value={profile.pays || 'CI'}
                    onChange={e => setProfile(p => ({ ...p, pays: e.target.value }))}>
                    {PAYS_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.flag} {p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="param-save" disabled={saving}>
              {saving ? <><span className="spinner" />Enregistrement...</> : <>✓ Sauvegarder les modifications</>}
            </button>
          </form>
        )}

        {/* ── TAB: PLAN ── */}
        {activeTab === 'plan' && (
          <div>
            {isPremium ? (
              /* Premium actif */
              <div className="param-card">
                <div className="plan-current" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: 16 }}>
                  <div className="plan-icon-wrap" style={{ background: 'rgba(245,166,35,0.1)' }}>⚡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: '#f5a623', marginBottom: 4 }}>Plan Premium actif</div>
                    <div style={{ fontSize: 13, color: '#717a8f' }}>
                      Toutes les fonctionnalités débloquées
                      {profile.plan_expires_at && <> · Expire le <strong style={{ color: '#c8cdd8' }}>{new Date(profile.plan_expires_at).toLocaleDateString('fr-FR')}</strong></>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }} className="feature-list">
                  {[
                    'Commandes illimitées',
                    'Produits illimités',
                    'Statistiques avancées',
                    'Export Excel des commandes',
                    'Support prioritaire',
                  ].map(f => (
                    <div key={f} className="feature-item">
                      <div className="feature-check" style={{ background: 'rgba(46,204,135,0.1)', color: '#2ecc87' }}>✓</div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Plan gratuit — upsell */
              <>
                <div className="param-card">
                  <div className="param-card-title">
                    <div className="param-card-title-icon" style={{ background: 'rgba(255,255,255,0.04)' }}>🆓</div>
                    Plan actuel — Gratuit
                  </div>

                  <div className="plan-stats-row">
                    {[
                      { label: 'Commandes/mois', val: '20', max: true },
                      { label: 'Produits max', val: '5', max: true },
                    ].map(s => (
                      <div key={s.label} className="plan-stat-card">
                        <div className="plan-stat-val" style={{ color: '#f5a623' }}>{s.val}</div>
                        <div className="plan-stat-label">{s.label}</div>
                        <div style={{ fontSize: 10, color: '#ff7070', marginTop: 2 }}>Limite atteinte</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#c8cdd8', marginBottom: 12 }}>
                    ⚡ Passez Premium pour débloquer :
                  </div>
                  <div className="feature-list" style={{ marginBottom: 20 }}>
                    {[
                      { f: 'Commandes illimitées', ok: false },
                      { f: 'Produits illimités', ok: false },
                      { f: 'Statistiques avancées + graphiques', ok: false },
                      { f: 'Export Excel', ok: false },
                    ].map(({ f, ok }) => (
                      <div key={f} className="feature-item">
                        <div className="feature-check" style={{ background: ok ? 'rgba(46,204,135,0.1)' : 'rgba(245,166,35,0.08)', color: ok ? '#2ecc87' : '#f5a623' }}>
                          {ok ? '✓' : '→'}
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 900, color: '#f5a623' }}>3 000 <span style={{ fontSize: 13 }}>FCFA</span></div>
                      <div style={{ fontSize: 11, color: '#717a8f' }}>par mois · sans engagement</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#2ecc87', background: 'rgba(46,204,135,0.06)', border: '1px solid rgba(46,204,135,0.12)', borderRadius: 8, padding: '4px 10px' }}>
                      🔒 Paiement sécurisé
                    </div>
                  </div>

                  <Link href="/premium" className="upgrade-cta">
                    ⚡ Passer Premium maintenant
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`param-toast ${toast.type === 'ok' ? 'toast-ok' : 'toast-err'}`}>
          {toast.type === 'ok' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}
    </div>
  )
}