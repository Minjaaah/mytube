import { useState, useEffect, useRef } from 'react'
import PinOverlay from '../../components/PinOverlay'
import ChannelBadge from '../../components/ChannelBadge'

export default function Player({ navigate, profile, video, returnTo, returnParams }) {
  const [showShelf, setShowShelf] = useState(false)
  const [shelfVideos, setShelfVideos] = useState([])
  const [allVideos, setAllVideos] = useState([])
  const [showPin, setShowPin] = useState(false)
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight)
  const [viewingId, setViewingId] = useState(null)
  const heartbeatTimer = useRef(null)
  const secondsWatched = useRef(0)
  const longPressTimer = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    // Load all videos for shelf
    fetch(`/api/profiles/${profile.id}/videos`)
      .then(r => r.json())
      .then(data => {
        const vids = Array.isArray(data) ? data : []
        setAllVideos(vids)
        setShelfVideos(shuffle(vids.filter(v => v.youtube_video_id !== video.youtube_video_id)).slice(0, profile.shelf_count || 6))
      })

    // Log viewing event
    fetch('/api/viewing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profile.id,
        youtube_video_id: video.youtube_video_id,
        channel_name: video.channel_name || '',
        source_id: video.source_id || null
      })
    }).then(r => r.json()).then(data => setViewingId(data.id))

    // Save resume state
    fetch(`/api/profiles/${profile.id}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtube_video_id: video.youtube_video_id,
        video_title: video.title,
        thumbnail_url: video.thumbnail_url,
        timestamp_seconds: video.timestamp_seconds || 0
      })
    })

    // Orientation handler
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', handleResize)

    // Heartbeat
    heartbeatTimer.current = setInterval(() => {
      secondsWatched.current += 30
      if (viewingId) {
        fetch(`/api/viewing/${viewingId}/heartbeat`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ total_seconds_watched: secondsWatched.current })
        })
      }
    }, 30000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(heartbeatTimer.current)
    }
  }, [video.youtube_video_id, profile.id])

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const handleNext = (nextVideo) => {
    setShowShelf(false)
    navigate('player', { profile, video: nextVideo, returnTo, returnParams })
  }

  const handleChannelBadge = (source) => {
    navigate('child-source-videos', { profile, source })
  }

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => setShowPin(true), 600)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const embedUrl = `https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1${video.timestamp_seconds ? `&start=${video.timestamp_seconds}` : ''}`

  return (
    <div style={{ background: '#0A0A0A', width: '100vw', height: '100vh', position: 'fixed', inset: 0, display: 'flex', flexDirection: isLandscape ? 'row' : 'column' }}>

      {/* YouTube Player */}
      <div ref={playerRef} style={{ flex: isLandscape ? 1 : 'none', width: isLandscape ? 'auto' : '100%', aspectRatio: isLandscape ? 'auto' : '16/9', position: 'relative' }}>
        <iframe
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Controls — bottom right */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10 }}>
        {/* Replay */}
        {profile.show_replay !== false && (
          <button
            onClick={() => navigate('player', { profile, video, returnTo, returnParams })}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            style={ctrlBtn}
          >🔄</button>
        )}
        {/* Shelf trigger */}
        <button
          onClick={() => setShowShelf(true)}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          style={ctrlBtn}
        >⊞</button>
      </div>

      {/* Now playing — top left */}
      {!showShelf && (
        <div style={{ position: 'fixed', top: '18px', left: '18px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D46A3A', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {video.title}
          </span>
        </div>
      )}

      {/* Shelf overlay */}
      {showShelf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.87)', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>what's next?</span>
            <button onClick={() => setShowShelf(false)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '17px', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 18px 4px', scrollbarWidth: 'none' }}>
            {shelfVideos.map(v => (
              <div
                key={v.id}
                onClick={() => handleNext(v)}
                style={{ flexShrink: 0, width: '192px', borderRadius: '10px', overflow: 'hidden', background: '#1E1E1E', cursor: 'pointer', position: 'relative' }}
              >
                <img src={v.thumbnail_url} alt={v.title} style={{ width: '192px', height: '108px', objectFit: 'cover', display: 'block' }} />
                <ChannelBadge
                  thumbnailUrl={v.sources?.thumbnail_url}
                  onClick={(e) => { e.stopPropagation(); handleChannelBadge({ id: v.source_id, name: v.sources?.name, thumbnail_url: v.sources?.thumbnail_url }) }}
                />
                <div style={{ padding: '6px 10px 8px' }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.channel_name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.68)', fontWeight: 500, lineHeight: 1.3, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Home button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button
              onClick={() => navigate('child-home', { profile })}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '20px', padding: '8px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              more videos
            </button>
          </div>
        </div>
      )}

      {/* PIN overlay */}
      {showPin && (
        <PinOverlay
          onSuccess={() => { setShowPin(false); navigate('parent-settings', { profile }) }}
          onClose={() => setShowPin(false)}
        />
      )}
    </div>
  )
}

const ctrlBtn = {
  width: '50px', height: '50px', borderRadius: '50%',
  border: '1.5px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.5)',
  fontSize: '20px', color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
}
