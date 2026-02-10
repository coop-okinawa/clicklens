import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import geoip from 'geoip-lite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(cors());
app.use(bodyParser.json());

/* -------------------------------------------------------
   API Endpoints
------------------------------------------------------- */

// Create short URL
app.post('/api/shorten', async (req, res) => {
  const { id, original_url, short_code, title, created_at } = req.body;

  const { error } = await supabase
    .from('urls')
    .insert({ id, original_url, short_code, title, created_at });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// Update URL Title
app.put('/api/urls/:id', async (req, res) => {
  const { title, original_url } = req.body;

  const { error } = await supabase
    .from('urls')
    .update({ title, original_url })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// Delete URL
app.delete('/api/urls/:id', async (req, res) => {
  const urlId = req.params.id;

  await supabase.from('clicks').delete().eq('url_id', urlId);

  const { error } = await supabase.from('urls').delete().eq('id', urlId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// Get Stats and Dashboard data
app.get('/api/stats', async (req, res) => {
  const { data: urls, error: e1 } = await supabase
    .from('urls')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: clicks, error: e2 } = await supabase
    .from('clicks')
    .select(`
      id,
      ip,
      country,
      accessed_at,
      url_id,
      urls ( title )
    `)
    .order('accessed_at', { ascending: false });

  if (e1 || e2)
    return res.status(500).json({ error: e1?.message || e2?.message });

  res.json({ urls, clicks });
});

/* -------------------------------------------------------
   Redirect short URL (CLICK TRACKING)
------------------------------------------------------- */
app.get('/r/:code', async (req, res) => {
  const code = req.params.code;

  const { data: rows, error } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', code)
    .limit(1);

  if (error || !rows || rows.length === 0)
    return res.status(404).send('URL not found');

  const row = rows[0];

  // 正しいクライアントIPの取得（Cloudflare対応）
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = forwarded ? forwarded.split(",")[0].trim() : req.ip;

  // 国判定
  const geo = geoip.lookup(realIp);
  const country = geo ? geo.country : "Unknown";

  await supabase.from('clicks').insert({
    id: crypto.randomUUID(),
    url_id: row.id,
    accessed_at: new Date().toISOString(),
    ip: realIp,
    country
  });

  res.redirect(row.original_url);
});

/* -------------------------------------------------------
   Static Files (React Build)
------------------------------------------------------- */
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
