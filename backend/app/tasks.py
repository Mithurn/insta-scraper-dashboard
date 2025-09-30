from celery import current_task
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.profile import Profile
from app.scraper.instagram_scraper import InstagramScraper
import asyncio
import logging

logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@current_task.task(bind=True)
def scrape_all_profiles(self):
    """Celery task to scrape all profiles in the database"""
    try:
        logger.info("Starting scheduled scrape of all profiles")
        
        # Get all existing profiles
        db = SessionLocal()
        try:
            profiles = db.query(Profile).all()
            usernames = [profile.username for profile in profiles]
            
            if not usernames:
                logger.info("No profiles found to scrape")
                return {"status": "success", "message": "No profiles to scrape", "count": 0}
            
            logger.info(f"Found {len(usernames)} profiles to scrape")
            
            # Run the scraping
            result = asyncio.run(scrape_and_update_profiles(usernames))
            
            logger.info(f"Scheduled scrape completed: {result}")
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in scheduled scrape: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

@current_task.task(bind=True)
def scrape_profiles_task(self, usernames):
    """Celery task to scrape specific profiles"""
    try:
        logger.info(f"Starting scrape task for {len(usernames)} profiles")
        
        # Run the scraping
        result = asyncio.run(scrape_and_update_profiles(usernames))
        
        logger.info(f"Scrape task completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in scrape task: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

async def scrape_and_update_profiles(usernames):
    """Helper function to scrape profiles and update database"""
    success_count = 0
    failed_count = 0
    results = []
    
    async with InstagramScraper() as scraper:
        scraped_data = await scraper.scrape_multiple_profiles(usernames)
        
        db = SessionLocal()
        try:
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
                    logger.error(f"Error storing profile {profile_data['username']}: {str(e)}")
                    db.rollback()
                    failed_count += 1
                    results.append({"username": profile_data['username'], "action": "failed", "error": str(e)})
                    continue
            
            # Count failed profiles (those not in scraped_data)
            scraped_usernames = [p['username'] for p in scraped_data]
            failed_usernames = [u for u in usernames if u not in scraped_usernames]
            failed_count += len(failed_usernames)
            
            for username in failed_usernames:
                results.append({"username": username, "action": "failed", "error": "Profile not found or private"})
            
        finally:
            db.close()
    
    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "results": results
    }
