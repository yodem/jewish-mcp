import { BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

export interface DownloadOptions {
  url: string;
  folderPath: string;
  fileName: string;
  clickSelector?: string;
  clickPosition?: { x: number; y: number };
  waitForDownloadSelector?: string;
}

export async function downloadPdfWithPlaywright(context: BrowserContext, options: DownloadOptions): Promise<string> {
  const page = await context.newPage();
  await page.goto(options.url);
  await page.waitForTimeout(2000);

  // Ensure folder exists
  fs.mkdirSync(options.folderPath, { recursive: true });
  const filePath = path.join(options.folderPath, options.fileName);

  let download;
  if (options.clickSelector) {
    download = await Promise.all([
      page.waitForEvent('download'),
      page.click(options.clickSelector)
    ]).then(([d]) => d);
  } else if (options.clickPosition) {
    download = await Promise.all([
      page.waitForEvent('download'),
      page.mouse.click(options.clickPosition.x, options.clickPosition.y)
    ]).then(([d]) => d);
  } else if (options.waitForDownloadSelector) {
    download = await Promise.all([
      page.waitForEvent('download'),
      page.waitForSelector(options.waitForDownloadSelector)
    ]).then(([d]) => d);
  } else {
    throw new Error('No download trigger specified');
  }

  await download.saveAs(filePath);
  await page.close();
  return filePath;
} 