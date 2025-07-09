import fs from "fs";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY!;
if (!GEMINI_API_KEY) throw new Error("GOOGLE_API_KEY not set in .env");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function extractTextFromPDF(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function splitText(text: string, chunkSize = 2000, chunkOverlap = 200): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
  return splitter.splitText(text);
}

async function summarizeWithGemini(text: string, chunkIndex: number): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Here are prompts designed for your bot to summarize Jewish science articles, addressing each of your end goals:

Prompts for Each Chunk Summary
Purpose: To extract key information from individual sections and prepare for the final synthesis.

Prompt Template for Each Chunk:

"You are analyzing a chunk of a Jewish science article. Your task is to extract the most critical information relevant to the article's overall content and its scientific and Jewish implications.

Please provide the following:

Chunk Main Idea: Summarize the core concept or argument presented in this specific chunk in 1-2 concise sentences.

Key Scientific Concepts/Data: List any significant scientific theories, experiments, findings, or data mentioned in this chunk.

Key Jewish Concepts/Texts: List any significant Jewish philosophical ideas, halakhic discussions, Midrashic interpretations, biblical verses, or rabbinic sources referenced in this chunk.

Connections/Interactions: Briefly describe how the scientific and Jewish concepts interact or are reconciled within this chunk. Is there a point of tension, harmony, or a novel interpretation?

Potential Sources Mentioned (if any): Note any specific authors, books, or articles referenced within this chunk that might be part of the article's bibliography.\n\nText:\n${text}\n\n`;
  console.log(`\n[LOG] Sending chunk #${chunkIndex + 1} to Gemini for summarization...`);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_. ]/gi, "_").replace(/\s+/g, "_").slice(0, 100);
}

async function getArticleTitleFromText(text: string): Promise<string> {
  // Try to extract the first non-empty line as the title
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    return sanitizeFilename(lines[0]);
  }
  return "summary";
}

export async function summarizePdf(pdfPath: string): Promise<string> {
  console.log(`[LOG] Extracting text from PDF: ${pdfPath}`);
  const text = await extractTextFromPDF(pdfPath);
  const articleTitle = await getArticleTitleFromText(text);
  console.log(`[LOG] Article title detected: ${articleTitle}`);
  console.log(`[LOG] Splitting text into chunks...`);
  const chunks = await splitText(text);
  console.log(`[LOG] Total chunks: ${chunks.length}`);

  const summaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\n[LOG] --- Chunk #${i + 1} ---`);
    console.log(chunk);
    const summary = await summarizeWithGemini(chunk, i);
    console.log(`\n[LOG] --- Summary for Chunk #${i + 1} ---`);
    console.log(summary);
    summaries.push(summary);
  }

  // Create a single-paragraph review summary of all chunks
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const reviewPrompt = `Given the following chunk summaries, write a single-paragraph review that synthesizes the main ideas and sources from the entire document.\n\nChunk Summaries:\n${summaries.join("\n\n")}\n\nReview (one paragraph):`;
  console.log(`\n[LOG] Creating final review summary of all chunks...`);
  const reviewResult = await model.generateContent(reviewPrompt);
  const finalSummary = reviewResult.response.text();
  console.log(`\n[LOG] --- Final Review Summary ---`);
  console.log(finalSummary);

  return finalSummary;
} 