import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mytube-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

// Serve React frontend
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (error) return res.status(400).json({ error: error.message });

  // admin.createUser does not establish a session — sign in immediately,
  // same as the /api/auth/signin route does, so req.session.user is set.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return res.status(400).json({ error: signInError.message });

  req.session.user = signInData.user;
  req.session.access_token = signInData.session.access_token;
  res.json({ user: signInData.user });
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  req.session.user = data.user;
  req.session.access_token = data.session.access_token;
  res.json({ user: data.user });
});

app.post('/api/auth/signout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.session.user });
});

// Middleware to require auth
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// PIN routes
app.post('/api/pin/setup', requireAuth, async (req, res) => {
  const { pin } = req.body;
  const userId = req.session.user.id;
  const bcrypt = await import('bcryptjs');
  const pinHash = await bcrypt.default.hash(pin, 10);
  const { error } = await supabase
    .from('parent_pins')
    .upsert({ user_id: userId, pin_hash: pinHash }, { onConflict: 'user_id' });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/pin/verify', requireAuth, async (req, res) => {
  const { pin } = req.body;
  const userId = req.session.user.id;
  const { data, error } = await supabase
    .from('parent_pins')
    .select('pin_hash')
    .eq('user_id', userId)
    .single();
  if (error || !data) return res.json({ valid: false });
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.default.compare(pin, data.pin_hash);
  res.json({ valid });
});

// Profile routes
app.get('/api/profiles', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', req.session.user.id)
    .order('created_at');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/profiles', requireAuth, async (req, res) => {
  const { name, avatar, preset } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: req.session.user.id, name, avatar, preset })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/profiles/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.session.user.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/profiles/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.session.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// Sources (channels/playlists) routes
app.get('/api/profiles/:profileId/sources', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('profile_id', req.params.profileId)
    .eq('status', 'active')
    .order('display_order');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/profiles/:profileId/sources', requireAuth, async (req, res) => {
  const { youtube_id, type, name, thumbnail_url } = req.body;
  const { data: existing } = await supabase
    .from('sources')
    .select('id')
    .eq('profile_id', req.params.profileId)
    .eq('status', 'active')
    .order('display_order', { ascending: false })
    .limit(1);
  const display_order = existing?.length ? existing[0].display_order + 1 : 0;
  const { data, error } = await supabase
    .from('sources')
    .insert({ profile_id: req.params.profileId, youtube_id, type, name, thumbnail_url, display_order })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/profiles/:profileId/sources/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('sources')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('profile_id', req.params.profileId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/profiles/:profileId/sources/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('sources')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('profile_id', req.params.profileId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});
// Videos (cached) routes
app.get('/api/profiles/:profileId/videos', requireAuth, async (req, res) => {
  const { data: sources } = await supabase
    .from('sources')
    .select('id')
    .eq('profile_id', req.params.profileId)
    .eq('status', 'active');
  if (!sources?.length) return res.json([]);
  const sourceIds = sources.map(s => s.id);
  const { data, error } = await supabase
    .from('videos')
    .select('*, sources(name, thumbnail_url, weight)')
    .in('source_id', sourceIds)
    .order('cached_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/youtube/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(q)}&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.post('/api/youtube/fetch', requireAuth, async (req, res) => {
  const { source_id, youtube_id, type } = req.body;
  const apiKey = process.env.YOUTUBE_API_KEY;
  let videos = [];
  if (type === 'channel') {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${youtube_id}&type=video&maxResults=50&order=date&key=${apiKey}`);
    const d = await r.json();
    videos = (d.items || []).map(item => ({ source_id, youtube_video_id: item.id.videoId, title: item.snippet.title, thumbnail_url: item.snippet.thumbnails.medium.url, channel_name: item.snippet.channelTitle, cached_at: new Date().toISOString() }));
  } else {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${youtube_id}&maxResults=50&key=${apiKey}`);
    const d = await r.json();
    videos = (d.items || []).map(item => ({ source_id, youtube_video_id: item.snippet.resourceId.videoId, title: item.snippet.title, thumbnail_url: item.snippet.thumbnails.medium.url, channel_name: item.snippet.channelTitle, cached_at: new Date().toISOString() }));
  }
  if (videos.length) {
    await supabase.from('videos').delete().eq('source_id', source_id);
    await supabase.from('videos').insert(videos);
    await supabase.from('sources').update({ last_upload_at: new Date().toISOString() }).eq('id', source_id);
  }
  res.json({ count: videos.length });
});

app.post('/api/viewing', requireAuth, async (req, res) => {
  const { profile_id, youtube_video_id, channel_name, source_id } = req.body;
  const { data, error } = await supabase.from('viewing_events').insert({ profile_id, youtube_video_id, channel_name, source_id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/viewing/:id/heartbeat', requireAuth, async (req, res) => {
  const { total_seconds_watched } = req.body;
  const { error } = await supabase.from('viewing_events').update({ last_heartbeat_at: new Date().toISOString(), total_seconds_watched }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/profiles/:profileId/resume', requireAuth, async (req, res) => {
  const { data } = await supabase.from('resume_state').select('*').eq('profile_id', req.params.profileId).single();
  res.json(data || null);
});

app.post('/api/profiles/:profileId/resume', requireAuth, async (req, res) => {
  const { youtube_video_id, video_title, thumbnail_url, timestamp_seconds } = req.body;
  const { error } = await supabase.from('resume_state').upsert({ profile_id: req.params.profileId, youtube_video_id, video_title, thumbnail_url, timestamp_seconds, updated_at: new Date().toISOString() }, { onConflict: 'profile_id' });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/profiles/:profileId/stats', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('viewing_events').select('source_id, channel_name, total_seconds_watched, started_at').eq('profile_id', req.params.profileId).order('started_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mytube server running on port ${PORT}`);
});
