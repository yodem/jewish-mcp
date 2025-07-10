# Jewish MCP Backend

A Bun/Elysia API server for serving Jewish academic article data and summaries.

## Features

- **RESTful API**: Clean endpoints for articles and summaries
- **SQLite Integration**: Direct database access for fast queries
- **CORS Support**: Configured for frontend integration
- **TypeScript**: Full type safety

## Setup

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
# Install dependencies
bun install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Add any backend-specific environment variables here
PORT=3001
```

## Usage

### Development

```bash
# Start development server with hot reload
bun run dev
```

### Production

```bash
# Start production server
bun run start
```

The server will be available at `http://localhost:3001`

## API Endpoints

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:filePath` - Get specific article by file path

### Summaries
- `GET /api/summaries` - Get all summaries
- `GET /api/summaries/:filePath` - Get specific summary by file path

### Combined Summaries
- `GET /api/combined-summaries` - Get all combined summaries
- `GET /api/latest-summary` - Get the most recent combined summary

## Database

The backend connects to the SQLite database located at `../downloads/articles.db` (relative to the backend directory).

## Technologies

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: SQLite (via better-sqlite3)
- **Language**: TypeScript 