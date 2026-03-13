import { useState } from 'react'

export default function LoginPage({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
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
      const { error } = await onAuth.signUp(email, password, fullName)
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
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 9,
              fontFamily: "'DM Mono', monospace",
              color: '#606090',
              letterSpacing: 1.5,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>Full Name</div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 9,
            fontFamily: "'DM Mono', monospace",
            color: '#606090',
            letterSpacing: 1.5,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tech@shopguard.app"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 9,
            fontFamily: "'DM Mono', monospace",
            color: '#606090',
            letterSpacing: 1.5,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}>Password</div>
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
              : "Need an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  )
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