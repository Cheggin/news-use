// Backend API client for news scraping

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Article {
  headline: string;
  summary: string;
  url: string;
}

interface ArticlesResponse {
  articles: Article[];
}

interface SummarizeResponse {
  success: boolean;
  summary: string;
  article_count: number;
  error?: string;
}

export async function searchNYT(query: string): Promise<ArticlesResponse> {
  const response = await fetch(`${API_BASE_URL}/search/nyt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`NYT search failed: ${response.statusText}`);
  }

  return response.json();
}

export async function searchWashPost(query: string): Promise<ArticlesResponse> {
  const response = await fetch(`${API_BASE_URL}/search/washpost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`WashPost search failed: ${response.statusText}`);
  }

  return response.json();
}

export async function summarizeArticles(
  articles: Article[]
): Promise<SummarizeResponse> {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ articles }),
  });

  if (!response.ok) {
    throw new Error(`Summarization failed: ${response.statusText}`);
  }

  return response.json();
}

export type { Article, ArticlesResponse, SummarizeResponse };
