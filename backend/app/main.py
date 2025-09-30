from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import profiles, scraper
from app.models import profile, post

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Instagram Analytics API",
    description="API for Instagram profile analytics and scraping",
    version="1.0.0"
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])

@app.get("/")
async def root():
    return {"message": "Instagram Analytics API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "instagram-analytics-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
