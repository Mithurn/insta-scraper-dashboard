from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostBase(BaseModel):
    post_url: str
    caption: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    post_date: Optional[datetime] = None
    post_type: Optional[str] = None

class PostCreate(PostBase):
    profile_id: int

class PostUpdate(BaseModel):
    caption: Optional[str] = None
    likes_count: Optional[int] = None
    comments_count: Optional[int] = None
    views_count: Optional[int] = None
    post_date: Optional[datetime] = None
    post_type: Optional[str] = None

class Post(PostBase):
    id: int
    profile_id: int
    created_at: datetime

    class Config:
        from_attributes = True
