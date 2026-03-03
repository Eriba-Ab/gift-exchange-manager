import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve('gift-exchange.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrent performance
db.exec('PRAGMA journal_mode=WAL');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    recipient_id INTEGER,
    FOREIGN KEY(recipient_id) REFERENCES participants(id)
  )
`);

export default db;
