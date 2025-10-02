# News Use

<div align="center">
  <img src="news-use/public/news-use-logo.svg" alt="News Use Logo" width="120"/>

  **AI-Powered Personalized News Aggregation**

  Scrape, analyze, and curate custom news articles, and see what others are interested in!
</div>

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Features](#features)
- [Customization](#customization)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)
- [License](#license)

> **Notes**
> - Hey all! This is Reagan. Welcome to the News Use repo! As of Oct 1. 2025, we aim to make this app more comprehensive and span across even more sources! One thing we loved about this project is that you get to see articles that other people made :D have fun generating!


## Quick Start

```bash
# Install frontend dependencies
cd news-use
npm install

# Set up environment
cp .env.example .env.local
# Add your Convex URL (auto-generated on first run)

# Run development server
npm run dev
```

The app will open at `http://localhost:5173`

### Backend Setup

```bash
cd backend

# Set up Python environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env.local
# Add your GOOGLE_API_KEY and BROWSER_USE_API_KEY

# Run backend server
python api.py
```

The API will run at `http://localhost:8000`

## Project Structure

```
news-use/
├── news-use/              # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── lib/         # API client utilities
│   │   └── App.tsx      # Main application
│   └── convex/          # Convex backend
│       ├── schema.ts    # Database schema
│       └── newspapers.ts # CRUD operations
└── backend/             # FastAPI server
    ├── api.py           # Main API
    ├── news_scrapers/   # NYT & WashPost scrapers
    └── elaborators/     # AI summarization
```

## Development

### Frontend Development

```bash
cd news-use

npm run dev              # Start both frontend and Convex
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only Convex
npm run build           # Production build
npm run lint            # Run linter
```

### Backend API (Python)

```bash
cd backend

# Using uv (recommended)
uv pip install -r requirements.txt
python api.py

# Access API docs
# http://localhost:8000/docs
```

### Database Management

Access Convex Dashboard to view/edit data:
```bash
cd news-use
npx convex dashboard
```

## Features

### News Scraping
- **Browser Use SDK** - Automated scraping of NYT and Washington Post
- **Parallel Execution** - Scrape multiple sources simultaneously
- **Real-time Updates** - See articles populate as they're found

### AI Summarization
- **Google Gemini** - Comprehensive article analysis
- **Context Generation** - Additional background information
- **Cross-Reference** - Link related articles together

### Newspaper Management
- **Convex Real-time DB** - Instant sync across devices
- **Public/Private** - Share newspapers or keep them private
- **Global Feed** - Browse newspapers from other users

## Customization

### Add New News Sources

1. **Create Scraper** (`backend/news_scrapers/source.py`):
```python
from browser_use_sdk import BrowserUse
from .models import Articles

client = BrowserUse(api_key=os.getenv("BROWSER_USE_API_KEY"))

def search_source(query: str) -> dict:
    task = client.tasks.create_task(
        task=f"Search for articles about: {query}",
        llm="gemini-flash-latest",
        schema=Articles,
    )
    result = task.complete()
    return result.output
```

2. **Update API** (`backend/api.py`):
```python
from news_scrapers.source import search_source

@app.post("/search/source")
async def search_source_endpoint(search: SearchQuery):
    return search_source(search.query)
```

3. **Update Frontend** (`news-use/src/lib/api.ts`):
```typescript
export async function searchSource(query: string) {
  const response = await fetch(`${API_BASE_URL}/search/source`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return response.json();
}
```

4. **Add to QueryInput** (`news-use/src/components/QueryInput.tsx`):
```typescript
const sourceResponse = await searchSource(query);
allArticles.push(...sourceResponse.articles);
```

### Modify AI Summarization Prompt

Edit the prompt in `backend/elaborators/summarize_all.py` (line ~44):
```python
prompt = f"""
Based on these news articles, provide:

1. Your custom analysis requirements
2. Additional context you want
3. Specific focus areas
...
"""
```

### Customize Newspaper Display

Modify sections in `news-use/src/components/NewspaperDetail.tsx`:
```typescript
const parseSummary = (content: string) => {
  // Add your custom section parsing logic
  const customMatch = formatted.match(/5\.\s*Your Section[^]*/i);
  if (customMatch) {
    sections.push({
      title: "Your Custom Section",
      content: customMatch[0],
      key: "custom"
    });
  }
};
```

## API Endpoints

### FastAPI (Port 8000)

- `POST /search/nyt` - Search New York Times
- `POST /search/washpost` - Search Washington Post
- `POST /summarize` - Summarize articles with AI
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

### Convex Functions

- `createNewspaper` - Save newspaper to database
- `listNewspapers` - Get public newspapers
- `getNewspaper` - Get specific newspaper by ID
- `getStats` - Get aggregated statistics

## Environment Variables

### Frontend (`news-use/.env.local`)
```env
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_API_URL=http://localhost:8000  # Optional, defaults to localhost:8000
```

### Backend (`backend/.env.local`)
```env
GOOGLE_API_KEY=your_google_api_key
BROWSER_USE_API_KEY=your_browser_use_api_key
```

### CORS Issues
If deploying to production, update CORS in `backend/api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Replace *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Convex, FastAPI, Render
- **AI**: Google Gemini Flash (summarization)
- **Scraping**: Browser Use SDK (automated browsing)

## Roadmap

- [ ] Add more news sources (Reuters, Bloomberg, BBC)
- [ ] News analytics (sentiment analysis, trends, etc.)
- [ ] Email notifications for new articles
- [ ] Advanced filtering and search

## License

MIT - See [LICENSE](LICENSE) file for details

---

**Built with Browser Use** - Automated web scraping powered by AI

Made with ❤️ by Reagan + Shawn + Browser Use
