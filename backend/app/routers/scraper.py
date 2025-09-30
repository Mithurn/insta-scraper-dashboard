from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict
from pydantic import BaseModel
from app.database import get_db
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate
from app.scraper.real_instagram_scraper import RealInstagramScraper
import asyncio

router = APIRouter()

class ScrapeRequest(BaseModel):
    usernames: List[str]

class SingleProfileRequest(BaseModel):
    username: str

class ScrapeResponse(BaseModel):
    success_count: int
    failed_count: int
    results: List[Dict]

@router.post("/profile", response_model=Dict)
async def scrape_single_profile(
    request: SingleProfileRequest,
    db: Session = Depends(get_db)
):
    """Scrape a single Instagram profile and store it in database"""
    
    if not request.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    
    scraper = RealInstagramScraper()
    
    try:
        # Scrape the profile
        profile_data = scraper.scrape_profile(request.username.strip())
        
        if not profile_data:
            raise HTTPException(status_code=404, detail=f"Could not find or scrape profile: {request.username}")
        
        # Check if profile already exists
        existing_profile = db.query(Profile).filter(
            Profile.username == profile_data['username']
        ).first()
        
        if existing_profile:
            # Update existing profile
            for key, value in profile_data.items():
                if key != 'username':
                    setattr(existing_profile, key, value)
            action = "updated"
        else:
            # Create new profile
            new_profile = Profile(**profile_data)
            db.add(new_profile)
            action = "created"
        
        db.commit()
        
        return {
            "success": True,
            "action": action,
            "profile": profile_data,
            "message": f"Profile {action} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error scraping profile: {str(e)}")

@router.post("/profiles", response_model=ScrapeResponse)
async def scrape_profiles(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Scrape Instagram profiles and store them in database"""
    
    if len(request.usernames) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 usernames allowed per request")
    
    # Start scraping in background
    background_tasks.add_task(scrape_and_store_profiles, request.usernames, db)
    
    return ScrapeResponse(
        success_count=0,
        failed_count=0,
        results=[],
        message="Scraping started in background"
    )

async def scrape_and_store_profiles(usernames: List[str], db: Session):
    """Background task to scrape profiles and store in database"""
    scraper = RealInstagramScraper()
    scraped_data = scraper.scrape_multiple_profiles(usernames)
        
        for profile_data in scraped_data:
            try:
                # Check if profile already exists
                existing_profile = db.query(Profile).filter(
                    Profile.username == profile_data['username']
                ).first()
                
                if existing_profile:
                    # Update existing profile
                    for key, value in profile_data.items():
                        if key != 'username':
                            setattr(existing_profile, key, value)
                else:
                    # Create new profile
                    new_profile = Profile(**profile_data)
                    db.add(new_profile)
                
                db.commit()
                
            except Exception as e:
                print(f"Error storing profile {profile_data['username']}: {str(e)}")
                db.rollback()
                continue

@router.post("/profiles/sync", response_model=ScrapeResponse)
async def scrape_profiles_sync(
    request: ScrapeRequest,
    db: Session = Depends(get_db)
):
    """Scrape Instagram profiles synchronously (for immediate results)"""
    
    if len(request.usernames) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 usernames allowed for sync requests")
    
    scraper = RealInstagramScraper()
    scraped_data = scraper.scrape_multiple_profiles(request.usernames)
        
        success_count = 0
        failed_count = len(request.usernames) - len(scraped_data)
        results = []
        
        for profile_data in scraped_data:
            try:
                # Check if profile already exists
                existing_profile = db.query(Profile).filter(
                    Profile.username == profile_data['username']
                ).first()
                
                if existing_profile:
                    # Update existing profile
                    for key, value in profile_data.items():
                        if key != 'username':
                            setattr(existing_profile, key, value)
                    results.append({"username": profile_data['username'], "action": "updated"})
                else:
                    # Create new profile
                    new_profile = Profile(**profile_data)
                    db.add(new_profile)
                    results.append({"username": profile_data['username'], "action": "created"})
                
                db.commit()
                success_count += 1
                
            except Exception as e:
                print(f"Error storing profile {profile_data['username']}: {str(e)}")
                db.rollback()
                failed_count += 1
                results.append({"username": profile_data['username'], "action": "failed", "error": str(e)})
        
        return ScrapeResponse(
            success_count=success_count,
            failed_count=failed_count,
            results=results
        )

@router.post("/update-all")
async def update_all_profiles(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Update all existing profiles in database"""
    
    # Get all existing usernames
    profiles = db.query(Profile).all()
    usernames = [profile.username for profile in profiles]
    
    if not usernames:
        raise HTTPException(status_code=404, detail="No profiles found to update")
    
    # Start scraping in background
    background_tasks.add_task(scrape_and_store_profiles, usernames, db)
    
    return {"message": f"Started updating {len(usernames)} profiles", "count": len(usernames)}

@router.get("/status")
async def get_scraper_status():
    """Get scraper status and capabilities"""
    return {
        "status": "active",
        "capabilities": [
            "Public profile scraping",
            "Followers/following/posts count",
            "Engagement rate calculation",
            "Profile verification status",
            "Bio and profile picture extraction"
        ],
        "rate_limits": {
            "requests_per_minute": 20,
            "delay_between_requests": "2-5 seconds"
        }
    }
