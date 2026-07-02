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
