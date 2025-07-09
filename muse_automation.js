const { chromium } = require('playwright');
// Removed: const { addStealth } = require('playwright-stealth');
const fs = require('fs');
const crypto = require('crypto');

// Helper for random delays
function randomDelay(min = 300, max = 1200) {
  return new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min));
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    permissions: [],
    bypassCSP: true,
    // Launch with args to disable PDF viewer
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
  const page = await context.newPage();

  // Manual stealth patches
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    window.chrome = { runtime: {} };
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    Object.defineProperty(window.navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
  });

  // Load cookies from cookies.json
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await context.addCookies(cookies);

  console.log('Step 1: Go to homepage');
  await page.goto('https://muse.jhu.edu/');
  await randomDelay();

  console.log('Step 2: Click on <span class="small">browse</span>');
  await page.waitForSelector('span.small:text("browse")', { timeout: 10000 });
  const browse = await page.$('span.small:text("browse")');
  await browse.hover();
  await randomDelay();
  await browse.click();
  await randomDelay();

  console.log('Step 3: Click on view more journals');
  await page.waitForSelector('a[href^="/search?action=browse"][href*="format:journal"]', { timeout: 10000 });
  const moreJournals = await page.$('a[href^="/search?action=browse"][href*="format:journal"]');
  await moreJournals.hover();
  await randomDelay();
  await moreJournals.click();
  await randomDelay();

  // Take a screenshot for debugging
  await page.screenshot({ path: 'after_step3.png' });
  console.log('Screenshot taken after Step 3 (after_step3.png)');

  // Log all input elements and their IDs
  const inputHandles = await page.$$('input');
  for (const handle of inputHandles) {
    const id = await handle.getAttribute('id');
    console.log('Found input with id:', id);
  }

  // Try to click the input with id 'search_filter_journal_input'
  console.log('Step 3.5: Click on the input with id search_filter_journal_input');
  try {
    await page.waitForSelector('input#search_filter_journal_input', { timeout: 10000 });
    const input = await page.$('input#search_filter_journal_input');
    await input.hover();
    await randomDelay();
    await input.click();
    await randomDelay();
    console.log('Step 3.5: Successfully clicked input field');
  } catch (err) {
    console.error('Step 3.5: Failed to find or click input field', err);
    await page.screenshot({ path: 'step3.5_input_error.png' });
    await browser.close();
    return;
  }

  console.log('Step 7: Type "jewish"');
  await page.focus('input#search_filter_journal_input');
  await randomDelay();
  for (const char of 'jewish') {
    await page.type('input#search_filter_journal_input', char);
    await randomDelay(80, 220);
  }
  await randomDelay(800, 1500); // Wait for filter results to update

  console.log('Step 8: Click on the label for Jewish Quarterly Review');
  await page.waitForSelector('label.input_label[for^="journal_facet_"]:text("Jewish Quarterly Review")', { timeout: 10000 });
  const label = await page.$('label.input_label[for^="journal_facet_"]:text("Jewish Quarterly Review")');
  await label.hover();
  await randomDelay();
  await label.click();
  await randomDelay();

  console.log('Step 9: Click on the link to Jewish Quarterly Review');
  await page.waitForSelector('a[href="/pub/56/journal/292"]', { timeout: 10000 });
  const journalLink = await page.$('a[href="/pub/56/journal/292"]');
  await journalLink.hover();
  await randomDelay();
  await journalLink.click();
  await randomDelay();

  // Step 10: Click on the first volume link inside available_issues_list_text
  await page.waitForSelector('#available_issues_list_text .vol_group .volume span a', { timeout: 10000 });
  const firstVolumeLink = await page.$('#available_issues_list_text .vol_group .volume span a');
  if (firstVolumeLink) {
    await firstVolumeLink.hover();
    await randomDelay();
    await firstVolumeLink.click();
    await randomDelay();
    console.log('Step 10: Successfully clicked the first volume link');
  } else {
    console.error('Step 10: Could not find the first volume link');
    await page.screenshot({ path: 'step10_volume_error.png' });
    await browser.close();
    return;
  }

  await randomDelay(1200, 2000); // Wait for filter results to update

  console.log('Step 11: Download all article PDFs directly using download attribute in new windows');
  // Find all download links in the articles_list_text section (corrected selector)
  const articleDownloadLinks = await page.$$('.articles_list_text .card.row.small-30.no_image .interact ul.action_btns li a[href$="/pdf"]');
  console.log(`Step 11: Found ${articleDownloadLinks.length} PDF download links.`);
  let articleDownloadCount = 0;
  for (const link of articleDownloadLinks) {
    const href = await link.getAttribute('href');
    if (href) {
      const fullHref = href.startsWith('http') ? href : `https://muse.jhu.edu${href}`;
      const newPage = await context.newPage();
      await newPage.goto(fullHref);
      await newPage.waitForTimeout(6000);
      console.log(`PDF page opened for download link: ${fullHref}`);
      // Click at coordinates to trigger the download, as in test_open_pdf.js
      try {
        const [download] = await Promise.all([
          newPage.waitForEvent('download'),
          newPage.mouse.click(1180, 25) // Adjust coordinates if needed
        ]);
        const filename = `downloaded_${articleDownloadCount + 1}.pdf`;
        await download.saveAs(filename);
        console.log(`Downloaded PDF saved as ${filename}`);
        articleDownloadCount++;
      } catch (err) {
        console.warn('No download event triggered or error occurred:', err.message);
      }
      await newPage.close();
    }
  }

  console.log('Automation complete.');
  await browser.close();
})(); 