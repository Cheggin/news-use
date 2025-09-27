"""
FastAPI Backend for News-Use Application
Handles newspaper generation, storage, and retrieval with Browser Use integration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta, timezone
import asyncio
import logging
import uuid
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="News-Use API",
    description="Browser-Use-powered news aggregation and curation service",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Data Models
# ============================================================================

class ModelType(str, Enum):
    GEMINI_FLASH_30 = "gemini-flash-3.0"
    GPT_41 = "gpt-4.1"
    GEMINI_FLASH_25 = "gemini-flash-2.5"

class ArticleSource(BaseModel):
    """Individual article/source in a newspaper"""
    link: str
    content: str
    title: Optional[str] = None
    published_date: Optional[datetime] = None
    source_name: Optional[str] = None

class NewspaperRequest(BaseModel):
    """Request model for creating a newspaper"""
    query: str = Field(..., min_length=1, max_length=500, description="News query/topic")
    model: ModelType = Field(default=ModelType.GEMINI_FLASH_30, description="AI model to use")
    include_public: bool = Field(default=True, description="Include in public feed")
    user_name: Optional[str] = Field(None, max_length=100, description="Optional user name")
    sources_count: int = Field(default=5, ge=1, le=20, description="Number of sources to fetch")

    @field_validator('query')
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError("Query cannot be empty or whitespace only")
        return v.strip()

class NewspaperResponse(BaseModel):
    """Response model for a generated newspaper"""
    id: str
    query: str
    model: ModelType
    articles: Dict[str, ArticleSource]
    article_count: int
    headlines: List[str]
    created_at: datetime
    user_name: Optional[str] = None
    is_public: bool
    generation_time_ms: Optional[float] = None
    status: Literal["completed", "processing", "failed"] = "completed"

class NewspaperListResponse(BaseModel):
    """Response for listing newspapers"""
    newspapers: List[NewspaperResponse]
    total: int
    page: int
    per_page: int
    has_more: bool

class GenerationStatus(BaseModel):
    """Status of newspaper generation"""
    task_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: float = Field(ge=0, le=100)
    message: Optional[str] = None
    result: Optional[NewspaperResponse] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str
    uptime_seconds: float
    active_tasks: int

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============================================================================
# In-Memory Storage (for development - replace with database in production)
# ============================================================================

newspapers_db: Dict[str, NewspaperResponse] = {}
generation_tasks: Dict[str, GenerationStatus] = {}
app_start_time = datetime.now(timezone.utc)

# ============================================================================
# Helper Functions
# ============================================================================

async def generate_newspaper_with_browser_use(
    query: str,
    _model: ModelType,  # Unused in mock implementation
    sources_count: int,
    task_id: str
) -> Dict[str, Any]:
    """
    Simulate newspaper generation with Browser Use
    In production, this would call the actual browser_use.py script
    """
    try:
        # Update task status
        generation_tasks[task_id].status = "processing"
        generation_tasks[task_id].progress = 10
        generation_tasks[task_id].message = "Initializing Browser Use agent..."

        # Simulate progressive updates
        await asyncio.sleep(1)
        generation_tasks[task_id].progress = 30
        generation_tasks[task_id].message = f"Searching for news about: {query}"

        await asyncio.sleep(2)
        generation_tasks[task_id].progress = 60
        generation_tasks[task_id].message = "Extracting and analyzing articles..."

        await asyncio.sleep(1)
        generation_tasks[task_id].progress = 80
        generation_tasks[task_id].message = "Generating newspaper content..."

        # Generate mock articles (replace with actual Browser Use integration)
        articles = {}
        headlines = []
        for i in range(1, min(sources_count + 1, 6)):
            article_key = f"article{i}"
            articles[article_key] = ArticleSource(
                link=f"https://news-source-{i}.com/{uuid.uuid4().hex[:8]}",
                content=f"Comprehensive coverage of {query}. "
                       f"This article provides detailed analysis and expert insights "
                       f"on the latest developments regarding {query}. "
                       f"Multiple perspectives and data points are examined to give "
                       f"readers a complete understanding of the topic.",
                title=f"Breaking: Latest developments in {query}",
                published_date=datetime.now(timezone.utc) - timedelta(hours=i),
                source_name=f"News Source {i}"
            )
            headlines.append(f"Headline {i}: Key insights on {query}")

        generation_tasks[task_id].progress = 100
        generation_tasks[task_id].message = "Newspaper generation complete!"

        return {
            "articles": articles,
            "headlines": headlines[:3],
            "generation_time_ms": 4500.0
        }

    except Exception as e:
        logger.error(f"Error generating newspaper: {str(e)}")
        generation_tasks[task_id].status = "failed"
        generation_tasks[task_id].error = str(e)
        raise

async def process_newspaper_generation(
    request: NewspaperRequest,
    task_id: str
):
    """Background task to generate newspaper"""
    try:

        # Generate newspaper content
        result = await generate_newspaper_with_browser_use(
            request.query,
            request.model,  # Model parameter passed but unused in mock
            request.sources_count,
            task_id
        )

        # Create newspaper response
        newspaper = NewspaperResponse(
            id=str(uuid.uuid4()),
            query=request.query,
            model=request.model,
            articles=result["articles"],
            article_count=len(result["articles"]),
            headlines=result["headlines"],
            created_at=datetime.now(timezone.utc),
            user_name=request.user_name,
            is_public=request.include_public,
            generation_time_ms=result["generation_time_ms"],
            status="completed"
        )

        # Store in database
        newspapers_db[newspaper.id] = newspaper

        # Update task status
        generation_tasks[task_id].status = "completed"
        generation_tasks[task_id].result = newspaper
        generation_tasks[task_id].progress = 100

    except Exception as e:
        logger.error(f"Task {task_id} failed: {str(e)}")
        generation_tasks[task_id].status = "failed"
        generation_tasks[task_id].error = str(e)
        generation_tasks[task_id].progress = 0

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "News-Use API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/api/docs",
            "health": "/api/health",
            "newspapers": "/api/newspapers"
        }
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = (datetime.now(timezone.utc) - app_start_time).total_seconds()
    active_tasks = sum(1 for t in generation_tasks.values() if t.status == "processing")

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
        uptime_seconds=uptime,
        active_tasks=active_tasks
    )

@app.post("/api/newspapers", response_model=GenerationStatus)
async def create_newspaper(
    request: NewspaperRequest,
    background_tasks: BackgroundTasks
):
    """
    Create a new newspaper asynchronously
    Returns a task ID for tracking generation progress
    """
    try:
        # Create task ID
        task_id = str(uuid.uuid4())

        # Initialize task status
        generation_tasks[task_id] = GenerationStatus(
            task_id=task_id,
            status="pending",
            progress=0,
            message="Newspaper generation queued"
        )

        # Add to background tasks
        background_tasks.add_task(
            process_newspaper_generation,
            request,
            task_id
        )

        logger.info(f"Created newspaper generation task: {task_id}")
        return generation_tasks[task_id]

    except Exception as e:
        logger.error(f"Error creating newspaper: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/newspapers/{newspaper_id}", response_model=NewspaperResponse)
async def get_newspaper(newspaper_id: str):
    """Get a specific newspaper by ID"""
    if newspaper_id not in newspapers_db:
        raise HTTPException(status_code=404, detail="Newspaper not found")

    return newspapers_db[newspaper_id]

@app.get("/api/newspapers", response_model=NewspaperListResponse)
async def list_newspapers(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    public_only: bool = Query(True, description="Show only public newspapers"),
    model: Optional[ModelType] = Query(None, description="Filter by model"),
    search: Optional[str] = Query(None, description="Search in queries")
):
    """
    List newspapers with pagination and filtering
    """
    # Filter newspapers
    filtered = list(newspapers_db.values())

    if public_only:
        filtered = [n for n in filtered if n.is_public]

    if model:
        filtered = [n for n in filtered if n.model == model]

    if search:
        search_lower = search.lower()
        filtered = [n for n in filtered if search_lower in n.query.lower()]

    # Sort by creation date (newest first)
    filtered.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    total = len(filtered)
    start = (page - 1) * per_page
    end = start + per_page
    newspapers = filtered[start:end]

    return NewspaperListResponse(
        newspapers=newspapers,
        total=total,
        page=page,
        per_page=per_page,
        has_more=end < total
    )

@app.delete("/api/newspapers/{newspaper_id}")
async def delete_newspaper(newspaper_id: str):
    """Delete a newspaper"""
    if newspaper_id not in newspapers_db:
        raise HTTPException(status_code=404, detail="Newspaper not found")

    del newspapers_db[newspaper_id]
    return {"message": "Newspaper deleted successfully", "id": newspaper_id}

@app.get("/api/tasks/{task_id}", response_model=GenerationStatus)
async def get_task_status(task_id: str):
    """Get the status of a newspaper generation task"""
    if task_id not in generation_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return generation_tasks[task_id]

@app.post("/api/newspapers/batch", response_model=List[GenerationStatus])
async def create_batch_newspapers(
    background_tasks: BackgroundTasks,
    requests: List[NewspaperRequest] = Body(..., max_items=10)
):
    """
    Create multiple newspapers in batch (max 10 at once)
    """
    if len(requests) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 newspapers per batch")

    task_statuses = []

    for request in requests:
        task_id = str(uuid.uuid4())
        generation_tasks[task_id] = GenerationStatus(
            task_id=task_id,
            status="pending",
            progress=0,
            message="Newspaper generation queued"
        )

        background_tasks.add_task(
            process_newspaper_generation,
            request,
            task_id
        )

        task_statuses.append(generation_tasks[task_id])

    return task_statuses

@app.get("/api/stats")
async def get_statistics():
    """Get API usage statistics"""
    public_count = sum(1 for n in newspapers_db.values() if n.is_public)
    private_count = len(newspapers_db) - public_count

    model_counts = {}
    for model in ModelType:
        model_counts[model.value] = sum(1 for n in newspapers_db.values() if n.model == model)

    return {
        "total_newspapers": len(newspapers_db),
        "public_newspapers": public_count,
        "private_newspapers": private_count,
        "active_tasks": sum(1 for t in generation_tasks.values() if t.status == "processing"),
        "completed_tasks": sum(1 for t in generation_tasks.values() if t.status == "completed"),
        "failed_tasks": sum(1 for t in generation_tasks.values() if t.status == "failed"),
        "models_usage": model_counts,
        "uptime_seconds": (datetime.now(timezone.utc) - app_start_time).total_seconds()
    }

# ============================================================================
# WebSocket Support (for real-time updates)
# ============================================================================

from fastapi import WebSocket, WebSocketDisconnect
from typing import Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/newspapers")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time newspaper updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for messages
            await websocket.receive_text()
            # Could handle client messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(_, exc):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="Invalid input",
            detail=str(exc),
            request_id=str(uuid.uuid4())
        ).model_dump()
    )

@app.exception_handler(Exception)
async def general_exception_handler(_, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail="An unexpected error occurred",
            request_id=str(uuid.uuid4())
        ).model_dump()
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)