# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

News-use is a full-stack application that generates personalized news aggregations using Browser Use. The app scrapes multiple news sources based on user queries and creates curated articles tailored to specific interests.

**Tech Stack:**
- **Frontend:** React + TypeScript, Vite, Tailwind CSS v4
- **Backend:** FastAPI (Python), Browser Use for web scraping
- **Database:** Convex (real-time backend platform)

## Project Structure

The repository has a unique structure with the frontend and backend at the same level:

```
news-use/               # Frontend React application
  ├── src/              # React components and app logic
  ├── convex/           # Convex backend (queries, mutations, schema)
  └── package.json
backend/                # FastAPI Python backend
  ├── api.py            # Main FastAPI application
  ├── news_scrapers/    # News source scrapers (NYT, WashPost)
  └── elaborators/      # Article summarization and processing
```

## Development Commands

### Frontend (from `news-use/` directory)
```bash
# Install dependencies
npm install

# Start both frontend and backend Convex
npm run dev

# Start only frontend
npm run dev:frontend

# Start only Convex backend
npm run dev:backend

# Build for production
npm run build

# Run linting (TypeScript + ESLint)
npm run lint
```

### Backend (from `backend/` directory)
```bash
# Create and activate virtual environment
python -m venv .venv && source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Run FastAPI server (on port 8000)
python api.py
```

## Convex Architecture

### Working Directory
**IMPORTANT:** The Convex backend lives in `news-use/convex/`, not at the project root.

### Schema (`news-use/convex/schema.ts`)
- **created_newspapers**: Stores generated newspaper articles
  - Fields: query, newspapers (any), articleCount, headlines, createdAt, userName, isPublic
  - Index: `by_created_at` on `createdAt` field

### Functions (`news-use/convex/newspapers.ts`)
- **createNewspaper** (mutation): Creates a new newspaper entry
- **listNewspapers** (query): Lists public newspapers in descending order by creation time
- **getNewspaper** (query): Retrieves a specific newspaper by ID
- **getStats** (query): Returns aggregated statistics

### Convex Integration
- Provider setup in `news-use/src/main.tsx`
- Uses hooks from `convex/react`: `useQuery`, `useMutation`, `useAction`
- API imported from `@/convex/_generated/api`

### Convex Best Practices
Always follow the Convex guidelines in `.cursor/rules/convex_rules.mdc`:
- Use new function syntax with `args`, `returns`, and `handler`
- Always include validators for arguments and return values using `v.*` from `convex/values`
- Use `returns: v.null()` if function doesn't return anything
- Define indexes with field names in the index name (e.g., `by_created_at`)
- Use `internal*` functions for private APIs (not exposed to public)

## FastAPI Backend

### Structure
- **api.py**: Main FastAPI app with CORS enabled
- **news_scrapers/**: Browser Use implementations for news sources
  - `nyt.py`: New York Times scraper
  - `washpost.py`: Washington Post scraper
  - `models.py`: Pydantic models for Article and Articles
- **elaborators/**: Article processing utilities
  - `summarize_all.py`: AI summarization using Google Gemini
  - `anti_paywall.py`: Paywall bypass utilities

### API Endpoints
- `POST /search/nyt`: Search NYT articles
- `POST /search/washpost`: Search WashPost articles
- `POST /summarize`: Summarize articles using AI
- `GET /health`: Health check
- `GET /`: API info
- `GET /docs`: Interactive Swagger documentation

## Frontend Architecture

### Key Components (`news-use/src/components/`)
- **Header.tsx**: Navigation and branding
- **HeroSection.tsx**: Landing page hero with stats
- **QueryInput.tsx**: User input for news queries
- **GlobalFeed.tsx**: Displays public newspapers feed
- **NewspaperCard.tsx**: Individual newspaper preview card
- **NewspaperDetail.tsx**: Full newspaper view
- **LoadingState.tsx**: Loading indicator

### Configuration
- **TypeScript**: Strict mode, path alias `@/` → `./src/`
- **Vite**: Build tool with React plugin and Tailwind Vite plugin
- **ESLint**: Configured for TypeScript and React

## Deployment Configuration

- **Convex Deployment**: Uses environment variable `VITE_CONVEX_URL`
- **CORS**: FastAPI configured to allow all origins (should be restricted in production)

## Important Notes

- The `convex/_generated/` directory is auto-generated - never edit manually
- Frontend and backend run on separate ports (Vite default: 5173, FastAPI: 8000)
- Backend requires Python virtual environment and dependencies installed
- Frontend requires npm dependencies installed
