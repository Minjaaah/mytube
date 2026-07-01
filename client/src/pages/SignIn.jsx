import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SignIn({ navigate }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('profiles')
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
      alignItems: 'center', justifyContent: 'space-between',
      padding: '72px 32px 52px', maxWidth: '390px', margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="nunito" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '8px' }}>
          my<span style={{ color: '#D46A3A' }}>tube</span>
        </div>
        <div style={{ fontSize: '14px', color: '#B0A090' }}>welcome back</div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#8A7A6E', marginBottom: '6px' }}>email</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#8A7A6E', marginBottom: '6px' }}>password</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="your password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
        </div>
        {error && <div style={{ fontSize: '12px', color: '#C84A2A' }}>{error}</div>}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
          {loading ? 'signing in...' : 'sign in'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#EDE8E2' }} />
          <span style={{ fontSize: '11px', color: '#C4B8AC' }}>new to mytube?</span>
          <div style={{ flex: 1, height: '0.5px', background: '#EDE8E2' }} />
        </div>
        <button onClick={() => navigate('signup')} style={secondaryBtn}>
          create an account
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  borderRadius: '12px', border: '0.5px solid #EDE8E2',
  background: '#FBF7F2', fontSize: '14px', color: '#1A1A1A',
  outline: 'none'
}

const primaryBtn = {
  width: '100%', padding: '16px',
  background: '#D46A3A', border: 'none',
  borderRadius: '14px', fontSize: '15px',
  fontWeight: 500, color: '#fff',
  fontFamily: 'Inter, sans-serif'
}

const secondaryBtn = {
  width: '100%', padding: '15px',
  background: 'transparent', border: '0.5px solid #EDE8E2',
  borderRadius: '14px', fontSize: '14px',
  fontWeight: 500, color: '#8A7A6E',
  fontFamily: 'Inter, sans-serif'
}
