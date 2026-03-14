import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }
      if (!inviteCode.trim()) {
        setError('Invite code is required — ask your shop admin')
        setLoading(false)
        return
      }

      // Validate invite code first
      const { data: validation, error: valError } = await supabase
        .rpc('validate_invite_code', { invite_code: inviteCode.toUpperCase().trim() })

      if (valError || !validation?.valid) {
        setError('Invalid or expired invite code')
        setLoading(false)
        return
      }

      // Sign up with invite code in metadata
      const { error } = await onAuth.signUp(email, password, fullName, inviteCode.toUpperCase().trim())
      if (error) setError(error.message)
      else setError('Check your email to confirm your account')
    } else {
      const { error } = await onAuth.signIn(email, password)
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0c11',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
      <div style={{
        background: '#13131c',
        border: '1px solid #28283a',
        borderRadius: 12,
        padding: 32,
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48,
            background: '#f97316',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 12px',
          }}>🔍</div>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#e8e8f2',
          }}>SHOPGUARD</div>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: '#606090',
            letterSpacing: 3,
          }}>VEHICLE INSPECTION</div>
        </div>

        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#e8e8f2',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          {isSignUp ? 'Create Account' : 'Tech Login'}
        </div>

        {isSignUp && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Invite Code <span style={{ color: '#f97316' }}>*</span></div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="6-digit code from your admin"
                maxLength={6}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 6,
                  fontFamily: "'DM Mono', monospace",
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Full Name <span style={{ color: '#f97316' }}>*</span></div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tech@shopguard.app"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            background: error.includes('Check your email')
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${error.includes('Check your email')
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            color: error.includes('Check your email')
              ? '#22c55e'
              : '#ef4444',
          }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#7c2d12' : '#f97316',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: 1,
            cursor: loading ? 'default' : 'pointer',
            marginBottom: 16,
          }}
        >
          {loading ? 'PLEASE WAIT...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            style={{
              background: 'none',
              border: 'none',
              color: '#606090',
              fontSize: 13,
              fontFamily: "'Rajdhani', sans-serif",
              cursor: 'pointer',
            }}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Need an account? Ask your admin for a code"}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 9,
  fontFamily: "'DM Mono', monospace",
  color: '#606090',
  letterSpacing: 1.5,
  marginBottom: 4,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#1b1b27',
  border: '1px solid #28283a',
  borderRadius: 6,
  color: '#e8e8f2',
  fontSize: 14,
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
}