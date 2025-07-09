import { summarizePdf } from './summarizePdf';
import path from 'path';

async function test() {
  // Use the first PDF in the downloads folder
  const pdfPath = path.resolve(__dirname, '../../downloads/downloaded_1752061189444_1.pdf');
  try {
    const summary = await summarizePdf(pdfPath);
    console.log('Summary:', summary);
  } catch (err) {
    const error = err as Error;
    console.error('Error during PDF summarization:', error.message);
  }
}

test(); 