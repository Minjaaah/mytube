import { useState, useEffect, useRef } from 'react'
import PinOverlay from '../../components/PinOverlay'
import ChannelBadge from '../../components/ChannelBadge'

export default function ChildChannels({ navigate, profile }) {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPin, setShowPin] = useState(false)
  const longPressTimer = useRef(null)

  useEffect(() => {
    fetch(`/api/profiles/${profile.id}/sources`)
      .then(r => r.json())
      .then(data => { setSources(Array.isArray(data) ? data : []); setLoading(false) })
  }, [profile.id])

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => setShowPin(true), 600)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  if (loading) return (
    <div style={screen}>
      <div style={{ color: '#C4B8AC', fontSize: '13px' }}>loading...</div>
    </div>
  )

  return (
    <div style={{ background: '#FBF7F2', minHeight: '100vh', maxWidth: '390px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
        <div className="nunito" style={{ fontSize: '20px', fontWeight: 800, color: '#2A2018', letterSpacing: '-0.5px' }}>channels</div>
        <button onClick={() => navigate('profiles')} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FFFFFF', border: '0.5px solid #E8E0D8', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {profile.avatar}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {sources.map(source => (
            <button
              key={source.id}
              onClick={() => navigate('child-source-videos', { profile, source })}
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              style={{ borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF', border: '0.5px solid #EDE8E2', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDE8E2' }}>
                {source.thumbnail_url
                  ? <img src={source.thumbnail_url} alt={source.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '44px' }}>📺</span>
                }
              </div>
              <div className="nunito" style={{ fontSize: '13px', fontWeight: 800, color: '#2A2018', textAlign: 'center', padding: '8px 10px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {source.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px' }}>
        <button onClick={() => navigate('child-home', { profile })} style={homeBtn}>
          🏠 <span className="nunito" style={{ fontSize: '13px', fontWeight: 700, color: '#C4B8AC' }}>home</span>
        </button>
      </div>

      {showPin && (
        <PinOverlay
          onSuccess={() => { setShowPin(false); navigate('parent-settings', { profile }) }}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  )
}

const screen = { minHeight: '100vh', background: '#FBF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const homeBtn = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', background: '#FFFFFF', border: '0.5px solid #EDE8E2' }
