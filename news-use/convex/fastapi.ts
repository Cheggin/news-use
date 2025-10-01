import { action } from "./_generated/server";
import { v } from "convex/values";

// Type definitions matching your backend responses
interface Article {
  headline: string;
  summary: string;
  url: string;
}

interface ArticlesResponse {
  articles: Article[];
}

interface SummarizeResponse {
  summary: string;
}

// Search New York Times
export const searchNYT = action({
  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    const apiKey = process.env.API_KEY!;
    const apiUrl = process.env.FASTAPI_URL!;

    const response = await fetch(`${apiUrl}/search/nyt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`NYT search failed: ${response.statusText}`);
    }

    return (await response.json()) as ArticlesResponse;
  },
});

// Search Washington Post
export const searchWashPost = action({
  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    const apiKey = process.env.API_KEY!;
    const apiUrl = process.env.FASTAPI_URL!;

    const response = await fetch(`${apiUrl}/search/washpost`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Washington Post search failed: ${response.statusText}`);
    }

    return (await response.json()) as ArticlesResponse;
  },
});

// Summarize articles
export const summarizeArticles = action({
  args: {
    query: v.string(),
    articles: v.array(
      v.object({
        headline: v.string(),
        summary: v.string(),
        url: v.string(),
      })
    ),
  },
  handler: async (_ctx, { query, articles }) => {
    const apiKey = process.env.API_KEY!;
    const apiUrl = process.env.FASTAPI_URL!;

    const response = await fetch(`${apiUrl}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ query, articles }),
    });

    if (!response.ok) {
      throw new Error(`Summarize failed: ${response.statusText}`);
    }

    return (await response.json()) as SummarizeResponse;
  },
});
