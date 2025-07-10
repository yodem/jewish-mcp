import Database from 'better-sqlite3';
import path from 'path';

export interface Article {
  id?: number;
  title: string;
  authors: string;
  journal: string;
  filePath: string;
  downloadDate: string;
  year?: string;
  volume?: string;
  issue?: string;
  journalIssue?: string;
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
      downloadDate TEXT NOT NULL,
      year TEXT,
      volume TEXT,
      issue TEXT,
      journalIssue TEXT
    )
  `);
}

export function insertArticle(article: Article) {
  const stmt = db.prepare(`
    INSERT INTO articles (title, authors, journal, filePath, downloadDate, year, volume, issue, journalIssue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    article.title,
    article.authors,
    article.journal,
    article.filePath,
    article.downloadDate,
    article.year,
    article.volume,
    article.issue,
    article.journalIssue
  );
}

export function getAllArticles(): Article[] {
  const stmt = db.prepare('SELECT * FROM articles');
  return stmt.all() as Article[];
}

export function getArticleByFilePath(filePath: string): Article | undefined {
  const stmt = db.prepare('SELECT * FROM articles WHERE filePath = ?');
  return stmt.get(filePath) as Article | undefined;
}

export function articleExists(filePath: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM articles WHERE filePath = ?');
  return !!stmt.get(filePath);
}

// Summaries table
export interface Summary {
  id?: number;
  filePath: string;
  summary: string;
  createdAt: string;
  markdown?: string;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filePath TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    markdown TEXT,
    createdAt TEXT NOT NULL
  )
`);

export function insertSummary(summary: Summary) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO summaries (filePath, summary, markdown, createdAt)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(summary.filePath, summary.summary, summary.markdown, summary.createdAt);
}

export function getSummaryByFilePath(filePath: string): Summary | undefined {
  const stmt = db.prepare('SELECT * FROM summaries WHERE filePath = ?');
  return stmt.get(filePath) as Summary | undefined;
}

// Combined summaries table
export interface CombinedSummary {
  id?: number;
  date: string;
  content: string;
  createdAt: string;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS combined_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

export function insertCombinedSummary(summary: CombinedSummary) {
  const stmt = db.prepare(`
    INSERT INTO combined_summaries (date, content, createdAt)
    VALUES (?, ?, ?)
  `);
  stmt.run(summary.date, summary.content, summary.createdAt);
}

export function getCombinedSummaries(): CombinedSummary[] {
  const stmt = db.prepare('SELECT * FROM combined_summaries ORDER BY createdAt DESC');
  return stmt.all() as CombinedSummary[];
}

export function getAllSummaries(): Summary[] {
  const stmt = db.prepare('SELECT * FROM summaries ORDER BY createdAt DESC');
  return stmt.all() as Summary[];
}

export default db; 