import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Profiles({ navigate }) {
  const { signOut } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(data => {
        setProfiles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div style={containerStyle}>
      <Logo />
      <div style={{ color: '#C4B8AC', fontSize: '13px' }}>loading...</div>
    </div>
  )

  if (profiles.length === 0) {
    return (
      <div style={containerStyle}>
        <Logo />
        <div style={{ color: '#B0A090', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
          No profiles yet.<br />Let's set up Mytube.
        </div>
        <button onClick={() => navigate('onboarding')} style={primaryBtn}>get started</button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <Logo />
      <div style={{ fontSize: '13px', color: '#B0A090', marginBottom: '8px' }}>who's watching?</div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '28px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
        {profiles.map(profile => (
          <button key={profile.id} onClick={() => navigate('child-home', { profile })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'none', border: 'none' }}>
            <div style={{
              width: '104px', height: '104px', borderRadius: '50%',
              background: '#FFFFFF', border: '0.5px solid #E8E0D8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '52px'
            }}>
              {profile.avatar}
            </div>
            <span className="nunito" style={{ fontSize: '15px', fontWeight: 700, color: '#2A2018' }}>
              {profile.name}
            </span>
          </button>
        ))}

        <button onClick={() => navigate('onboarding')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'none', border: 'none' }}>
          <div style={{
            width: '104px', height: '104px', borderRadius: '50%',
            background: 'transparent', border: '1px dashed #D4C8BC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', color: '#C4B8AC'
          }}>+</div>
          <span className="nunito" style={{ fontSize: '13px', fontWeight: 600, color: '#C4B8AC' }}>add</span>
        </button>
      </div>

      <button onClick={() => navigate('parent-settings', { profile: profiles[0] })} style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '10px 20px', background: 'none', border: 'none',
        fontSize: '12px', color: '#C4B8AC'
      }}>
        🔒 parent settings
      </button>
    </div>
  )
}

function Logo() {
  return (
    <div className="nunito" style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
      my<span style={{ color: '#D46A3A' }}>tube</span>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh', background: '#FBF7F2',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'space-between',
  padding: '64px 32px 48px', maxWidth: '390px', margin: '0 auto'
}

const primaryBtn = {
  width: '100%', padding: '16px',
  background: '#D46A3A', border: 'none',
  borderRadius: '14px', fontSize: '15px',
  fontWeight: 500, color: '#fff',
  fontFamily: 'Inter, sans-serif'
}
