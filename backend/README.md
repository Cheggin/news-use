# News Use Backend
hey, this is shawn! welcome to the news-use backend...

> ## setup
> - create and activate a virtual environment: `python -m venv .venv && source .venv/bin/activate`
> - run `uv pip install -r requirements.txt` to install dependencies
> - create a .env.local file with your environment variables (see .env.example for reference)
> - run the backend server with `python api.py`

## updates

> ### october 1, 2025
> - we only scrape two major news sources for now: the new york times and the washington post. we can add more later and make a single endpoint for all news sources.
> - we plan on adding an endpoint to actually see the content of the articles we scrape. this would require getting past the paywalls. we have previously been able to get past paywalls by using https://archive.is/.