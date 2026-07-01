import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const AVATARS = ['🦊','🐻','🐼','🦁','🐸','🦋','🐬','🦄']
const PRESETS = [
  { id: 'infant', icon: '👶', name: 'Infant', desc: 'Sits back and watches. Videos play automatically, one after another.' },
  { id: 'toddler', icon: '😊', name: 'Toddler', desc: 'Ready to explore. Picks videos independently from approved channels.' },
  { id: 'older', icon: '⭐', name: 'Older child', desc: 'More independence. Bigger selection, more browsing freedom.' }
]

export default function Onboarding({ navigate }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [profileName, setProfileName] = useState('')
  const [avatar, setAvatar] = useState('🦊')
  const [preset, setPreset] = useState('toddler')
  const [channels, setChannels] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [createdProfile, setCreatedProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const progress = (step / 5) * 100

  const handlePinKey = (digit, isConfirm) => {
    if (isConfirm) {
      if (pinConfirm.length < 4) setPinConfirm(p => p + digit)
    } else {
      if (pin.length < 4) setPin(p => p + digit)
    }
  }

  const handlePinDel = (isConfirm) => {
    if (isConfirm) setPinConfirm(p => p.slice(0,-1))
    else setPin(p => p.slice(0,-1))
  }

  const setupPin = async () => {
    if (pin !== pinConfirm) return setPinError("PINs don't match — try again")
    setLoading(true)
    const r = await fetch('/api/pin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
    if (r.ok) { setStep(3); setPinError('') }
    setLoading(false)
  }

  const createProfile = async () => {
    if (!profileName.trim()) return
    setLoading(true)
    const r = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profileName, avatar, preset })
    })
    const data = await r.json()
    setCreatedProfile(data)
    setStep(4)
    setLoading(false)
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
    const channelId = item.id.channelId
    const name = item.snippet.title
    const thumbnail_url = item.snippet.thumbnails.default.url
    const r = await fetch(`/api/profiles/${createdProfile.id}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtube_id: channelId, type: 'channel', name, thumbnail_url })
    })
    const source = await r.json()
    setChannels(c => [...c, source])
    // Fetch videos in background
    fetch('/api/youtube/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_id: source.id, youtube_id: channelId, type: 'channel' })
    })
  }

  const removeChannel = (id) => setChannels(c => c.filter(ch => ch.id !== id))

  return (
    <div style={{ minHeight: '100vh', background: '#fff', maxWidth: '390px', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '52px 28px 40px' }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '40px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? '#D46A3A' : '#EDE8E2' }} />
        ))}
      </div>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="nunito" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px' }}>
              my<span style={{ color: '#D46A3A' }}>tube</span>
            </div>
            <div style={{ fontSize: '15px', color: '#B0A090', lineHeight: 1.6, marginBottom: '40px' }}>
              YouTube your kids will actually love — curated by you
            </div>
            {[
              { icon: '🛡️', title: 'Only what you approve', desc: 'Nothing plays unless you\'ve added it. No algorithm surprises.' },
              { icon: '❤️', title: 'Feels like real YouTube', desc: 'Kids browse freely and choose what they want to watch.' },
              { icon: '⚡', title: 'Control when you need it', desc: 'Remove or adjust channels in seconds, right from the screen.' }
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#2A2018', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#B0A090', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} style={primaryBtn}>get started</button>
        </div>
      )}

      {/* Step 2 — PIN */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={stepLabel}>step 2 of 5</div>
          <div style={stepTitle}>set your parent PIN</div>
          <div style={stepSub}>This protects your settings while your child is using the app.</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '32px' }}>
            <div style={{ fontSize: '13px', color: '#8A7A6E' }}>{pin.length < 4 ? 'choose a 4-digit PIN' : 'confirm your PIN'}</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '1.5px solid #D4C8BC',
                  background: (pin.length < 4 ? pin.length : pinConfirm.length) > i ? '#D46A3A' : 'transparent',
                  borderColor: (pin.length < 4 ? pin.length : pinConfirm.length) > i ? '#D46A3A' : '#D4C8BC'
                }} />
              ))}
            </div>
            <PinPad onKey={d => handlePinKey(d, pin.length >= 4)} onDel={() => handlePinDel(pin.length >= 4)} />
            {pinError && <div style={{ fontSize: '12px', color: '#C84A2A' }}>{pinError}</div>}
            {pin.length >= 4 &&
