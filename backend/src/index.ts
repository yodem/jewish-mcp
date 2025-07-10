import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../downloads/articles.db');
const db = new Database(dbPath);

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Jewish MCP Backend API')
  
  // Get all articles
  .get('/api/articles', () => {
    const stmt = db.prepare('SELECT * FROM articles ORDER BY downloadDate DESC');
    return stmt.all();
  })
  
  // Get all summaries
  .get('/api/summaries', () => {
    const stmt = db.prepare('SELECT * FROM summaries ORDER BY createdAt DESC');
    return stmt.all();
  })
  
  // Get combined summaries
  .get('/api/combined-summaries', () => {
    const stmt = db.prepare('SELECT * FROM combined_summaries ORDER BY createdAt DESC');
    return stmt.all();
  })
  
  // Get summary by filePath
  .get('/api/summaries/:filePath', ({ params: { filePath } }) => {
    const stmt = db.prepare('SELECT * FROM summaries WHERE filePath = ?');
    const summary = stmt.get(filePath);
    if (!summary) {
      throw new Error('Summary not found');
    }
    return summary;
  })
  
  // Get article by filePath
  .get('/api/articles/:filePath', ({ params: { filePath } }) => {
    const stmt = db.prepare('SELECT * FROM articles WHERE filePath = ?');
    const article = stmt.get(filePath);
    if (!article) {
      throw new Error('Article not found');
    }
    return article;
  })
  
  // Get latest combined summary
  .get('/api/latest-summary', () => {
    const stmt = db.prepare('SELECT * FROM combined_summaries ORDER BY createdAt DESC LIMIT 1');
    const summary = stmt.get();
    if (!summary) {
      throw new Error('No combined summary found');
    }
    return summary;
  })
  
  .listen(3001);

console.log(`🦊 Jewish MCP Backend is running at ${app.server?.hostname}:${app.server?.port}`); 