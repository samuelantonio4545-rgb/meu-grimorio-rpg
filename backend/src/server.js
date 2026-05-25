import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Grimório API está operando sob os ventos da magia.' });
});

// GET: Obter todas as fichas (lista resumida para o menu)
app.get('/api/characters', (req, res) => {
  const sql = `SELECT id, name, class, level, race, updated_at FROM characters ORDER BY updated_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET: Obter uma ficha específica pelo ID (retorna o JSON completo da ficha)
app.get('/api/characters/:id', (req, res) => {
  const sql = `SELECT * FROM characters WHERE id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Ficha de personagem não encontrada.' });
    }
    // Converte a string JSON de volta em objeto antes de retornar
    try {
      const characterData = JSON.parse(row.data);
      res.json({
        ...row,
        data: characterData
      });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao processar dados internos da ficha.' });
    }
  });
});

// POST: Salvar uma nova ficha de personagem
app.post('/api/characters', (req, res) => {
  const character = req.body;
  
  if (!character.id || !character.meta || !character.meta.name) {
    return res.status(400).json({ error: 'Dados da ficha incompletos. ID e metadados com nome são obrigatórios.' });
  }

  const sql = `INSERT INTO characters (id, name, class, level, race, data) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    character.id,
    character.meta.name,
    character.meta.class,
    character.meta.level || 1,
    character.meta.race,
    JSON.stringify(character) // Serializa o objeto completo D&D
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Personagem gravado nas páginas do grimório.', id: character.id });
  });
});

// PUT: Atualizar uma ficha de personagem existente
app.put('/api/characters/:id', (req, res) => {
  const character = req.body;
  const characterId = req.params.id;

  if (!character.meta || !character.meta.name) {
    return res.status(400).json({ error: 'Dados de atualização inválidos.' });
  }

  const sql = `
    UPDATE characters 
    SET name = ?, class = ?, level = ?, race = ?, data = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  const params = [
    character.meta.name,
    character.meta.class,
    character.meta.level,
    character.meta.race,
    JSON.stringify(character),
    characterId
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado para atualização.' });
    }
    res.json({ message: 'Grimório atualizado com sucesso.', id: characterId });
  });
});

// DELETE: Excluir uma ficha de personagem
app.delete('/api/characters/:id', (req, res) => {
  const sql = `DELETE FROM characters WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado para exclusão.' });
    }
    res.json({ message: 'Ficha removida e queimada do grimório com sucesso.' });
  });
});

// Inicialização da escuta da porta do servidor Express
app.listen(PORT, () => {
  console.log(`O Grimório está aberto na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/api/health para verificar a saúde.`);
});
