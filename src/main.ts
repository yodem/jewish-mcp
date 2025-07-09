import { chromium } from 'playwright';
import { initDb } from './db/schema';
import { loginStep } from './playwright/steps/login';
import { browseJournalsStep } from './playwright/steps/browseJournals';
import { selectJournalStep } from './playwright/steps/selectJournal';
import { downloadArticlesStep } from './playwright/steps/downloadArticles';
import { geminiSummarize } from './llm/geminiSummarize';
import fs from 'fs';
import path from 'path';

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
    // For demo, summarize the first downloaded article (mock: just pick one from downloads folder)
    const downloadsDir = path.resolve(__dirname, '../downloads');
    const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.pdf'));
    if (files.length > 0) {
      const filePath = path.join(downloadsDir, files[0]);
      // In real use, extract text from PDF, then summarize
      const fakeText = `Contents of ${filePath}`;
      const summary = await geminiSummarize(fakeText);
      console.log(`Summary for ${filePath}:\n${summary}`);
    }
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error in main:', err);
}); 