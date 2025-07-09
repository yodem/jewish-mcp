# Jewish MCP Automation Project

## Overview
This project automates the process of downloading academic journals from Project Muse, summarizes them using an LLM, and sends summaries to academic professors via email. It is written in TypeScript for maintainability and scalability.

## Project Structure

- `downloads/` — All downloaded PDFs are saved here.
- `playwright/` — Playwright configuration and helpers.
- `src/`
  - `playwright/steps/` — Each Playwright automation step in a separate file/module.
  - `db/` — SQLite database logic and models.
  - `config/` — User preferences, journal lists, API keys, etc.
  - `utils/` — Utility functions (logging, parsing, etc.).
  - `llm/` — LLM summarization logic.
  - `email/` — Email sending logic.

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Compile TypeScript (if needed):
   ```sh
   npx tsc
   ```
3. Configure your environment variables in `.env` (for API keys, email, etc.).
4. Place your user preferences and journal list in `src/config/`.

## Goals
- **Modular automation:** Each Playwright step is in its own file for easy editing and testing.
- **Database-backed:** Uses SQLite to store article metadata (title, authors, file path, etc.).
- **User preferences:** Downloads journals according to user configuration.
- **Summarization:** Uses an LLM to summarize downloaded articles.
- **Email delivery:** Sends summaries to academic recipients.

## Contributing
- Edit or add new Playwright steps in `src/playwright/steps/`.
- Update database logic in `src/db/`.
- Add or modify user preferences in `src/config/`.

---

For more details, see the code in each folder and the inline documentation. 