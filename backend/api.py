from fastapi import FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from news_scrapers.nyt import search_nyt
from news_scrapers.washpost import search_washpost
from news_scrapers.models import Articles, Article
from elaborators.summarize_all import summarize_articles

app = FastAPI(
    title="News Use API",
    description="API for news research and analysis",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,https://www.news-use.dev,https://vercel.com/sso/access/request?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fnews-use-git-main-cheggins-projects.vercel.app%252F%26nonce%3Dbad972c2ba15434f6dde20c249ae9a15e5ab84a8a64d8585ec8e994cc77950f0&url=news-use-git-main-cheggins-projects.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Security
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable must be set")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Thread pool for running blocking scraper functions
executor = ThreadPoolExecutor(max_workers=3)

class SearchQuery(BaseModel):
    query: str

@app.post("/search/nyt", response_model=Articles)
async def search_nyt_endpoint(search: SearchQuery, api_key: str = Security(verify_api_key)):
    """Search New York Times for articles related to the query"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, search_nyt, search.query)

@app.post("/search/washpost", response_model=Articles)
async def search_washpost_endpoint(search: SearchQuery, api_key: str = Security(verify_api_key)):
    """Search Washington Post for articles related to the query"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, search_washpost, search.query)

@app.post("/summarize")
async def summarize_endpoint(articles: Articles, api_key: str = Security(verify_api_key)):
    """
    Summarize a list of articles using Google Gemini.
    Takes a list of articles and returns a comprehensive summary with additional context.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, summarize_articles, articles.articles)
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "News Use API",
        "version": "1.0.0",
        "endpoints": {
            "POST /search/nyt": "Search New York Times articles",
            "POST /search/washpost": "Search Washington Post articles",
            "POST /summarize": "Summarize a list of articles using AI",
            "GET /health": "Health check",
            "GET /docs": "Interactive API documentation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
