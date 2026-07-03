import { useState } from 'react'

export default function Onboarding({ navigate }) {
  const [step, setStep] = useState(1)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [profileName, setProfileName] = useState('')
  const [avatar, setAvatar] = useState('🦊')
  const [preset, setPreset] = useState('toddler')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdProfile, setCreatedProfile] = useState(null)

  const AVATARS = ['🦊','🐻','🐼','🦁','🐸','🦋','🐬','🦄']

  const setupPin = async () => {
    if (pin !== pinConfirm) return setError("PINs don't match")
    if (pin.length !== 4) return setError("PIN must be 4 digits")
    setLoading(true)
    const r = await fetch('/api/pin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
    if (r.ok) { setStep(3); setError('') }
    else setError('Failed to save PIN')
    setLoading(false)
  }

  const createProfile = async () => {
    if (!profileName.trim()) return setError('Please enter a name')
    setLoading(true)
    const r = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profileName, avatar, preset })
    })
    const data = await r.json()
    if (data.id) { setCreatedProfile(data); setStep(4) }
    else setError('Failed to create profile')
    setLoading(false)
  }

  const s = { maxWidth: '390px', margin: '0 auto', minHeight: '100vh', background: '#fff', padding: '52px 28px 40px', display: 'flex', flexDirection: 'column' }
  const progress = { display: 'flex', gap: '4px', marginBottom: '40px' }
  const bar = (active) => ({ flex: 1, height: '3px', borderRadius: '2px', background: active ? '#D46A3A' : '#EDE8E2' })
  const title = { fontSize: '22px', fontWeight: 500, color: '#1A1A1A', marginBottom: '6px' }
  const sub = { fontSize: '13px', color: '#B0A090', lineHeight: 1.5, marginBottom: '24px' }
  const input = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '0.5px solid #EDE8E2', background: '#FBF7F2', fontSize: '14px', outline: 'none', marginBottom: '14px', fontFamily: 'Inter, sans-serif' }
  const btn = { width: '100%', padding: '16px', background: '#D46A3A', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 500, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: '16px' }

  return (
    <div style={s}>
      <div style={progress}>
        {[1,2,3,4,5].map(i => <div key={i} style={bar(i <= step)} />)}
      </div>

      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nunito" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px' }}>
            my<span style={{ color: '#D46A3A' }}>tube</span>
          </div>
          <div style={{ fontSize: '15px', color: '#B0A090', lineHeight: 1.6, marginBottom: '32px' }}>
            YouTube your kids will love — curated by you.
          </div>
          <div style={{ flex: 1 }} />
          <button style={btn} onClick={() => setStep(2)}>get started</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#D46A3A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>step 2 of 5</div>
          <div style={title}>set your parent PIN</div>
          <div style={sub}>This protects your settings while your child uses the app.</div>
          <input style={input} type="password" maxLength={4} placeholder="4-digit PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/,'').slice(0,4))} />
          <input style={input} type="password" maxLength={4} placeholder="confirm PIN" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/,'').slice(0,4))} />
          {error && <div style={{ color: '#C84A2A', fontSize: '12px' }}>{error}</div>}
          <button style={{ ...btn, opacity: pin.length === 4 && pinConfirm.length === 4 ? 1 : 0.4 }} onClick={setupPin} disabled={loading}>
            {loading ? 'saving...' : 'continue'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#D46A3A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>step 3 of 5</div>
          <div style={title}>create a child profile</div>
          <div style={sub}>You can add more profiles later.</div>
          <input style={input} placeholder="child's name" value={profileName} onChange={e => setProfileName(e.target.value)} />
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#8A7A6E', marginBottom: '8px' }}>pick an avatar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '20px' }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} style={{ aspectRatio: '1', borderRadius: '50%', fontSize: '28px', border: `2px solid ${avatar === a ? '#D46A3A' : 'transparent'}`, background: avatar === a ? '#FDF3EE' : '#FBF7F2', cursor: 'pointer' }}>{a}</button>
            ))}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#8A7A6E', marginBottom: '8px' }}>preset</div>
          {[{id:'infant',label:'Infant — autoplay, parent controls'},
            {id:'toddler',label:'Toddler — child picks videos'},
            {id:'older',label:'Older child — more independence'}].map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)} style={{ padding: '12px 14px', borderRadius: '12px', textAlign: 'left', border: `1.5px solid ${preset === p.id ? '#D46A3A' : '#EDE8E2'}`, background: preset === p.id ? '#FDF3EE' : '#fff', marginBottom: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {p.label}
            </button>
          ))}
          {error && <div style={{ color: '#C84A2A', fontSize: '12px' }}>{error}</div>}
          <button style={{ ...btn, opacity: profileName.trim() ? 1 : 0.4 }} onClick={createProfile} disabled={loading}>
            {loading ? 'creating...' : 'continue'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#D46A3A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>step 4 of 5</div>
          <div style={title}>add channels in settings</div>
          <div style={{ fontSize: '13px', color: '#B0A090', textAlign: 'center', lineHeight: 1.6 }}>
            You can add YouTube channels from parent settings after setup.
          </div>
          <button style={btn} onClick={() => setStep(5)}>continue</button>
        </div>
      )}

      {step === 5 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <div style={title}>you're all set!</div>
            <div style={{ fontSize: '13px', color: '#B0A090', lineHeight: 1.6 }}>
              Mytube is ready for {createdProfile?.name}.<br />Add channels from parent settings.
            </div>
          </div>
          <button style={btn} onClick={() => navigate('profiles')}>open mytube</button>
        </div>
      )}
    </div>
  )
}
