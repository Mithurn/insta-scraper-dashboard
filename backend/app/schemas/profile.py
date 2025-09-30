from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .post import PostBase

class ProfileBase(BaseModel):
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

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    profile_name: Optional[str] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    posts_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    is_verified: Optional[int] = None
    is_private: Optional[int] = None

class Profile(ProfileBase):
    id: int
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileWithPosts(Profile):
    posts: List[PostBase] = []

class ProfileRanking(BaseModel):
    rank: int
    username: str
    profile_name: Optional[str] = None
    followers_count: int
    following_count: int
    posts_count: int
    engagement_rate: float
    is_verified: int
    last_updated: datetime
