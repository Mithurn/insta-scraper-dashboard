from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    profile_name = Column(String(255), nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    bio = Column(Text, nullable=True)
    profile_pic_url = Column(String(500), nullable=True)
    is_verified = Column(Integer, default=0)  # 0 = not verified, 1 = verified
    is_private = Column(Integer, default=0)   # 0 = public, 1 = private
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship with posts
    posts = relationship("Post", back_populates="profile", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Profile(username='{self.username}', followers={self.followers_count})>"
