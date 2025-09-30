from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    post_url = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)  # For videos
    post_date = Column(DateTime(timezone=True), nullable=True)
    post_type = Column(String(50), nullable=True)  # 'image', 'video', 'carousel'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship with profile
    profile = relationship("Profile", back_populates="posts")

    def __repr__(self):
        return f"<Post(profile_id={self.profile_id}, likes={self.likes_count})>"
