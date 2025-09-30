from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import asyncio
from scraper.playwright_scraper import InstagramScraper

# Simple in-memory storage for demo purposes
profiles_db = []

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

class Profile(BaseModel):
    id: int
    username: str
    profile_name: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
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
    is_verified: int
    is_private: int = 0
    last_updated: str

app = FastAPI(
    title="Instagram Analytics API",
    description="API for Instagram profile analytics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Instagram Analytics API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "instagram-analytics-api"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial data
        initial_data = {
            "type": "initial",
            "data": {},
            "timestamp": "2024-01-01T00:00:00Z"
        }
        await manager.send_personal_message(json.dumps(initial_data), websocket)
        
        # Send periodic heartbeat to keep connection alive
        while True:
            try:
                # Wait for client message with timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo back
                await manager.send_personal_message(data, websocket)
            except asyncio.TimeoutError:
                # Send heartbeat
                heartbeat = {
                    "type": "heartbeat",
                    "timestamp": "2024-01-01T00:00:00Z"
                }
                await manager.send_personal_message(json.dumps(heartbeat), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/profiles/", response_model=List[Profile])
async def get_all_profiles():
    """Get all profiles"""
    return profiles_db

@app.delete("/api/profiles/{username}")
async def delete_profile(username: str):
    """Delete a profile by username"""
    global profiles_db
    original_count = len(profiles_db)
    profiles_db = [profile for profile in profiles_db if profile.username != username]
    
    if len(profiles_db) < original_count:
        return {"success": True, "message": f"Profile {username} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail=f"Profile {username} not found")

@app.get("/api/profiles/ranked", response_model=List[ProfileRanking])
async def get_ranked_profiles(by: str = "followers_count", order: str = "desc", limit: int = 50):
    """Get profiles ranked by specified metric"""
    
    # Validate sort column
    valid_columns = ["followers_count", "following_count", "posts_count"]
    if by not in valid_columns:
        raise HTTPException(status_code=400, detail=f"Invalid sort column. Must be one of: {valid_columns}")
    
    # Sort profiles
    sorted_profiles = sorted(profiles_db, key=lambda x: getattr(x, by), reverse=(order == "desc"))
    
    # Add ranking and limit
    ranked_profiles = []
    for index, profile in enumerate(sorted_profiles[:limit], 1):
        profile_data = ProfileRanking(
            rank=index,
            username=profile.username,
            profile_name=profile.profile_name,
            followers_count=profile.followers_count,
            following_count=profile.following_count,
            posts_count=profile.posts_count,
            is_verified=profile.is_verified,
            is_private=profile.is_private,
            last_updated=profile.last_updated
        )
        ranked_profiles.append(profile_data)
    
    return ranked_profiles

@app.get("/api/profiles/{username}", response_model=Profile)
async def get_profile_by_username(username: str):
    """Get a specific profile by username"""
    for profile in profiles_db:
        if profile.username == username:
            return profile
    raise HTTPException(status_code=404, detail="Profile not found")

@app.post("/api/profiles/", response_model=Profile)
async def create_profile(profile: Profile):
    """Create a new profile"""
    profile.id = len(profiles_db) + 1
    profiles_db.append(profile)
    return profile

@app.post("/api/scraper/profile")
async def scrape_single_profile(request: dict):
    """Scrape a single Instagram profile using real Playwright scraping"""
    username = request.get("username", "").strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    
    try:
        # Use the async scraper directly
        async with InstagramScraper() as scraper:
            profile_data = await scraper.scrape_profile(username)
        
        if not profile_data:
            raise HTTPException(status_code=404, detail=f"Could not find or scrape profile: {username}")
        
        # Check if profile already exists
        existing_profile = next((p for p in profiles_db if p.username == username), None)
        
        if existing_profile:
            # Update existing profile
            existing_profile.profile_name = profile_data.get('display_name', '')
            existing_profile.followers_count = profile_data.get('followers', 0)
            existing_profile.following_count = profile_data.get('following', 0)
            existing_profile.posts_count = profile_data.get('posts', 0)
            existing_profile.bio = profile_data.get('bio', '')
            existing_profile.profile_pic_url = profile_data.get('profile_pic_url', '')
            existing_profile.is_verified = 1 if profile_data.get('is_verified', False) else 0
            existing_profile.is_private = 1 if profile_data.get('is_private', False) else 0
            existing_profile.last_updated = profile_data.get('fetched_at', "2024-01-01T00:00:00")
            action = "updated"
        else:
            # Create new profile
            profile = Profile(
                id=len(profiles_db) + 1,
                username=profile_data['username'],
                profile_name=profile_data.get('display_name', ''),
                followers_count=profile_data.get('followers', 0),
                following_count=profile_data.get('following', 0),
                posts_count=profile_data.get('posts', 0),
                bio=profile_data.get('bio', ''),
                profile_pic_url=profile_data.get('profile_pic_url', ''),
                is_verified=1 if profile_data.get('is_verified', False) else 0,
                is_private=1 if profile_data.get('is_private', False) else 0,
                last_updated=profile_data.get('fetched_at', "2024-01-01T00:00:00")
            )
            profiles_db.append(profile)
            action = "created"
        
        return {
            "success": True,
            "action": action,
            "profile": profile_data,
            "message": f"Profile {action} successfully with REAL data"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping profile: {str(e)}")

@app.post("/api/scraper/profiles/sync")
async def scrape_profiles_sync(request: dict):
    """Scrape multiple Instagram profiles using real scraper"""
    usernames = request.get("usernames", [])
    
    if not usernames:
        raise HTTPException(status_code=400, detail="No usernames provided")
    
        scraper = AdvancedProductionScraper()
    
    success_count = 0
    failed_count = 0
    results = []
    
    for username in usernames:
        try:
            # Scrape the profile
            profile_data = scraper.scrape_profile(username.strip())
            
            if profile_data:
                # Check if already exists
                existing = next((p for p in profiles_db if p.username == username), None)
                if existing:
                    # Update existing
                    for key, value in profile_data.items():
                        if key != "username":
                            setattr(existing, key, value)
                    results.append({"username": username, "action": "updated"})
                else:
                    # Create new
                    profile = Profile(
                        id=len(profiles_db) + 1,
                        username=profile_data['username'],
                        profile_name=profile_data.get('profile_name', ''),
                        followers_count=profile_data.get('followers_count', 0),
                        following_count=profile_data.get('following_count', 0),
                        posts_count=profile_data.get('posts_count', 0),
                        bio=profile_data.get('bio', ''),
                        profile_pic_url=profile_data.get('profile_pic_url', ''),
                        is_verified=profile_data.get('is_verified', 0),
                        is_private=profile_data.get('is_private', 0),
                        last_updated="2024-01-01T00:00:00"
                    )
                    profiles_db.append(profile)
                    results.append({"username": username, "action": "created"})
                success_count += 1
            else:
                failed_count += 1
                results.append({"username": username, "action": "failed", "error": "Could not scrape profile"})
                
        except Exception as e:
            failed_count += 1
            results.append({"username": username, "action": "failed", "error": str(e)})
    
    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "results": results
    }

@app.get("/api/scraper/status")
async def get_scraper_status():
    """Get scraper status"""
    return {
        "status": "active",
        "capabilities": [
            "Real-time Instagram profile scraping",
            "Followers/following/posts count",
            "Profile verification status",
            "Bio and profile picture extraction",
            "Single profile search and addition"
        ],
        "rate_limits": {
            "requests_per_minute": 20,
            "delay_between_requests": "2-5 seconds"
        },
        "note": "Real Instagram data scraping enabled"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
