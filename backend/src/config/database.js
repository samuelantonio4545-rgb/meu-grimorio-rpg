import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Armazena o banco de dados na raiz da pasta backend do projeto
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Falha ao conectar no SQLite:', err.message);
  } else {
    console.log('Conectado com sucesso ao banco de dados SQLite.');
  }
});

// Inicialização da Tabela de Fichas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      race TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela "characters":', err.message);
    } else {
      console.log('Tabela "characters" verificada/criada com sucesso.');
    }
  });
});

export default db;
