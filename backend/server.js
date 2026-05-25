const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;
const DND_API = 'https://www.dnd5eapi.co/api';
const OPEN5E_API = 'https://api.open5e.com/v1';

app.use(cors());
app.use(express.json());

// Banco de dados
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS homebrew (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, name TEXT, data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ── CLASSES ──
app.get('/api/classes', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/classes`);
  res.json(data);
});
app.get('/api/classes/:index', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/classes/${req.params.index}`);
  res.json(data);
});

// ── RAÇAS ──
app.get('/api/races', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/races`);
  res.json(data);
});
app.get('/api/races/:index', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/races/${req.params.index}`);
  res.json(data);
});

// ── FEITIÇOS ──
app.get('/api/spells', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/spells`);
  res.json(data);
});
app.get('/api/spells/:index', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/spells/${req.params.index}`);
  res.json(data);
});

// ── MONSTROS ──
app.get('/api/monsters', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/monsters`);
  res.json(data);
});
app.get('/api/monsters/:index', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/monsters/${req.params.index}`);
  res.json(data);
});

// ── EQUIPAMENTOS ──
app.get('/api/equipment', async (req, res) => {
  const { data } = await axios.get(`${DND_API}/equipment`);
  res.json(data);
});

// ── XANATHAR + TASHA (Open5e) ──
app.get('/api/xanathar/spells', async (req, res) => {
  const { data } = await axios.get(`${OPEN5E_API}/spells/?document__slug=xge&limit=500`);
  res.json(data);
});
app.get('/api/tasha/spells', async (req, res) => {
  const { data } = await axios.get(`${OPEN5E_API}/spells/?document__slug=tce&limit=500`);
  res.json(data);
});
app.get('/api/xanathar/monsters', async (req, res) => {
  const { data } = await axios.get(`${OPEN5E_API}/monsters/?document__slug=xge&limit=500`);
  res.json(data);
});

// ── PERSONAGENS (banco local) ──
app.get('/api/characters', (req, res) => {
  db.all('SELECT * FROM characters', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data) })));
  });
});
app.post('/api/characters', (req, res) => {
  const { name, data } = req.body;
  db.run('INSERT INTO characters (name, data) VALUES (?, ?)', [name, JSON.stringify(data)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});
app.put('/api/characters/:id', (req, res) => {
  const { name, data } = req.body;
  db.run('UPDATE characters SET name=?, data=? WHERE id=?', [name, JSON.stringify(data), req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});
app.delete('/api/characters/:id', (req, res) => {
  db.run('DELETE FROM characters WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ── HOMEBREW ──
app.get('/api/homebrew', (req, res) => {
  db.all('SELECT * FROM homebrew', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data) })));
  });
});
app.post('/api/homebrew', (req, res) => {
  const { type, name, data } = req.body;
  db.run('INSERT INTO homebrew (type, name, data) VALUES (?, ?, ?)', [type, name, JSON.stringify(data)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});
app.delete('/api/homebrew/:id', (req, res) => {
  db.run('DELETE FROM homebrew WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Grimório rodando na porta ${PORT}`));
cat >> server.js << 'EOF'

// ── CONTEÚDO EM PORTUGUÊS (Brasil) ──
app.get('/api/pt/classes', async (req, res) => {
  const { data } = await axios.get('https://api.open5e.com/v1/classes/?format=json&limit=50');
  res.json(data);
});

app.get('/api/pt/racas', async (req, res) => {
  const { data } = await axios.get('https://api.open5e.com/v1/races/?format=json&limit=50');
  res.json(data);
});
EOF
