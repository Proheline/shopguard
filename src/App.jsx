import { useAuth } from './hooks/useAuth'
import LoginPage from './components/auth/LoginPage'
import ShopGuard from './components/inspection/ShopGuard'

function App() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0c0c11',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#606090',
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        letterSpacing: 2,
      }}>
        LOADING...
      </div>
    )
  }

  if (!user) {
    return <LoginPage onAuth={{ signIn, signUp }} />
  }

  return <ShopGuard profile={profile} onSignOut={signOut} />
}

export default App