import { mcpSummarize } from './mcpSummarize';

async function test() {
  const sampleText = `Project MUSE is a leading provider of digital humanities and social science content for the scholarly community. It offers full-text access to journals and books from university presses and scholarly societies.`;
  try {
    const summary = await mcpSummarize(sampleText);
    console.log('Summary:', summary);
  } catch (err) {
    const error = err as Error;
    console.error('Error during summarization:', error.message);
  }
}

test(); 