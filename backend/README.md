# News-Use Backend

FastAPI-powered backend for the News-Use news aggregation application with Browser Use integration.

## Quick Start

```bash
# Setup virtual environment
just venv
source venv/bin/activate

# Install dependencies
just install

# Setup environment
just env
# Edit .env with your API keys

# Run development server
just dev
```

## Architecture

### API Structure
- **FastAPI** REST API with async support
- **WebSocket** connections for real-time updates
- **Background tasks** for newspaper generation
- **Mock endpoints** returning proper JSON structures

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/newspapers` | Create newspaper |
| GET | `/api/newspapers` | List newspapers |
| GET | `/api/newspapers/{id}` | Get specific newspaper |
| GET | `/api/tasks/{id}` | Check generation status |
| WS | `/ws/newspapers` | Real-time updates |

### Models Available
- `gemini-flash-3.0` (default)
- `gpt-4.1`
- `gemini-flash-2.5`

## Development

### Running Tests
```bash
just test           # Run all tests
just test-cov       # With coverage
just test-async     # Async tests only
```

### Code Quality
```bash
just quality        # Run all checks
just format         # Format with Black
just lint           # Lint with flake8
just typecheck      # Type check with mypy
```

### Browser Use Operations
```bash
# Run news aggregation
just browser-use "AI news"

# With specific model
just browser-use-model "AI news" gpt-4

# With visible browser
just browser-use-visible "AI news"
```

## Environment Variables

Key configurations in `.env`:

```env
# API Keys
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GOOGLE_API_KEY=your_key

# Server
HOST=0.0.0.0
PORT=8000
ENV=development

# Browser Settings
BROWSER_HEADLESS=true
BROWSER_MAX_PARALLEL_TABS=5
```

## API Usage Examples

### Create Newspaper
```bash
curl -X POST http://localhost:8000/api/newspapers \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI breakthroughs",
    "model": "gemini-flash-3.0",
    "include_public": true,
    "sources_count": 5
  }'
```

### Check Task Status
```bash
curl http://localhost:8000/api/tasks/{task_id}
```

### List Public Newspapers
```bash
curl "http://localhost:8000/api/newspapers?public_only=true&page=1"
```

## Deployment

### Docker
```bash
just docker-build
just docker-run
```

### Production
```bash
just prod           # Production server
just gunicorn       # With Gunicorn
just deploy         # Full deployment
```

## Monitoring

```bash
just logs           # View logs
just monitor        # Monitor API stats
just resources      # Check system usage
```

## Common Commands

See all available commands:
```bash
just --list
```

Key commands:
- `just dev` - Start development server
- `just test` - Run tests
- `just quality` - Code quality checks
- `just clean` - Clean cache files
- `just help` - Show help