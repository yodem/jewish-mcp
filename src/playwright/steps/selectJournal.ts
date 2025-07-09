import { JournalLink } from './browseJournals';

/**
 * Selects a journal by name from the list of available journals.
 * For now, picks the first matching journal (case-insensitive).
 */
export function selectJournalStep(journals: JournalLink[], preferredName: string): JournalLink | undefined {
  const selected = journals.find(j => j.name.toLowerCase().includes(preferredName.toLowerCase()));
  if (selected) {
    console.log(`Selected journal: ${selected.name}`);
  } else {
    console.warn(`No journal found matching: ${preferredName}`);
  }
  return selected;
} 