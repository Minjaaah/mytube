import { useState, useEffect, useRef } from 'react'
import PinOverlay from '../../components/PinOverlay'
import ChannelBadge from '../../components/ChannelBadge'

export default function ChildSourceVideos({ navigate, profile, source }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPin, setShowPin] = useState(false)
  const longPressTimer = useRef(null)

  useEffect(() => {
    fetch(`/api/profiles/${profile.id}/videos`)
      .then(r => r.json())
      .then(data => {
        const filtered = Array.isArray(data)
          ? data.filter(v => v.source_id === source.id)
          : []
        setVideos(filtered)
        setLoading(false)
      })
  }, [profile.id, source.id])

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
        <button
          onClick={() => navigate('child-channels', { profile })}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {source.thumbnail_url && (
            <img src={source.thumbnail_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <span className="nunito" style={{ fontSize: '17px', fontWeight: 800, color: '#2A2018' }}>{source.name}</span>
        </button>
        <button
          onClick={() => navigate('profiles')}
          style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FFFFFF', border: '0.5px solid #E8E0D8', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {profile.avatar}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#C4B8AC', fontSize: '13px', padding: '40px 0' }}>
            No videos found for this channel.
          </div>
        ) : (
          videos.map(video => (
            <div
              key={video.id}
              style={{ borderRadius: '14px', overflow: 'hidden', background: '#FFFFFF', border: '0.5px solid #EDE8E2', flexShrink: 0, position: 'relative' }}
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('player', { profile, video, returnTo: 'child-source-videos', returnParams: { source } })}>
                <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div className="nunito" style={{ fontSize: '13px', fontWeight: 700, color: '#2A2018', lineHeight: 1.3 }}>
                  {video.title}
                </div>
              </div>
            </div>
          ))
        )}
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
