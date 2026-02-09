const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Render が割り当てるポートを使う
const PORT = process.env.PORT || 3000;

// DB ファイル（api/database.sqlite）
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// テーブル作成
db.run(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    url TEXT,
    clicks INTEGER DEFAULT 0
  )
`);

app.use(express.json());

// dist（ルートの dist）を静的配信
app.use(express.static(path.join(__dirname, '..', 'dist')));

// API: 短縮URL作成
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;
  const code = Math.random().toString(36).substring(2, 8);

  db.run(
    'INSERT INTO links (code, url) VALUES (?, ?)',
    [code, url],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ code });
    }
  );
});

// リダイレクト
app.get('/r/:code', (req, res) => {
  const { code } = req.params;

  db.get(`SELECT url, clicks FROM links WHERE code = ?`, [code], (err, row) => {
    if (!row) return res.status(404).send('Not found');

    db.run(`UPDATE links SET clicks = clicks + 1 WHERE code = ?`, [code]);

    res.redirect(row.url);
  });
});

// API: stats
app.get('/api/stats', (req, res) => {
  db.all(`SELECT * FROM links ORDER BY id DESC`, [], (err, rows) => {
    res.json(rows);
  });
});

// React のルーティング対応（dist/index.html を返す）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
