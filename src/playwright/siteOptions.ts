export interface SiteOptions {
  name: string;
  journalLinks: { name: string; href: string }[];
  selectors: {
    title: string;
    volume: string;
    pdfLink: string;
  };
}

export const projectMuseOptions: SiteOptions = {
  name: 'Project Muse',
  journalLinks: [
    { name: 'AJS Review', href: 'https://muse.jhu.edu/pub/56/journal/844' },
    { name: 'Jewish Quarterly Review', href: 'https://muse.jhu.edu/pub/56/journal/292' },
    { name: 'Journal of Biblical Literature', href: 'https://muse.jhu.edu/pub/138/journal/513' },
  ],
  selectors: {
    title: '.title',
    volume: 'div.volume',
    pdfLink: 'a[href$="/pdf"]',
  },
}; 