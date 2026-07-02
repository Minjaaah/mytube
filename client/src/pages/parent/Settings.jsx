import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import PinOverlay from '../../components/PinOverlay'

export default function ParentSettings({ navigate, profile: initialProfile }) {
  const { signOut } = useAuth()
  const [profile, setProfile] = useState(initialProfile)
  const [profiles, setProfiles] = useState([])
  const [sources, setSources] = useState([])
  const [removedSources, setRemovedSources] = useState([])
  const [stats, setStats] = useState([])
  const [activeTab, setActiveTab] = useState('channels')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinStep, setPinStep] = useState('current')
  const [pinMsg, setPinMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [showAuthPin, setShowAuthPin] = useState(true)

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated, profile.id])

  const loadData = async () => {
    const [s, r, st, p] = await Promise.all([
      fetch(`/api/profiles/${profile.id}/sources`).then(r => r.json()),
      fetch(`/api/profiles/${profile.id}/sources?status=removed`).then(r => r.json()),
      fetch(`/api/profiles/${profile.id}/stats`).then(r => r.json()),
      fetch('/api/profiles').then(r => r.json())
    ])
    setSources(Array.isArray(s) ? s : [])
    setRemovedSources(Array.isArray(r) ? r : [])
    setStats(Array.isArray(st) ? st : [])
    setProfiles(Array.isArray(p) ? p : [])
  }

  const searchChannels = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`)
    const data = await r.json()
    setSearchResults(data.items || [])
    setSearching(false)
  }

  const addChannel = async (item) => {
    const r = await fetch(`/api/profiles/${profile.id}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtube_id: item.id.channelId,
        type: 'channel',
        name: item.snippet.title,
        thumbnail_url: item.snippet.thumbnails.default.url
      })
    })
    const source = await r.json()
    setSources(s => [...s, source])
    fetch('/api/youtube/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_id: source.id, youtube_id: item.id.channelId, type: 'channel' })
    })
  }

  const removeSource = async (id) => {
    await fetch(`/api/profiles/${profile.id}/sources/${id}`, { method: 'DELETE' })
    setSources(s => s.filter(x => x.id !== id))
  }

  const updateWeight = async (id, weight) => {
    await fetch(`/api/profiles/${profile.id}/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight })
    })
    setSources(s => s.map(x => x.id === id ? { ...x, weight } : x))
  }

  const reAddSource = async (source) => {
    await fetch(`/api/profiles/${profile.id}/sources/${source.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', removed_at: null })
    })
    setRemovedSources(r => r.filter(x => x.id !== source.id))
    setSources(s => [...s, { ...source, status: 'active' }])
  }

  const updateProfile = async (updates) => {
    const r = await fetch(`/api/profiles/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const updated = await r.json()
    setProfile(updated)
  }

  // Channel stats aggregation
  const channelStats = sources.map(source => {
    const events = stats.filter(e => e.source_id === source.id)
    const totalSeconds = events.reduce((sum, e) => sum + (e.total_seconds_watched || 0), 0)
    const lastWatched = events.length ? events[0].started_at : null
    return { ...source, plays: events.length, totalSeconds, lastWatched }
  }).sort((a, b) => b.totalSeconds - a.totalSeconds)

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  if (showAuthPin) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PinOverlay
          onSuccess={() => { setAuthenticated(true); setShowAuthPin(false) }}
          onClose={() => navigate('profiles')}
          title="enter parent PIN to continue"
        />
      </div>
    )
  }

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh', maxWidth: '390px', margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', padding: '52px 20px 14px', borderBottom: '0.5px solid #EBEBEB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#1A1A1A', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
            my<span style={{ color: '#D46A3A' }}>tube</span>
          </div>
          {/* Profile switcher */}
          <select
            value={profile.id}
            onChange={e => {
              const p = profiles.find(x => x.id === e.target.value)
              if (p) setProfile(p)
            }}
            style={{ fontSize: '13px', fontWeight: 500, color: '#2A2018', background: '#F5F5F5', border: '0.5px solid #EBEBEB', borderRadius: '20px', padding: '6px 12px', fontFamily: 'Inter, sans-serif' }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '0.5px solid #EBEBEB', overflowX: 'auto' }}>
        {[
          { id: 'channels', label: 'Channels' },
          { id: 'stats', label: 'Stats' },
          { id: 'removed', label: 'Removed' },
          { id: 'profile', label: 'Profile' },
          { id: 'account', label: 'Account' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '12px 16px', fontSize: '13px', fontWeight: 500,
            color: activeTab === tab.id ? '#D46A3A' : '#999',
            borderBottom: activeTab === tab.id ? '2px solid #D46A3A' : '2px solid transparent',
            background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #D46A3A' : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif'
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* CHANNELS TAB */}
        {activeTab === 'channels' && (
          <>
            <div style={sectionLabel}>approved</div>
            <div style={card}>
              {sources.map(source => (
                <div key={source.id} style={{ padding: '12px 14px', borderBottom: '0.5px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {source.thumbnail_url && <img src={source.thumbnail_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.name}</div>
                    <div style={{ fontSize: '10px', color: '#B0B0B0', marginTop: '2px' }}>{source.type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['less','normal','more'].map(w => (
                      <button key={w} onClick={() => updateWeight(source.id, w)} style={{
                        fontSize: '10px', fontWeight: 500, padding: '3px 7px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        border: '1.5px solid',
                        borderColor: source.weight === w ? (w === 'more' ? '#3A8A3A' : w === 'less' ? '#C84A2A' : '#ADADAD') : '#EBEBEB',
                        background: source.weight === w ? (w === 'more' ? '#EAF5EA' : w === 'less' ? '#FDF0EE' : '#F5F5F5') : '#fff',
                        color: source.weight === w ? (w === 'more' ? '#3A8A3A' : w === 'less' ? '#C84A2A' : '#666') : '#B0B0B0'
                      }}>{w}</button>
                    ))}
                  </div>
                  <button onClick={() => removeSource(source.id)} style={{ fontSize: '16px', color: '#C8C8C8', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {sources.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#C8C8C8' }}>No channels yet</div>}
            </div>

            <div style={sectionLabel}>add channels</div>
            <div style={{ ...card, padding: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchChannels()}
                  placeholder="search by name..."
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '10px', border: '0.5px solid #EBEBEB', background: '#F5F5F5', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
                <button onClick={searchChannels} disabled={searching} style={{ padding: '11px 16px', background: '#D46A3A', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {searching ? '...' : 'search'}
                </button>
              </div>
              {searchResults.map(item => {
                const added = sources.some(s => s.youtube_id === item.id.channelId)
                return (
                  <div key={item.id.channelId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                    <img src={item.snippet.thumbnails.default.url} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.snippet.title}</div>
                    </div>
                    <button onClick={() => !added && addChannel(item)} style={{
                      width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: added ? '#EAF5EA' : '#D46A3A', color: added ? '#3A8A3A' : '#fff', fontSize: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{added ? '✓' : '+'}</button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <>
            <div style={sectionLabel}>most watched</div>
            <div style={card}>
              {channelStats.map((source, i) => (
                <div key={source.id} style={{ padding: '12px 14px', borderBottom: '0.5px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: i < 2 ? '#D46A3A' : '#C8C8C8', width: '16px' }}>{i + 1}</div>
                  {source.thumbnail_url && <img src={source.thumbnail_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '9px', objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.name}</div>
                    <div style={{ fontSize: '10px', color: '#B0B0B0', marginTop: '2px' }}>
                      {source.plays} plays · {formatTime(source.totalSeconds)}
                      {source.lastWatched && ` · ${new Date(source.lastWatched).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['less','normal','more'].map(w => (
                      <button key={w} onClick={() => updateWeight(source.id, w)} style={{
                        fontSize: '9px', fontWeight: 500, padding: '3px 6px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        border: '1.5px solid',
                        borderColor: source.weight === w ? (w === 'more' ? '#3A8A3A' : w === 'less' ? '#C84A2A' : '#ADADAD') : '#EBEBEB',
                        background: source.weight === w ? (w === 'more' ? '#EAF5EA' : w === 'less' ? '#FDF0EE' : '#F5F5F5') : '#fff',
                        color: source.weight === w ? (w === 'more' ? '#3A8A3A' : w === 'less' ? '#C84A2A' : '#666') : '#B0B0B0'
                      }}>{w}</button>
                    ))}
                  </div>
                </div>
              ))}
              {channelStats.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#C8C8C8' }}>No viewing data yet</div>}
            </div>
          </>
        )}

        {/* REMOVED TAB */}
        {activeTab === 'removed' && (
          <>
            <div style={sectionLabel}>recently removed — kept 90 days</div>
            <div style={card}>
              {removedSources.map(source => (
                <div key={source.id} style={{ padding: '12px 14px', borderBottom: '0.5px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {source.thumbnail_url && <img src={source.thumbnail_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', opacity: 0.6 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#8A7A6E' }}>{source.name}</div>
                    <div style={{ fontSize: '10px', color: '#C8C8C8', marginTop: '2px' }}>
                      removed {source.removed_at ? new Date(source.removed_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <button onClick={() => reAddSource(source)} style={{ padding: '7px 14px', background: '#FBF7F2', border: '0.5px solid #EDE8E2', borderRadius: '10px', fontSize: '12px', fontWeight: 500, color: '#D46A3A', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    re-add
                  </button>
                </div>
              ))}
              {removedSources.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#C8C8C8' }}>No removed channels</div>}
            </div>
          </>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <div style={sectionLabel}>settings for {profile.name}</div>
            <div style={card}>
              {[
                { key: 'autoplay', label: 'Autoplay', sub: 'Next video plays automatically' },
                { key: 'show_shelf', label: 'Show next shelf', sub: 'Shelf appears after each video' },
                { key: 'show_channel_browse', label: 'Channel browse page', sub: 'Child can browse all channels' },
                { key: 'show_replay', label: 'Replay button', sub: 'Replay button visible during playback' },
                { key: 'show_continue_watching', label: 'Continue watching', sub: 'Shows last video on home screen' }
              ].map(setting => (
                <div key={setting.key} style={{ padding: '14px 16px', borderBottom: '0.5px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>{setting.label}</div>
                    <div style={{ fontSize: '11px', color: '#B0B0B0', marginTop: '2px' }}>{setting.sub}</div>
                  </div>
                  <button
                    onClick={() => updateProfile({ [setting.key]: !profile[setting.key] })}
                    style={{
                      width: '44px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                      background: profile[setting.key] ? '#D46A3A' : '#E0E0E0', position: 'relative', transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      position: 'absolute', width: '20px', height: '20px', borderRadius: '50%',
                      background: 'white', top: '3px', transition: 'transform 0.2s',
                      transform: profile[setting.key] ? 'translateX(21px)' : 'translateX(3px)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                    }} />
                  </button>
                </div>
              ))}

              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A', marginBottom: '8px' }}>
                  shelf video count: <span style={{ color: '#D46A3A' }}>{profile.shelf_count || 6}</span>
                </div>
                <input
                  type="range" min="4" max="12"
                  value={profile.shelf_count || 6}
                  onChange={e => updateProfile({ shelf_count: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#D46A3A' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#C8C8C8', marginTop: '4px' }}>
                  <span>4</span><span>12</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <>
            <div style={sectionLabel}>account</div>
            <div style={card}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #F5F5F5' }}>
                <div style={{ fontSize: '13px', color: '#B0B0B0' }}>signed in — settings synced to cloud</div>
              </div>
            </div>

            <div style={sectionLabel}>danger zone</div>
            <div style={card}>
              <button onClick={async () => { await signOut(); navigate('signin') }} style={{ width: '100%', padding: '14px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#C84A2A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                sign out
              </button>
            </div>
          </>
        )}

        {/* Done button */}
        <button
          onClick={() => navigate('child-home', { profile })}
          style={{ width: '100%', padding: '15px', background: '#fff', border: '0.5px solid #EBEBEB', borderRadius: '14px', fontSize: '14px', fontWeight: 500, color: '#8A7A6E', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: '8px' }}
        >
          done — back to mytube
        </button>

      </div>
    </div>
  )
}

const sectionLabel = { fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 4px' }
const card = { background: '#fff', borderRadius: '14px', border: '0.5px solid #EBEBEB', overflow: 'hidden' }
