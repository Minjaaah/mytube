import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp({ navigate }) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      await signUp(email, password)
      navigate('onboarding')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      display: 'flex', flexDirection: 'column',
      padding: '52px 28px 40px', maxWidth: '390px', margin: '0 auto'
    }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '40px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i === 1 ? '#D46A3A' : '#EDE8E2' }} />
        ))}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#D46A3A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>step 1 of 5</div>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#1A1A1A', letterSpacing: '-0.5px', marginBottom: '6px' }}>create your account</div>
        <div style={{ fontSize: '13px', color: '#B0A090', lineHeight: 1.5 }}>Your details keep your settings safe across devices.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        <div>
          <div style={labelStyle}>email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="at least 8 characters" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>confirm password</div>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="same again" onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
        </div>
        {error && <div style={{ fontSize: '12px', color: '#C84A2A' }}>{error}</div>}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
          {loading ? 'creating account...' : 'continue'}
        </button>
        <button onClick={() => navigate('signin')} style={{ fontSize: '12px', color: '#B0A090', background: 'none', border: 'none', fontFamily: 'Inter, sans-serif' }}>
          already have an account? <span style={{ color: '#D46A3A' }}>sign in</span>
        </button>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: '12px', fontWeight: 500, color: '#8A7A6E', marginBottom: '6px' }
const inputStyle = {
  width: '100%', padding: '14px 16px',
  borderRadius: '12px', border: '0.5px solid #EDE8E2',
  background: '#FBF7F2', fontSize: '14px', color: '#1A1A1A', outline: 'none'
}
const primaryBtn = {
  width: '100%', padding: '16px',
  background: '#D46A3A', border: 'none',
  borderRadius: '14px', fontSize: '15px',
  fontWeight: 500, color: '#fff',
  fontFamily: 'Inter, sans-serif'
}
