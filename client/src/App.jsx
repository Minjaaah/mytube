import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Profiles from './pages/Profiles'
import ChildHome from './pages/child/Home'
import ChildChannels from './pages/child/Channels'
import ChildSourceVideos from './pages/child/SourceVideos'
import Player from './pages/child/Player'
import ParentSettings from './pages/parent/Settings'

function Router() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('profiles')
  const [params, setParams] = useState({})

  useEffect(() => {
    if (!loading && !user) setPage('signin')
  }, [user, loading])

  const navigate = (newPage, newParams = {}) => {
    setPage(newPage)
    setParams(newParams)
  }

  if (loading) return <Splash />

  if (!user) {
    if (page === 'signup') return <SignUp navigate={navigate} />
    return <SignIn navigate={navigate} />
  }

  switch (page) {
    case 'onboarding': return <Onboarding navigate={navigate} />
    case 'profiles': return <Profiles navigate={navigate} />
    case 'child-home': return <ChildHome navigate={navigate} profile={params.profile} />
    case 'child-channels': return <ChildChannels navigate={navigate} profile={params.profile} />
    case 'child-source-videos': return <ChildSourceVideos navigate={navigate} profile={params.profile} source={params.source} />
    case 'player': return <Player navigate={navigate} profile={params.profile} video={params.video} />
    case 'parent-settings': return <ParentSettings navigate={navigate} profile={params.profile} />
    default: return <Profiles navigate={navigate} />
  }
}

function Splash() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FBF7F2',
      gap: '16px'
    }}>
      <div className="nunito" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px' }}>
        my<span style={{ color: '#D46A3A' }}>tube</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#D46A3A',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
