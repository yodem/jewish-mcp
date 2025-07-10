# Jewish MCP Frontend

A React application with Material-UI for displaying Jewish academic article summaries.

## Features

- **Modern UI**: Clean Material-UI design with responsive layout
- **Markdown Rendering**: Beautiful display of article summaries
- **Tabbed Interface**: Easy navigation between different views
- **Real-time Data**: Fetches data from the backend API

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

## Usage

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

### Latest Summary Tab
- Displays the most recent combined summary
- Shows article count and date
- Renders markdown content with proper styling

### All Articles Tab
- Lists all downloaded articles
- Shows metadata (title, authors, journal, download date)
- Responsive grid layout

### All Summaries Tab
- Displays individual article summaries
- Full markdown rendering
- Links articles to their summaries

## API Integration

The frontend connects to the backend API at `http://localhost:3001` via Vite's proxy configuration.

### API Endpoints Used
- `GET /api/articles` - Fetch all articles
- `GET /api/summaries` - Fetch all summaries
- `GET /api/combined-summaries` - Fetch combined summaries

## Technologies

- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Markdown**: React Markdown

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md           # This file
``` 