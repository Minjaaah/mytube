import { useState } from 'react'

export default function PinOverlay({ onSuccess, onClose, title = 'enter parent PIN' }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleKey = (digit) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) verify(newPin)
  }

  const handleDel = () => {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  const verify = async (p) => {
    setLoading(true)
    const r = await fetch('/api/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: p })
    })
    const data = await r.json()
    if (data.valid) {
      onSuccess()
    } else {
      setError('incorrect PIN — try again')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '24px'
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '20px',
        width: '100%', maxWidth: '320px',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#F5F0EA', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: '#8A7A6E', cursor: 'pointer'
        }}>✕</button>

        <div style={{ fontSize: '13px', fontWeight: 500, color: '#8A7A6E', paddingRight: '28px' }}>
          {title}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: '13px', height: '13px', borderRadius: '50%',
              border: '1.5px solid',
              borderColor: pin.length > i ? '#D46A3A' : '#D4C8BC',
              background: pin.length > i ? '#D46A3A' : 'transparent',
              transition: 'all 0.1s'
            }} />
          ))}
        </div>

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button key={i}
              onClick={() => k === '⌫' ? handleDel() : k !== '' && handleKey(String(k))}
              disabled={loading}
              style={{
                height: '48px', borderRadius: '10px',
                background: k === '' ? 'transparent' : '#FBF7F2',
                border: k === '' ? 'none' : '0.5px solid #EDE8E2',
                fontSize: '18px', fontWeight: 500, color: '#2A2018',
                fontFamily: 'Inter, sans-serif',
                pointerEvents: k === '' ? 'none' : 'all',
                cursor: k === '' ? 'default' : 'pointer'
              }}>
              {k}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ fontSize: '12px', color: '#C84A2A', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
