# Jewish MCP - Academic Article Summarizer

A system for downloading, summarizing, and displaying Jewish academic articles from Project Muse and other sources.

## Features

- **Automated Downloads**: Downloads articles from Project Muse using Playwright
- **AI Summarization**: Uses Google Gemini to generate summaries in both text and markdown formats
- **Database Storage**: SQLite database for articles and summaries
- **Web Interface**: React frontend with Material-UI for viewing summaries
- **Backend API**: Bun/Elysia server for serving data

## Project Structure

```
jewish-mcp/
├── src/                    # Main automation logic
│   ├── playwright/         # Playwright automation
│   ├── db/                # Database schema and functions
│   ├── llm/               # AI summarization
│   └── main.ts            # Main orchestration
├── backend/               # Bun/Elysia API server
├── frontend/              # React/MUI web interface
├── downloads/             # Downloaded PDFs and database
└── summaries/             # Generated summary files
```

## Setup

### 1. Install Dependencies

```bash
# Main project dependencies
npm install

# Backend dependencies
cd backend
bun install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_gemini_api_key
```

### 3. User Preferences

Configure `src/config/userPreferences.json`:

```json
{
  "preferredJournals": ["AJS Review", "Jewish Quarterly Review"],
  "maxArticlesPerJournal": 5
}
```

### 4. Cookies (Optional)

For authenticated access, create `cookies.json` in the root directory with your Project Muse session cookies.

## Usage

### Running the Automation

```bash
# Download and summarize articles
npx ts-node src/main.ts
```

### Running the Web Interface

```bash
# Terminal 1: Start the backend API
cd backend
bun run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

The web interface will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/articles` - Get all articles
- `GET /api/summaries` - Get all summaries
- `GET /api/combined-summaries` - Get combined summaries
- `GET /api/latest-summary` - Get the latest combined summary
- `GET /api/articles/:filePath` - Get specific article
- `GET /api/summaries/:filePath` - Get specific summary

## Web Interface Features

- **Latest Summary**: View the most recent combined summary
- **All Articles**: Browse all downloaded articles
- **All Summaries**: View individual article summaries with markdown rendering

## Database Schema

### Articles Table
- `id` (PRIMARY KEY)
- `title` (TEXT)
- `authors` (TEXT)
- `journal` (TEXT)
- `filePath` (TEXT)
- `downloadDate` (TEXT)
- `year`, `volume`, `issue`, `journalIssue` (TEXT)

### Summaries Table
- `id` (PRIMARY KEY)
- `filePath` (TEXT, UNIQUE)
- `summary` (TEXT)
- `markdown` (TEXT)
- `createdAt` (TEXT)

### Combined Summaries Table
- `id` (PRIMARY KEY)
- `date` (TEXT)
- `content` (TEXT)
- `createdAt` (TEXT)

## Adding New Sites

1. Add site options to `src/playwright/siteOptions.ts`
2. Create site-specific step implementations
3. Update the main orchestration to handle multiple sites

## Technologies Used

- **Backend**: Bun, Elysia, SQLite
- **Frontend**: React, Material-UI, Vite
- **Automation**: Playwright, TypeScript
- **AI**: Google Gemini API
- **Database**: Better-SQLite3 