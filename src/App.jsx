import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useInspection } from './hooks/useInspection'
import LoginPage from './components/auth/LoginPage'
import ShopGuard from './components/inspection/ShopGuard'
import InspectionList from './components/inspection/InspectionList'
import AdminPanel from './components/admin/AdminPanel'

function App() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth()
  const inspection = useInspection(user?.id)
  const [view, setView] = useState('list')
  const [loadedData, setLoadedData] = useState(null)

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

  const handleNewInspection = () => {
    setLoadedData(null)
    inspection.setInspectionId(null)
    setView('inspection')
  }

  const handleOpenInspection = async (id) => {
    const result = await inspection.loadInspection(id)
    if (result.data) {
      setLoadedData(result.data)
      setView('inspection')
    }
  }

  const handleBackToList = () => {
    setLoadedData(null)
    inspection.setInspectionId(null)
    setView('list')
  }

  if (view === 'admin' && profile?.role === 'admin') {
    return (
      <div style={{
        background: '#0c0c11',
        color: '#e8e8f2',
        minHeight: '100vh',
        fontFamily: "'Rajdhani', sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #0c0c11; --sf: #13131c; --s2: #1b1b27; --bd: #28283a;
            --tx: #e8e8f2; --mu: #606090; --ac: #f97316;
          }
          body { background: var(--bg); color: var(--tx); font-family: 'Rajdhani', sans-serif; }
        `}</style>
        <header style={{
          background: '#13131c', borderBottom: '1px solid #28283a', padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#f97316', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🔍</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, lineHeight: 1, color: '#e8e8f2' }}>SHOPGUARD</div>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#606090', letterSpacing: 3, textTransform: 'uppercase' }}>Vehicle Inspection</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f2' }}>{profile.full_name}</span>
              </div>
            )}
            <button onClick={signOut} style={{
              background: '#1b1b27', border: '1px solid #28283a', borderRadius: 6,
              padding: '7px 13px', color: '#ef4444', fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600, cursor: 'pointer',
            }}>↪ Out</button>
          </div>
        </header>
        <AdminPanel profile={profile} onBack={() => setView('list')} />
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div style={{
        background: '#0c0c11',
        color: '#e8e8f2',
        minHeight: '100vh',
        fontFamily: "'Rajdhani', sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #0c0c11; --sf: #13131c; --s2: #1b1b27; --bd: #28283a;
            --tx: #e8e8f2; --mu: #606090; --ac: #f97316;
          }
          body { background: var(--bg); color: var(--tx); font-family: 'Rajdhani', sans-serif; }
        `}</style>
        <header style={{
          background: '#13131c', borderBottom: '1px solid #28283a', padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#f97316', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🔍</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, lineHeight: 1, color: '#e8e8f2' }}>SHOPGUARD</div>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#606090', letterSpacing: 3, textTransform: 'uppercase' }}>Vehicle Inspection</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f2' }}>{profile.full_name}</span>
              </div>
            )}
            {profile?.role === 'admin' && (
              <button onClick={() => setView('admin')} style={{
                background: '#1b1b27', border: '1px solid #28283a', borderRadius: 6,
                padding: '7px 13px', color: '#3b82f6', fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5,
              }}>⚙ Admin</button>
            )}
            <button onClick={signOut} style={{
              background: '#1b1b27', border: '1px solid #28283a', borderRadius: 6,
              padding: '7px 13px', color: '#ef4444', fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600, cursor: 'pointer',
            }}>↪ Out</button>
          </div>
        </header>
        <InspectionList
          onNew={handleNewInspection}
          onOpen={handleOpenInspection}
          onDelete={inspection.deleteInspection}
          listInspections={inspection.listInspections}
        />
      </div>
    )
  }

  return (
    <ShopGuard
      profile={profile}
      onSignOut={signOut}
      onBackToList={handleBackToList}
      inspection={inspection}
      loadedData={loadedData}
    />
  )
}

export default App