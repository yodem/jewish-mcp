import { Page } from 'playwright';
import { projectMuseOptions } from '../siteOptions';

export interface JournalLink {
  name: string;
  href: string;
}

/**
 * Returns the provided journal links directly, skipping browsing.
 */
export async function browseJournalsStep(page: Page): Promise<JournalLink[]> {
  console.log('Step: Use direct journal URLs');
  return projectMuseOptions.journalLinks;
} 