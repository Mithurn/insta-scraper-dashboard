Build me a small project that scrapes up to 15 public Instagram profiles and displays their real-time stats on a dashboard. The frontend is already done — it just needs a WebSocket endpoint that sends live updates.  

## Requirements
- Language: Python 3.11
- Web framework: FastAPI
- Scraper: Playwright (headless Chromium)
- Cache: Redis (store latest snapshot per profile)
- Transport: WebSockets (clients connect and receive initial data + updates when something changes)
- Containerized: Use Docker and docker-compose (Redis + app)
- Refresh interval: configurable with env var, default 60 seconds
- Profiles: provided as a comma-separated env var (max 15 usernames)

## Features
1. **Scraper** (`scraper.py`):
   - Opens `https://www.instagram.com/{username}/`
   - Extracts:
     - display name
     - bio
     - posts count
     - followers
     - following
     - up to 6 latest post URLs + thumbnails
   - Returns JSON snapshot with `fetched_at` timestamp
   - Converts numbers like `123k`, `1.2m` into integers
   - If blocked or error, handle gracefully

2. **Scheduler**:
   - Loops over configured usernames sequentially
   - Runs scraper once per profile per cycle
   - After each cycle, waits `POLL_INTERVAL` seconds before starting again
   - Stores snapshot in Redis under `ig:{username}` (as JSON string)
   - Detects diffs vs old snapshot (followers, posts, latest post)
   - If changed, broadcasts update via WebSocket

3. **WebSocket server** (`main.py`):
   - Endpoint `/ws`
   - On connect, send initial snapshots of all usernames from Redis
   - When scraper detects a change, push `{"type":"update","username":...,"changed":[...],"snapshot":{...}}`

4. **Files to generate**:
   - `requirements.txt`
   - `docker-compose.yml` (services: redis, app)
   - `Dockerfile` (for the app, install Playwright + deps)
   - `app/scraper.py`
   - `app/main.py`

5. **Extras**:
   - `requirements.txt` should include: fastapi[all], uvicorn[standard], playwright, redis, python-dotenv
   - In Dockerfile: install playwright browsers (`playwright install --with-deps`)
   - Redis container in docker-compose
   - App should load env vars `REDIS_URL`, `POLL_INTERVAL`, `PROFILE_USERNAMES`

## Output format
- Provide the full content of each file separately, with filenames clearly marked
- Make it so I can copy files into a folder and run `docker compose up`

Now, generate the full project files.