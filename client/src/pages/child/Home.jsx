import { useState, useEffect, useRef } from 'react'
import PinOverlay from '../../components/PinOverlay'
import ChannelBadge from '../../components/ChannelBadge'

export default function ChildHome({ navigate, profile }) {
  const [videos, setVideos] = useState([])
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPin, setShowPin] = useState(false)
  const [pinTarget, setPinTarget] = useState(null)
  const longPressTimer = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/profiles/${profile.id}/videos`).then(r => r.json()),
      fetch(`/api/profiles/${profile.id}/resume`).then(r => r.json())
    ]).then(([vids, res]) => {
      setVideos(Array.isArray(vids) ? shuffle(vids) : [])
      setResume(res)
      setLoading(false)
    })
  }, [profile.id])

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const handleLongPress = (video) => {
    setPinTarget(video)
    setShowPin(true)
  }

  const startLongPress = (video) => {
    longPressTimer.current = setTimeout(() => handleLongPress(video), 600)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handlePlay = (video) => {
    navigate('player', { profile, video, returnTo: 'child-home' })
  }

  const handleChannelBadge = (source) => {
    navigate('child-source-videos', { profile, source })
  }

  if (loading) return <LoadingScreen />

  return (
    <div style={{ background: '#FBF7F2', minHeight: '100vh', maxWidth: '390px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px', flexShrink: 0 }}>
        <div className="nunito" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.8px' }}>
          my<span style={{ color: '#D46A3A' }}>tube</span>
        </div>
        <button
          onClick={() => navigate('profiles')}
          style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FFFFFF', border: '0.5px solid #E8E0D8', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {profile.avatar}
        </button>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Continue watching */}
        {resume && (
          <>
            <div style={sectionLabel}>continue watching</div>
            <VideoCard
              video={{ youtube_video_id: resume.youtube_video_id, title: resume.video_title, thumbnail_url: resume.thumbnail_url }}
              onPlay={() => handlePlay({ youtube_video_id: resume.youtube_video_id, title: resume.video_title, thumbnail_url: resume.thumbnail_url, timestamp_seconds: resume.timestamp_seconds })}
              onLongPress={() => handleLongPress(null)}
              onStartLongPress={() => startLongPress(null)}
              onCancelLongPress={cancelLongPress}
              onChannelBadge={null}
              isResume
              resumeProgress={resume.timestamp_seconds}
            />
          </>
        )}

        <div style={sectionLabel}>for you</div>

        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#C4B8AC', fontSize: '13px', padding: '40px 0' }}>
            No videos yet — ask a parent to add some channels!
          </div>
        ) : (
          videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={() => handlePlay(video)}
              onLongPress={() => handleLongPress(video)}
              onStartLongPress={() => startLongPress(video)}
              onCancelLongPress={cancelLongPress}
              onChannelBadge={() => handleChannelBadge({ id: video.source_id, name: video.sources?.name, thumbnail_url: video.sources?.thumbnail_url })}
            />
          ))
        )}

        {/* All channels button */}
        <button
          onClick={() => navigate('child-channels', { profile })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', background: '#FFFFFF', border: '0.5px solid #EDE8E2', marginTop: '4px', width: '100%', fontFamily: 'Inter, sans-serif' }}
        >
          <span style={{ fontSize: '16px' }}>📺</span>
          <span className="nunito" style={{ fontSize: '13px', fontWeight: 700, color: '#C4B8AC' }}>all channels</span>
        </button>

      </div>

      {showPin && (
        <PinOverlay
          onSuccess={() => { setShowPin(false); navigate('parent-settings', { profile }) }}
          onClose={() => setShowPin(false)}
          video={pinTarget}
          profile={profile}
        />
      )}
    </div>
  )
}

function VideoCard({ video, onPlay, onLongPress, onStartLongPress, onCancelLongPress, onChannelBadge, isResume, resumeProgress }) {
  return (
    <div
      style={{ borderRadius: '14px', overflow: 'hidden', background: '#FFFFFF', border: '0.5px solid #EDE8E2', position: 'relative', flexShrink: 0 }}
      onMouseDown={onStartLongPress}
      onMouseUp={onCancelLongPress}
      onMouseLeave={onCancelLongPress}
      onTouchStart={onStartLongPress}
      onTouchEnd={onCancelLongPress}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onPlay}>
        <img
          src={video.thumbnail_url}
          alt={video.title}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
        />
        {isResume && (
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: '#D46A3A', borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 500 }}>▶ continue</span>
          </div>
        )}
        {/* Channel badge — top right */}
        {onChannelBadge && (
          <ChannelBadge
            thumbnailUrl={video.sources?.thumbnail_url}
            onClick={(e) => { e.stopPropagation(); onChannelBadge() }}
          />
        )}
      </div>

      {/* Progress bar for resume */}
      {isResume && (
        <div style={{ height: '3px', background: '#EDE8E2' }}>
          <div style={{ height: '100%', background: '#D46A3A', width: '40%', borderRadius: '0 2px 2px 0' }} />
        </div>
      )}

      {/* Meta */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div className="nunito" style={{ fontSize: '13px', fontWeight: 700, color: '#2A2018', lineHeight: 1.3 }}>
          {video.title}
        </div>
        <div style={{ fontSize: '11px', color: '#C4B8AC', marginTop: '3px' }}>
          {video.channel_name || video.sources?.name}
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '13px', color: '#C4B8AC' }}>loading your videos...</div>
    </div>
  )
}

const sectionLabel = {
  fontSize: '11px', fontWeight: 500, color: '#C4B8AC',
  textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 0 2px'
}
