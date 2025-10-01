import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent, Browser, ChatGoogle

# Load from .env.local file
load_dotenv('.env.local')

async def search_yahoo_finance(query: str, llm: str):
    browser = Browser(headless=False)  # Show browser window for debugging

    task = f"""
    - Navigate to https://finance.yahoo.com/
    - Find the most optimal search query for the following: {query}
    - Input the search query you determined into the search bar at the top of the page
    - Press 'Enter' to initiate the search
    - Wait for the search results to load
    - Extract the relevant information from the search results.
    """

    print(f"Creating agent with task...")
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser
    )

    print(f"Running agent...")
    history = await agent.run()

    return history.structured_output

async def main():
    query = "artificial intelligence"
    llm = ChatGoogle(model="gemini-flash-latest")

    results = await search_yahoo_finance(query, llm)
    print("Search Results:", results)

if __name__ == '__main__':
  asyncio.run(main())