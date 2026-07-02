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
