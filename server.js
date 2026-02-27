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
// URL短縮
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
// URL一覧（合算アクセス数付き）
// -----------------------------
app.get('/api/urls-with-clicks', async (req, res) => {
  try {
    const { data: urls, error: urlErr } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false });

    if (urlErr) throw urlErr;

    const { data: clicks, error: clickErr } = await supabase
      .from('clicks')
      .select('*');

    if (clickErr) throw clickErr;

    const result = urls.map(url => {
      const total = clicks.filter(c => c.url_id === url.id).length;
      return {
        ...url,
        totalClicks: total
      };
    });

    res.json(result);
  } catch (e) {
    console.error('urls-with-clicks error:', e);
    res.status(500).json({ error: 'Failed to load URLs' });
  }
});

// -----------------------------
// shortCode → URL情報
// -----------------------------
app.get('/api/url-by-short/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  const { data, error } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(data);
});

// -----------------------------
// URL のクリックログ（全期間）
// -----------------------------
app.get('/api/logs/:urlId', async (req, res) => {
  const { urlId } = req.params;

  const { data, error } = await supabase
    .from('clicks')
    .select('*')
    .eq('url_id', urlId)
    .order('accessed_at', { ascending: false });

  if (error) {
    console.error('logs error:', error);
    return res.status(500).json({ error: 'Failed to load logs' });
  }

  res.json(data);
});

// -----------------------------
// URL削除
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
// 短縮URLリダイレクト（クリック記録）
// -----------------------------
app.get('/r/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  const { data, error } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error || !data) {
    return next();
  }

  const { error: insertErr } = await supabase.from('clicks').insert([
    {
      url_id: data.id,
      short_code: data.short_code,
      accessed_at: new Date().toISOString(),
      country: req.headers['cf-ipcountry'] || 'Unknown',
      ip: req.headers['x-forwarded-for'] || req.ip || '0.0.0.0',
      user_agent: req.headers['user-agent'] || 'Unknown'
    }
  ]);

  if (insertErr) {
    console.error('INSERT ERROR:', insertErr);
  }

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
