from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import logging
from app.websocket_server import websocket_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Instagram Analytics API with WebSocket",
    description="Real-time Instagram profile analytics with WebSocket updates",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Profile(BaseModel):
    id: int
    username: str
    profile_name: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    engagement_rate: float = 0.0
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    is_verified: int = 0
    is_private: int = 0
    last_updated: str = "2024-01-01T00:00:00"

class ProfileRanking(BaseModel):
    rank: int
    username: str
    profile_name: Optional[str] = None
    followers_count: int
    following_count: int
    posts_count: int
    engagement_rate: float
    is_verified: int
    last_updated: str

class AddProfileRequest(BaseModel):
    username: str

@app.on_event("startup")
async def startup_event():
    """Initialize WebSocket manager and start scraping"""
    try:
        await websocket_manager.setup_redis()
        await websocket_manager.setup_scraper()
        await websocket_manager.start_scraping_loop()
        logger.info("WebSocket server initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize WebSocket server: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources"""
    await websocket_manager.cleanup()
    logger.info("WebSocket server shutdown")

@app.get("/")
async def root():
    return {
        "message": "Instagram Analytics API with WebSocket",
        "version": "2.0.0",
        "websocket_endpoint": "/ws",
        "features": [
            "Real-time Instagram profile scraping",
            "WebSocket live updates",
            "Redis caching",
            "Configurable refresh intervals"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "instagram-analytics-api-websocket",
        "websocket_connections": len(websocket_manager.active_connections)
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back any messages from client
            await websocket_manager.send_personal_message(data, websocket)
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket_manager.disconnect(websocket)

@app.get("/api/profiles/")
async def get_profiles():
    """Get all profiles from Redis"""
    try:
        if not websocket_manager.redis_client:
            return []
        
        profiles = []
        for username in websocket_manager.usernames:
            key = f"ig:{username}"
            data = await websocket_manager.redis_client.get(key)
            if data:
                profile_data = json.loads(data)
                # Convert to our Profile format
                profile = Profile(
                    id=hash(username) % 1000000,  # Simple ID generation
                    username=username,
                    profile_name=profile_data.get('display_name'),
                    followers_count=profile_data.get('followers', 0),
                    following_count=profile_data.get('following', 0),
                    posts_count=profile_data.get('posts', 0),
                    bio=profile_data.get('bio'),
                    last_updated=profile_data.get('fetched_at', '2024-01-01T00:00:00')
                )
                profiles.append(profile)
        
        return profiles
    except Exception as e:
        logger.error(f"Error getting profiles: {e}")
        return []

@app.get("/api/profiles/{username}")
async def get_profile(username: str):
    """Get specific profile from Redis"""
    try:
        if not websocket_manager.redis_client:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        key = f"ig:{username}"
        data = await websocket_manager.redis_client.get(key)
        
        if not data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = json.loads(data)
        profile = Profile(
            id=hash(username) % 1000000,
            username=username,
            profile_name=profile_data.get('display_name'),
            followers_count=profile_data.get('followers', 0),
            following_count=profile_data.get('following', 0),
            posts_count=profile_data.get('posts', 0),
            bio=profile_data.get('bio'),
            last_updated=profile_data.get('fetched_at', '2024-01-01T00:00:00')
        )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile {username}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/profiles/")
async def add_profile(request: AddProfileRequest):
    """Add a new profile to scrape"""
    try:
        username = request.username.strip().lower()
        
        if username not in websocket_manager.usernames:
            websocket_manager.usernames.append(username)
            logger.info(f"Added {username} to scraping list")
        
        return {"message": f"Profile {username} added successfully"}
    except Exception as e:
        logger.error(f"Error adding profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/status/")
async def get_status():
    """Get scraping status and configuration"""
    return {
        "usernames": websocket_manager.usernames,
        "poll_interval": websocket_manager.poll_interval,
        "active_connections": len(websocket_manager.active_connections),
        "redis_connected": websocket_manager.redis_client is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
