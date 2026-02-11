import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Supabase クライアント
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -----------------------------
// /api/shorten
// -----------------------------
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl, title } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' });
    }

    const shortCode = Math.random().toString(36).substring(2, 8);

    const { error } = await supabase
      .from('urls')
      .insert([
        {
          original_url: originalUrl,
          short_code: shortCode,
          title
        }
      ]);

    if (error) throw error;

    res.json({ shortCode });
  } catch (e) {
    console.error('shorten error:', e);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

// -----------------------------
// /api/stats
// -----------------------------
app.get('/api/stats', async (req, res) => {
  try {
    const { data: urls, error: urlErr } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false });

    if (urlErr) throw urlErr;

    const { data: clicks, error: clickErr } = await supabase
      .from('clicks')
      .select('*, urls(id, title, short_code, original_url)')
      .order('accessed_at', { ascending: false });

    if (clickErr) throw clickErr;

    const dailyMap = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }

    clicks.forEach(c => {
      const date = c.accessed_at?.split('T')[0];
      if (dailyMap[date] !== undefined) {
        dailyMap[date]++;
      }
    });

    const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({
      date: date.substring(5),
      count
    }));

    const countryMap = {};
    clicks.forEach(c => {
      const country = c.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;
    });

    const countryStats = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const recentClicks = [...clicks]
      .sort((a, b) => new Date(b.accessed_at) - new Date(a.accessed_at))
      .slice(0, 10);

    res.json({
      urls,
      stats: {
        totalClicks: clicks.length,
        uniqueUrls: urls.length,
        dailyClicks,
        countryStats,
        recentClicks,
        clicks
      }
    });
  } catch (e) {
    console.error('stats error:', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// -----------------------------
// URL 削除
// -----------------------------
app.delete('/api/urls/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (e) {
    console.error('delete error:', e);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
});

// -----------------------------
// 短縮URLリダイレクト（/r/:shortCode）
// -----------------------------
app.get('/r/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  const { data, error } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error || !data) return next();

  await supabase.from('clicks').insert([
    {
      url_id: data.id,
      accessed_at: new Date().toISOString(),
      country: req.headers['cf-ipcountry'] || 'Unknown',
      ip: req.ip
    }
  ]);

  res.redirect(data.original_url);
});

// -----------------------------
// 静的ファイル
// -----------------------------
app.use(express.static(path.join(__dirname, 'dist')));

// -----------------------------
// API と /r/ を除外してフロントへ
// -----------------------------
app.get(/^\/(?!api|r).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// -----------------------------
// サーバー起動
// -----------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
