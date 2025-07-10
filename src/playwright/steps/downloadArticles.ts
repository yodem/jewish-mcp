import { Page, BrowserContext } from 'playwright';
import { insertArticle, articleExists } from '../../db/schema';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { downloadPdfWithPlaywright } from '../../utils/playwrightDownload';
import { projectMuseOptions } from '../siteOptions';

export interface DownloadedArticle {
  title: string;
  authors: string;
  filePath: string;
  journal: string;
  downloadDate: string;
}

/**
 * Utility to sanitize folder/file names for filesystem safety
 */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
}

/**
 * Downloads all article PDFs from the latest issue of a journal, stores metadata in the DB.
 */
export async function downloadArticlesStep(context: BrowserContext, journalPageUrl: string, journalName: string) {
  const page = await context.newPage();
  await page.goto(journalPageUrl);
  await page.waitForTimeout(2000);

  // Extract the real journal name from the .title class (if present)
  const realJournalName = (await page.$eval(projectMuseOptions.selectors.title, el => el.textContent?.trim() || journalName)).trim();
  const sanitizedJournal = sanitizeName(realJournalName);

  // Extract volume/year/month from the first .volume div (before clicking)
  const volumeDiv = await page.$(projectMuseOptions.selectors.volume);
  let volumeText = '';
  let year = 'unknown_year';
  let volume = 'unknown_volume';
  let month = 'unknown_month';
  if (volumeDiv) {
    volumeText = (await volumeDiv.textContent())?.trim() || '';
    const yearMatch = volumeText.match(/(19|20)\d{2}/);
    if (yearMatch) year = yearMatch[0];
    const volumeMatch = volumeText.match(/Volume\s+(\d+)/i);
    if (volumeMatch) volume = volumeMatch[1];
    const monthMatch = volumeText.match(/(Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December)/i);
    if (monthMatch) month = monthMatch[0];
    const volumeLink = await volumeDiv.$('a');
    if (volumeLink) {
      await volumeLink.click();
      await page.waitForTimeout(2000);
    } else {
      console.warn('No volume link found on journal page:', realJournalName);
      await page.close();
      return;
    }
  } else {
    console.warn('No volume found on journal page:', realJournalName);
    await page.close();
    return;
  }

  // Find all PDF links in the issue page
  const articleLinks = await page.$$(projectMuseOptions.selectors.pdfLink);
  console.log(`Found ${articleLinks.length} PDF links on issue page.`);
  let count = 0;
  for (const link of articleLinks) {
    const href = await link.getAttribute('href');
    const title = (await link.innerText()).trim();
    const authors = '';
    if (href) {
      const fullHref = href.startsWith('http') ? href : `https://muse.jhu.edu${href}`;
      const folderPath = path.join('downloads', sanitizedJournal, year, `volume_${volume}`, month);
      const fileName = `downloaded_${Date.now()}_${count + 1}.pdf`;
      const filePath = path.join(folderPath, fileName);
      if (articleExists(filePath)) {
        console.log(`Article already exists in DB, skipping download: ${filePath}`);
        continue;
      }
      try {
        const savedFilePath = await downloadPdfWithPlaywright(context, {
          url: fullHref,
          folderPath,
          fileName,
          clickPosition: { x: 1180, y: 25 },
        });
        const meta = await extractPdfMetadata(savedFilePath);
        insertArticle({
          title: meta.title || title,
          authors: meta.authors || authors,
          journal: realJournalName,
          filePath: savedFilePath,
          downloadDate: new Date().toISOString(),
          year: meta.year,
          volume: meta.volume,
          issue: meta.issue,
          journalIssue: meta.journalIssue
        });
        console.log(`Downloaded and saved: ${savedFilePath}`);
        count++;
      } catch (err) {
        const error = err as Error;
        console.warn('Download failed for article:', title, error.message);
      }
    }
  }
  await page.close();
}

// Helper to extract and parse the first page of a PDF for metadata
async function extractPdfMetadata(pdfPath: string) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer, { max: 1 });
  const firstPage = data.text.split('\f')[0] || data.text;
  // Simple heuristics: first non-empty line is title, next is authors, look for year/volume/issue
  const lines = firstPage.split('\n').map(l => l.trim()).filter(Boolean);
  let title = lines[0] || '';
  let authors = lines[1] || '';
  let year = '';
  let volume = '';
  let issue = '';
  let journalIssue = '';
  for (const line of lines) {
    if (!year) {
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch) year = yearMatch[0];
    }
    if (!volume) {
      const volumeMatch = line.match(/Volume\s*(\d+)/i);
      if (volumeMatch) volume = volumeMatch[1];
    }
    if (!issue) {
      const issueMatch = line.match(/Issue\s*(\d+)/i);
      if (issueMatch) issue = issueMatch[1];
    }
    if (!journalIssue) {
      const jiMatch = line.match(/No\.?\s*(\d+)/i);
      if (jiMatch) journalIssue = jiMatch[1];
    }
  }
  return { title, authors, year, volume, issue, journalIssue };
} 