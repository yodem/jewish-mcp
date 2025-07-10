import { chromium } from 'playwright';
import { initDb, insertSummary, getSummaryByFilePath, insertCombinedSummary, getAllArticles } from './db/schema';
import { loginStep } from './playwright/steps/login';
import { browseJournalsStep } from './playwright/steps/browseJournals';
import { selectJournalStep } from './playwright/steps/selectJournal';
import { downloadArticlesStep } from './playwright/steps/downloadArticles';
import { summarizePdf } from './llm/summarizePdf';
import fs from 'fs';
import path from 'path';
import { projectMuseOptions } from './playwright/siteOptions';

async function main() {
  // Load user preferences
  const prefsPath = path.resolve(__dirname, './config/userPreferences.json');
  const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
  const { preferredJournals, maxArticlesPerJournal } = prefs;

  // Initialize DB
  initDb();

  // Launch browser
  const browser = await chromium.launch({ headless: false,
    args: [
      '--disable-pdf-material-ui',
      '--disable-plugins',
      '--disable-print-preview',
      '--disable-pdf-viewer',
      '--no-pdf-material-ui',
      '--disable-site-isolation-trials',
      '--disable-features=PDFViewer'
    ]
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    permissions: [],
    bypassCSP: true
  });

  // Stealth patches for all new pages
  context.on('page', async (page) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      (window as any).chrome = { runtime: {} };
      // Remove permissions patch to avoid type errors
      Object.defineProperty(window.navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      });
    });
  });

  // Also patch the first page
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    (window as any).chrome = { runtime: {} };
    // Remove permissions patch to avoid type errors
    Object.defineProperty(window.navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
  });

  // Load cookies from cookies.json
  const cookiesPath = path.resolve(__dirname, '../cookies.json');
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await context.addCookies(cookies);
    console.log('Loaded cookies from cookies.json');
  } else {
    console.warn('cookies.json not found, proceeding without cookies.');
  }

  // Select site (for now, only Project Muse)
  const site = projectMuseOptions;

  // Step 1: Login (placeholder)
  await loginStep(page);

  // Step 2: Browse journals
  const journals = await browseJournalsStep(page);

  // Step 3: For each preferred journal, select and download articles
  for (const journalName of preferredJournals) {
    const selected = selectJournalStep(journals, journalName);
    if (!selected) continue;
    // Download articles for this journal
    await downloadArticlesStep(context, selected.href, selected.name);
  }

  // After all downloads, summarize all articles and save summaries by journal, article title, and author
  const allArticles = getAllArticles();
  const allSummaries: { title: string; summary: string; markdown: string; journal: string; authors: string }[] = [];
  
  for (const article of allArticles) {
    if (getSummaryByFilePath(article.filePath)) {
      console.log(`Summary already exists for: ${article.filePath}`);
      continue;
    }
    const summaryResult = await summarizePdf(article.filePath);
    // Sanitize names for filesystem
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
    const journalFolder = path.join('summaries', sanitize(article.journal || 'Unknown_Journal'));
    if (!fs.existsSync(journalFolder)) fs.mkdirSync(journalFolder, { recursive: true });
    const authorPart = article.authors ? `_${sanitize(article.authors)}` : '';
    const fileName = `${sanitize(article.title || 'Untitled')}${authorPart}.txt`;
    const summaryPath = path.join(journalFolder, fileName);
    fs.writeFileSync(summaryPath, summaryResult.text, 'utf8');
    insertSummary({ 
      filePath: article.filePath, 
      summary: summaryResult.text, 
      markdown: summaryResult.markdown,
      createdAt: new Date().toISOString() 
    });
    console.log(`Summary for ${article.filePath} written to ${summaryPath}`);
    
    // Collect summary for final combined summary
    allSummaries.push({
      title: article.title || 'Untitled',
      summary: summaryResult.text,
      markdown: summaryResult.markdown,
      journal: article.journal || 'Unknown Journal',
      authors: article.authors || 'Unknown Authors'
    });
  }

  // Save final combined summary to DB
  if (allSummaries.length > 0) {
    const currentDate = new Date().toLocaleDateString();
    const combinedContent = allSummaries.map(s => 
      `## ${s.title}\n\n**Journal:** ${s.journal}\n**Authors:** ${s.authors}\n\n${s.markdown}\n\n---\n\n`
    ).join('\n');
    
    insertCombinedSummary({
      date: currentDate,
      content: combinedContent,
      createdAt: new Date().toISOString()
    });
    console.log(`Saved combined summary to DB with ${allSummaries.length} articles`);
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error in main:', err);
}); 