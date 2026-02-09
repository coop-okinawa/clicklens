const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Initialization
// api ディレクトリ内に database.sqlite を作成
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database opening error:', err);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS urls (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    title TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    url_id TEXT,
    accessed_at TEXT,
    ip TEXT,
    country TEXT,
    FOREIGN KEY(url_id) REFERENCES urls(id)
  )`);
});

// API Endpoints

// Create short URL
app.post('/api/shorten', (req, res) => {
  const { id, original_url, short_code, title, created_at } = req.body;
  const stmt = db.prepare("INSERT INTO urls (id, original_url, short_code, title, created_at) VALUES (?, ?, ?, ?, ?)");
  stmt.run(id, original_url, short_code, title, created_at, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
  stmt.finalize();
});

// Update URL
app.put('/api/urls/:id', (req, res) => {
  const { title, original_url } = req.body;
  db.run("UPDATE urls SET title = ?, original_url = ? WHERE id = ?", [title, original_url, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete URL
app.delete('/api/urls/:id', (req, res) => {
  db.run("DELETE FROM clicks WHERE url_id = ?", [req.params.id], () => {
    db.run("DELETE FROM urls WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Get Stats for Dashboard
app.get('/api/stats', (req, res) => {
  db.all("SELECT * FROM urls ORDER BY created_at DESC", [], (err, urls) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all("SELECT clicks.*, urls.title as urlTitle FROM clicks JOIN urls ON clicks.url_id = urls.id ORDER BY accessed_at DESC", [], (err, clicks) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ urls, clicks });
    });
  });
});

// Redirect Service
app.get('/r/:code', (req, res) => {
  const code = req.params.code;
  db.get("SELECT * FROM urls WHERE short_code = ?", [code], (err, row) => {
    if (err || !row) return res.status(404).send('URL not found');

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    // 簡易的な国判別（最初のセグメントで擬似的に割り当て）
    const firstOctet = parseInt(ip.toString().split('.')[0]);
    const countries = ['Japan', 'USA', 'Germany', 'UK', 'France', 'Canada', 'Australia', 'South Korea'];
    const country = countries[isNaN(firstOctet) ? 0 : firstOctet % countries.length];

    db.run("INSERT INTO clicks (id, url_id, accessed_at, ip, country) VALUES (?, ?, ?, ?, ?)", 
      [crypto.randomUUID(), row.id, new Date().toISOString(), ip, country]
    );

    res.redirect(row.original_url);
  });
});

// --- Static File Serving (Critical for Render) ---

// ビルド後の dist フォルダを静的ファイルとして公開
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// すべてのリクエストを index.html にフォールバック（SPAルーティング対応）
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});