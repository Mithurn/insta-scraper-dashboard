import os
from typing import List

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Scraping Configuration
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))
PROFILE_USERNAMES_STR = os.getenv("PROFILE_USERNAMES", "cristiano,leomessi,selenagomez,therock,kyliejenner")
PROFILE_USERNAMES: List[str] = [u.strip() for u in PROFILE_USERNAMES_STR.split(",") if u.strip()]

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/instascrape_db")

# API Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
