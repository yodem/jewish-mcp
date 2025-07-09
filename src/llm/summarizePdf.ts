import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { mcpSummarize } from './mcpSummarize';

/**
 * Extracts text from a PDF file, summarizes it using the MCP Market summarizer, and saves the summary to the summaries folder.
 * @param pdfPath Path to the PDF file
 * @returns The summary string
 */
export async function summarizePdf(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;
  if (!text || text.length < 50) {
    throw new Error('PDF text extraction failed or too short.');
  }
  // Use the MCP Market summarizer (real API)
  const summary = await mcpSummarize(text);
  // Save summary to summaries folder
  const summariesDir = path.resolve(__dirname, '../../summaries');
  if (!fs.existsSync(summariesDir)) {
    fs.mkdirSync(summariesDir);
  }
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const summaryPath = path.join(summariesDir, `${baseName}.txt`);
  fs.writeFileSync(summaryPath, summary, 'utf8');
  return summary;
} 