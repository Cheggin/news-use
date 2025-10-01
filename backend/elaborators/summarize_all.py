from typing import List, Dict
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Add parent directory to path to import from news_scrapers
sys.path.append(str(Path(__file__).parent.parent))
from news_scrapers.models import Article

# Load .env.local from parent directory
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

# Configure Gemini API with explicit API key
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key=api_key)

def summarize_articles(articles: List[Article], query: str = "") -> Dict:
    """
    Takes a list of Article objects and uses Google Gemini to summarize them
    and find more information based on its understanding.

    Args:
        articles: List of Article objects with 'headline', 'summary', and 'url' attributes
        query: The user's search query to focus the analysis

    Returns:
        Dictionary with summary and additional insights
    """

    # Prepare the article content for Gemini
    article_text = ""
    for i, article in enumerate(articles, 1):
        article_text += f"\nArticle {i}:\n"
        article_text += f"Headline: {article.headline}\n"
        article_text += f"Summary: {article.summary}\n"
        article_text += f"URL: {article.url}\n"
        article_text += "-" * 50

    query_context = f"The user searched for: '{query}'\n\n" if query else ""

    prompt = f"""
    {query_context}Based on these news articles, provide a comprehensive analysis in well-formatted markdown.

    Structure your response with these EXACT section headers:

    ## 1. Comprehensive Summary
    [Tie together all the articles into a cohesive narrative]

    ## 2. Additional Context & Background
    [Background information you know about these topics]

    ## 3. What These Stories Mean & Why They Matter
    [Explain the significance and implications]

    ## 4. Related Information & Bigger Picture
    [Help understand the broader context]

    Articles:
    {article_text}

    IMPORTANT FORMATTING REQUIREMENTS:
    - Use the EXACT section headers shown above with ## markdown formatting
    - Add blank lines between paragraphs for spacing
    - Add blank lines after headings
    - Use **bold** for emphasis on key terms ONLY related to the search topic
    - Use bullet points (-) or numbered lists where appropriate
    - Reference specific articles using (Article 1), (Article 2), etc when discussing their content

    Give me a thorough analysis with additional insights beyond what's in the articles, focusing on the search topic.
    """

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)

        return {
            "success": True,
            "summary": response.text,
            "article_count": len(articles)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def main():
    import asyncio
    from news_scrapers.nyt import search_nyt
    from news_scrapers.washpost import search_washpost

    query = "artificial intelligence"

    print(f"Searching for '{query}' in NYT and Washington Post...")

    # Run both scrapers concurrently
    nyt_task = asyncio.create_task(asyncio.to_thread(search_nyt, query))
    washpost_task = asyncio.create_task(asyncio.to_thread(search_washpost, query))

    # Wait for both to complete
    nyt_results, washpost_results = await asyncio.gather(nyt_task, washpost_task)

    # Convert results to Article objects and combine
    all_articles = []

    if nyt_results and isinstance(nyt_results, dict) and "articles" in nyt_results:
        for article_dict in nyt_results["articles"]:
            all_articles.append(Article(
                headline=article_dict.get("headline", ""),
                summary=article_dict.get("summary", ""),
                url=article_dict.get("url", "")
            ))
        print(f"Found {len(nyt_results['articles'])} articles from NYT")

    if washpost_results and isinstance(washpost_results, dict) and "articles" in washpost_results:
        for article_dict in washpost_results["articles"]:
            all_articles.append(Article(
                headline=article_dict.get("headline", ""),
                summary=article_dict.get("summary", ""),
                url=article_dict.get("url", "")
            ))
        print(f"Found {len(washpost_results['articles'])} articles from Washington Post")

    print(f"\nTotal articles found: {len(all_articles)}")

    if all_articles:
        print("\nSummarizing all articles...")
        result = summarize_articles(all_articles)

        if result["success"]:
            print("\n" + "="*80)
            print("COMBINED ANALYSIS")
            print("="*80)
            print(result["summary"])
        else:
            print(f"Error summarizing: {result['error']}")
    else:
        print("No articles found to summarize")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())