from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import asyncio
from sqlalchemy.orm import Session
from scraper.advanced_production_scraper import AdvancedProductionScraper
from database import get_db, engine, Base
from models.profile import Profile as ProfileModel

# Create database tables
Base.metadata.create_all(bind=engine)

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
    engagement_rate: float = 0.0
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    is_verified: int = 0
    is_private: int = 0
    last_updated: str = "2024-01-01T00:00:00"

class ProfileRanking(BaseModel):
    rank: int
    profile: Profile
    change: Optional[str] = None

app = FastAPI(
    title="Instagram Analytics API",
    description="API for Instagram profile analytics and scraping",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/profiles/", response_model=List[Profile])
async def get_all_profiles(db: Session = Depends(get_db)):
    """Get all profiles"""
    profiles = db.query(ProfileModel).all()
    return [
        {
            "id": profile.id,
            "username": profile.username,
            "profile_name": profile.profile_name,
            "followers_count": profile.followers_count,
            "following_count": profile.following_count,
            "posts_count": profile.posts_count,
            "engagement_rate": profile.engagement_rate,
            "bio": profile.bio,
            "profile_pic_url": profile.profile_pic_url,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
            "last_updated": profile.last_updated.isoformat() if profile.last_updated else "2024-01-01T00:00:00"
        }
        for profile in profiles
    ]

@app.post("/api/scraper/profile")
async def scrape_single_profile(request: dict, db: Session = Depends(get_db)):
    """Scrape a single Instagram profile and store it"""
    username = request.get("username", "").strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    
    scraper = AdvancedProductionScraper()
    
    try:
        # Scrape the profile
        profile_data = scraper.scrape_profile(username)
        
        if not profile_data:
            raise HTTPException(status_code=404, detail=f"Could not find or scrape profile: {username}")
        
        # Check if profile already exists in database
        existing_profile = db.query(ProfileModel).filter(ProfileModel.username == username).first()
        
        if existing_profile:
            # Update existing profile
            existing_profile.followers_count = profile_data.get('followers', 0)
            existing_profile.following_count = profile_data.get('following', 0)
            existing_profile.posts_count = profile_data.get('posts', 0)
            existing_profile.bio = profile_data.get('bio', '')
            existing_profile.profile_name = profile_data.get('display_name', username)
            db.commit()
            action = "updated"
        else:
            # Create new profile
            new_profile = ProfileModel(
                username=username,
                profile_name=profile_data.get('display_name', username),
                followers_count=profile_data.get('followers', 0),
                following_count=profile_data.get('following', 0),
                posts_count=profile_data.get('posts', 0),
                engagement_rate=0.0,
                bio=profile_data.get('bio', ''),
                profile_pic_url='',
                is_verified=0,
                is_private=0
            )
            db.add(new_profile)
            db.commit()
            db.refresh(new_profile)
            action = "created"
        
        return {
            "success": True,
            "action": action,
            "profile": profile_data,
            "message": f"Profile {action} successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping profile: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
