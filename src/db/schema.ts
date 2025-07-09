import Database from 'better-sqlite3';
import path from 'path';

export interface Article {
  id?: number;
  title: string;
  authors: string;
  journal: string;
  filePath: string;
  downloadDate: string;
}

const dbPath = path.resolve(__dirname, '../../downloads/articles.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      authors TEXT,
      journal TEXT,
      filePath TEXT NOT NULL,
      downloadDate TEXT NOT NULL
    )
  `);
}

export function insertArticle(article: Article) {
  const stmt = db.prepare(`
    INSERT INTO articles (title, authors, journal, filePath, downloadDate)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(article.title, article.authors, article.journal, article.filePath, article.downloadDate);
}

export default db; 