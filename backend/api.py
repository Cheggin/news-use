from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str

@app.post("/search/nyt", response_model=Articles)
async def search_nyt_endpoint(search: SearchQuery):
    """Search New York Times for articles related to the query"""
    return search_nyt(search.query)

@app.post("/search/washpost", response_model=Articles)
async def search_washpost_endpoint(search: SearchQuery):
    """Search Washington Post for articles related to the query"""
    return search_washpost(search.query)

@app.post("/summarize")
async def summarize_endpoint(articles: Articles):
    """
    Summarize a list of articles using Google Gemini.
    Takes a list of articles and returns a comprehensive summary with additional context.
    """
    result = summarize_articles(articles.articles)
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
