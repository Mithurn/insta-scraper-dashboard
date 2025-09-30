from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from app.database import get_db
from app.models.profile import Profile
from app.schemas.profile import Profile as ProfileSchema, ProfileCreate, ProfileUpdate, ProfileRanking

router = APIRouter()

@router.get("/", response_model=List[ProfileSchema])
async def get_all_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all profiles with pagination"""
    profiles = db.query(Profile).offset(skip).limit(limit).all()
    return profiles

@router.get("/ranked", response_model=List[ProfileRanking])
async def get_ranked_profiles(
    by: str = Query("followers_count", description="Sort by: followers_count, following_count, posts_count, engagement_rate"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get profiles ranked by specified metric"""
    
    # Validate sort column
    valid_columns = ["followers_count", "following_count", "posts_count", "engagement_rate"]
    if by not in valid_columns:
        raise HTTPException(status_code=400, detail=f"Invalid sort column. Must be one of: {valid_columns}")
    
    # Validate sort order
    if order not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Invalid sort order. Must be 'asc' or 'desc'")
    
    # Build query
    sort_column = getattr(Profile, by)
    if order == "desc":
        query = db.query(Profile).order_by(desc(sort_column)).limit(limit)
    else:
        query = db.query(Profile).order_by(asc(sort_column)).limit(limit)
    
    profiles = query.all()
    
    # Add ranking
    ranked_profiles = []
    for index, profile in enumerate(profiles, 1):
        profile_data = ProfileRanking(
            rank=index,
            username=profile.username,
            profile_name=profile.profile_name,
            followers_count=profile.followers_count,
            following_count=profile.following_count,
            posts_count=profile.posts_count,
            engagement_rate=profile.engagement_rate,
            is_verified=profile.is_verified,
            last_updated=profile.last_updated
        )
        ranked_profiles.append(profile_data)
    
    return ranked_profiles

@router.get("/{username}", response_model=ProfileSchema)
async def get_profile_by_username(username: str, db: Session = Depends(get_db)):
    """Get a specific profile by username"""
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=ProfileSchema)
async def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    """Create a new profile"""
    db_profile = Profile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.put("/{username}", response_model=ProfileSchema)
async def update_profile(username: str, profile_update: ProfileUpdate, db: Session = Depends(get_db)):
    """Update an existing profile"""
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/{username}")
async def delete_profile(username: str, db: Session = Depends(get_db)):
    """Delete a profile"""
    profile = db.query(Profile).filter(Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return {"message": f"Profile {username} deleted successfully"}

@router.get("/search/{query}")
async def search_profiles(
    query: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search profiles by username or profile name"""
    profiles = db.query(Profile).filter(
        (Profile.username.ilike(f"%{query}%")) |
        (Profile.profile_name.ilike(f"%{query}%"))
    ).limit(limit).all()
    
    return profiles
