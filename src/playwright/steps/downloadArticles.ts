import { Page, BrowserContext } from 'playwright';
import { insertArticle } from '../../db/schema';
import path from 'path';

export interface DownloadedArticle {
  title: string;
  authors: string;
  filePath: string;
  journal: string;
  downloadDate: string;
}

/**
 * Downloads all article PDFs from the latest issue of a journal, stores metadata in the DB.
 */
export async function downloadArticlesStep(context: BrowserContext, journalPageUrl: string, journalName: string) {
  const page = await context.newPage();
  await page.goto(journalPageUrl);
  await page.waitForTimeout(2000);

  // Click the first div with class='volume' (latest issue)
  const volumeDiv = await page.$('div.volume a');
  if (volumeDiv) {
    await volumeDiv.click();
    await page.waitForTimeout(2000);
  } else {
    console.warn('No volume found on journal page:', journalName);
    await page.close();
    return;
  }

  // Find all PDF links in the issue page
  const articleLinks = await page.$$('a[href$="/pdf"]');
  console.log(`Found ${articleLinks.length} PDF links on issue page.`);
  let count = 0;
  for (const link of articleLinks) {
    const href = await link.getAttribute('href');
    const title = (await link.innerText()).trim();
    // For demo, authors are left blank; can be improved with more selectors
    const authors = '';
    if (href) {
      const fullHref = href.startsWith('http') ? href : `https://muse.jhu.edu${href}`;
      const pdfPage = await context.newPage();
      await pdfPage.goto(fullHref);
      await pdfPage.waitForTimeout(2000);
      try {
        const [download] = await Promise.all([
          pdfPage.waitForEvent('download'),
          pdfPage.mouse.click(1180, 25)
        ]);
        const fileName = `downloaded_${Date.now()}_${count + 1}.pdf`;
        const filePath = path.join('downloads', fileName);
        await download.saveAs(filePath);
        insertArticle({
          title,
          authors,
          journal: journalName,
          filePath,
          downloadDate: new Date().toISOString()
        });
        console.log(`Downloaded and saved: ${fileName}`);
        count++;
      } catch (err) {
        const error = err as Error;
        console.warn('Download failed for article:', title, error.message);
      }
      await pdfPage.close();
    }
  }
  await page.close();
} 