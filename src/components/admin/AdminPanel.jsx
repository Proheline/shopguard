import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function AdminPanel({ profile, onBack }) {
  const [tab, setTab] = useState('techs')
  const [techs, setTechs] = useState([])
  const [invites, setInvites] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [newInviteRole, setNewInviteRole] = useState('tech')
  const [generatedCode, setGeneratedCode] = useState(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)

    const { data: techData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    const { data: inviteData } = await supabase
      .from('invites')
      .select('*, created_by_profile:created_by(full_name), used_by_profile:used_by(full_name)')
      .order('created_at', { ascending: false })

    const { data: settingsData } = await supabase
      .from('shop_settings')
      .select('*')

    setTechs(techData || [])
    setInvites(inviteData || [])

    const settingsMap = {}
    ;(settingsData || []).forEach(s => {
      settingsMap[s.setting_key] = s.setting_value
    })
    setSettings(settingsMap)

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCreateInvite = async () => {
    const code = generateCode()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error } = await supabase
      .from('invites')
      .insert({
        code,
        created_by: profile.id,
        role: newInviteRole,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      console.error('Create invite error:', error)
      return
    }

    setGeneratedCode(code)
    setCopied(false)
    loadData()
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleToggleActive = async (techId, currentActive) => {
    if (techId === profile.id) {
      alert("You can't deactivate your own account.")
      return
    }

    const action = currentActive ? 'deactivate' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${action} this tech?`)) return

    await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', techId)

    loadData()
  }

  const handleChangeRole = async (techId, currentRole) => {
    if (techId === profile.id) {
      alert("You can't change your own role.")
      return
    }

    const newRole = currentRole === 'admin' ? 'tech' : 'admin'
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return

    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', techId)

    loadData()
  }

  const handleUpdateSetting = async (key, value) => {
    await supabase
      .from('shop_settings')
      .upsert({ setting_key: key, setting_value: value, updated_by: profile.id }, { onConflict: 'setting_key' })

    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const isExpired = (invite) => new Date(invite.expires_at) < new Date()
  const isUsed = (invite) => !!invite.used_by

  const tabs = [
    { id: 'techs', label: 'Techs', count: techs.length },
    { id: 'invites', label: 'Invites', count: invites.filter(i => !isUsed(i) && !isExpired(i)).length },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: 1 }}>Admin Panel</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2 }}>
            SHOP MANAGEMENT
          </div>
        </div>
        <button onClick={onBack} style={{
          background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 6,
          padding: '8px 16px', color: 'var(--mu)', fontSize: 13, fontWeight: 600,
          fontFamily: "'Rajdhani', sans-serif", cursor: 'pointer',
        }}>← Back</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--s2)', borderRadius: 8, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 6, border: 'none',
            background: tab === t.id ? 'var(--sf)' : 'transparent',
            color: tab === t.id ? 'var(--tx)' : 'var(--mu)',
            fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.15s',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ marginLeft: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)', fontFamily: "'DM Mono', monospace" }}>
          Loading...
        </div>
      ) : (
        <>
          {/* ── TECHS TAB ── */}
          {tab === 'techs' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {techs.map(tech => (
                  <div key={tech.id} style={{
                    background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10,
                    padding: '14px 16px', opacity: tech.is_active ? 1 : 0.5,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: tech.id === profile.id ? '#f97316' : 'var(--s2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: tech.id === profile.id ? '#fff' : 'var(--mu)',
                        }}>
                          {tech.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{tech.full_name}</span>
                            {tech.id === profile.id && (
                              <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '2px 6px', borderRadius: 3, background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>YOU</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                            <span style={{
                              fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '2px 6px',
                              borderRadius: 3, letterSpacing: 1, textTransform: 'uppercase',
                              background: tech.role === 'admin' ? 'rgba(59,130,246,0.1)' : 'var(--s2)',
                              color: tech.role === 'admin' ? '#3b82f6' : 'var(--mu)',
                              border: `1px solid ${tech.role === 'admin' ? 'rgba(59,130,246,0.2)' : 'var(--bd)'}`,
                            }}>{tech.role}</span>
                            <span style={{
                              fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '2px 6px',
                              borderRadius: 3, letterSpacing: 1,
                              background: tech.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: tech.is_active ? '#22c55e' : '#ef4444',
                              border: `1px solid ${tech.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            }}>{tech.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                          </div>
                        </div>
                      </div>

                      {tech.id !== profile.id && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleChangeRole(tech.id, tech.role)} style={{
                            background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 4,
                            padding: '4px 10px', fontSize: 10, fontFamily: "'DM Mono', monospace",
                            color: 'var(--mu)', cursor: 'pointer',
                          }}>
                            {tech.role === 'admin' ? '↓ TECH' : '↑ ADMIN'}
                          </button>
                          <button onClick={() => handleToggleActive(tech.id, tech.is_active)} style={{
                            background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 4,
                            padding: '4px 10px', fontSize: 10, fontFamily: "'DM Mono', monospace",
                            color: tech.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer',
                          }}>
                            {tech.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--mu)' }}>
                      Joined {new Date(tech.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INVITES TAB ── */}
          {tab === 'invites' && (
            <div>
              {/* Generate new invite */}
              <div style={{
                background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10,
                padding: 20, marginBottom: 16,
              }}>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
                  Generate Invite Code
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--mu)' }}>Role:</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['tech', 'admin'].map(r => (
                      <button key={r} onClick={() => setNewInviteRole(r)} style={{
                        padding: '6px 14px', borderRadius: 5, border: `1.5px solid ${newInviteRole === r ? '#f97316' : 'var(--bd)'}`,
                        background: newInviteRole === r ? 'rgba(249,115,22,0.1)' : 'var(--s2)',
                        color: newInviteRole === r ? '#f97316' : 'var(--mu)',
                        fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
                      }}>{r}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCreateInvite} style={{
                  background: '#f97316', border: 'none', borderRadius: 8, padding: '10px 20px',
                  color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
                  cursor: 'pointer', letterSpacing: 1, width: '100%',
                }}>
                  GENERATE CODE
                </button>

                {generatedCode && (
                  <div style={{ marginTop: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2, marginBottom: 6 }}>
                      INVITE CODE — EXPIRES IN 24 HOURS
                    </div>
                    <div onClick={handleCopyCode} style={{
                      fontSize: 32, fontWeight: 700, letterSpacing: 8, color: '#f97316',
                      fontFamily: "'DM Mono', monospace", cursor: 'pointer',
                      padding: '12px 20px', background: 'var(--s2)', borderRadius: 8,
                      border: '2px dashed var(--bd)', userSelect: 'all',
                    }}>
                      {generatedCode}
                    </div>
                    <button onClick={handleCopyCode} style={{
                      marginTop: 8, background: 'none', border: '1px solid var(--bd)',
                      borderRadius: 4, padding: '4px 14px', fontSize: 11,
                      fontFamily: "'DM Mono', monospace", color: copied ? '#22c55e' : 'var(--mu)',
                      cursor: 'pointer',
                    }}>
                      {copied ? '✓ COPIED' : 'COPY CODE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Invite history */}
              <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
                Invite History — {invites.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--mu)', fontSize: 13 }}>
                    No invites generated yet
                  </div>
                ) : invites.map(inv => (
                  <div key={inv.id} style={{
                    background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 8,
                    padding: '10px 14px', opacity: isUsed(inv) || isExpired(inv) ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, letterSpacing: 3, color: 'var(--tx)' }}>
                          {inv.code}
                        </span>
                        <span style={{
                          fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '2px 6px',
                          borderRadius: 3, letterSpacing: 1, textTransform: 'uppercase',
                          background: inv.role === 'admin' ? 'rgba(59,130,246,0.1)' : 'var(--s2)',
                          color: inv.role === 'admin' ? '#3b82f6' : 'var(--mu)',
                          border: `1px solid ${inv.role === 'admin' ? 'rgba(59,130,246,0.2)' : 'var(--bd)'}`,
                        }}>{inv.role}</span>
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: "'DM Mono', monospace", padding: '2px 6px',
                        borderRadius: 3, letterSpacing: 1,
                        background: isUsed(inv) ? 'rgba(34,197,94,0.1)' : isExpired(inv) ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                        color: isUsed(inv) ? '#22c55e' : isExpired(inv) ? '#ef4444' : '#f97316',
                        border: `1px solid ${isUsed(inv) ? 'rgba(34,197,94,0.2)' : isExpired(inv) ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
                      }}>
                        {isUsed(inv) ? 'USED' : isExpired(inv) ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--mu)' }}>
                      Created {new Date(inv.created_at).toLocaleDateString()}
                      {isUsed(inv) && inv.used_by_profile && ` · Used by ${inv.used_by_profile.full_name}`}
                      {!isUsed(inv) && !isExpired(inv) && ` · Expires ${new Date(inv.expires_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <div>
              <div style={{
                background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10,
                padding: 20, marginBottom: 12,
              }}>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
                  Shop Name
                </div>
                <input
                  type="text"
                  value={settings.shop_name || ''}
                  onChange={(e) => handleUpdateSetting('shop_name', e.target.value)}
                  placeholder="Your shop name"
                  style={{
                    width: '100%', padding: '10px 12px', background: 'var(--s2)',
                    border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx)',
                    fontSize: 15, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{
                background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10,
                padding: 20, marginBottom: 12,
              }}>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--mu)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
                  Inspection Mode
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'single', label: 'Single', desc: 'One inspection per job' },
                    { id: 'intake_outtake', label: 'Intake / Outtake', desc: 'Paired before & after inspections' },
                  ].map(mode => (
                    <button key={mode.id} onClick={() => handleUpdateSetting('inspection_mode', mode.id)} style={{
                      flex: 1, padding: '14px 12px', borderRadius: 8,
                      border: `1.5px solid ${settings.inspection_mode === mode.id ? '#f97316' : 'var(--bd)'}`,
                      background: settings.inspection_mode === mode.id ? 'rgba(249,115,22,0.08)' : 'var(--s2)',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
                        color: settings.inspection_mode === mode.id ? '#f97316' : 'var(--tx)',
                        letterSpacing: 0.5, marginBottom: 2,
                      }}>{mode.label}</div>
                      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--mu)' }}>
                        {mode.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '10px 14px', background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8,
                fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#3b82f6',
              }}>
                More settings coming soon — session timeout, notification preferences, branding
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}