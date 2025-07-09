import fetch from 'node-fetch';

/**
 * Summarize text using the MCP Market content summarizer API.
 * @param text The text to summarize
 * @returns The summary string
 */
export async function mcpSummarize(text: string): Promise<string> {
  const response = await fetch('https://mcpmarket.com/server/content-summarizer-1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  if (!response.ok) {
    throw new Error(`MCP summarizer API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { summary?: string };
  // Assume the API returns { summary: "..." }
  return data.summary || '';
} 