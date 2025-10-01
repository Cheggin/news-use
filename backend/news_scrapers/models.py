from pydantic import BaseModel
from typing import List

class Article(BaseModel):
    headline: str
    summary: str
    url: str

class Articles(BaseModel):
    articles: List[Article]