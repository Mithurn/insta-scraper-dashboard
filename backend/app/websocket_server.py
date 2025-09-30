import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Set, Any
import redis.asyncio as redis
from fastapi import WebSocket, WebSocketDisconnect
from app.scraper import InstagramScraper

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis_client: Optional[redis.Redis] = None
        self.scraper: Optional[InstagramScraper] = None
        self.scraping_task: Optional[asyncio.Task] = None
        self.usernames: List[str] = []
        self.poll_interval: int = 60
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        
        # Send initial data
        await self.send_initial_data(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
            
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def send_initial_data(self, websocket: WebSocket):
        """Send initial data from Redis to new connection"""
        if not self.redis_client:
            return
            
        try:
            initial_data = {
                "type": "initial",
                "data": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Get all profile data from Redis
            for username in self.usernames:
                key = f"ig:{username}"
                data = await self.redis_client.get(key)
                if data:
                    profile_data = json.loads(data)
                    initial_data["data"][username] = profile_data
            
            await self.send_personal_message(json.dumps(initial_data), websocket)
            
        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
    
    async def setup_redis(self):
        """Setup Redis connection"""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        
        # Test connection
        await self.redis_client.ping()
        logger.info("Redis connected successfully")
    
    async def setup_scraper(self):
        """Setup scraper configuration"""
        # Get usernames from environment
        usernames_str = os.getenv("PROFILE_USERNAMES", "")
        if usernames_str:
            self.usernames = [u.strip() for u in usernames_str.split(",") if u.strip()]
        else:
            # Default usernames for testing
            self.usernames = ["cristiano", "leomessi", "selenagomez", "therock", "kyliejenner"]
        
        # Get poll interval
        self.poll_interval = int(os.getenv("POLL_INTERVAL", "60"))
        
        logger.info(f"Configured to scrape {len(self.usernames)} profiles every {self.poll_interval} seconds")
        logger.info(f"Usernames: {self.usernames}")
    
    async def start_scraping_loop(self):
        """Start the background scraping loop"""
        if self.scraping_task and not self.scraping_task.done():
            return
            
        self.scraping_task = asyncio.create_task(self._scraping_loop())
        logger.info("Started scraping loop")
    
    async def stop_scraping_loop(self):
        """Stop the background scraping loop"""
        if self.scraping_task:
            self.scraping_task.cancel()
            try:
                await self.scraping_task
            except asyncio.CancelledError:
                pass
            logger.info("Stopped scraping loop")
    
    async def _scraping_loop(self):
        """Main scraping loop"""
        while True:
            try:
                await self._scrape_all_profiles()
                await asyncio.sleep(self.poll_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scraping loop: {e}")
                await asyncio.sleep(30)  # Wait before retrying
    
    async def _scrape_all_profiles(self):
        """Scrape all profiles and check for changes"""
        if not self.usernames or not self.redis_client:
            return
            
        logger.info("Starting scraping cycle...")
        
        async with InstagramScraper() as scraper:
            results = await scraper.scrape_multiple_profiles(self.usernames)
            
            for username, profile_data in results.items():
                await self._process_profile_update(username, profile_data)
        
        logger.info("Scraping cycle completed")
    
    async def _process_profile_update(self, username: str, new_data: Dict[str, Any]):
        """Process profile update and broadcast if changed"""
        if not self.redis_client:
            return
            
        key = f"ig:{username}"
        
        # Get old data
        old_data_str = await self.redis_client.get(key)
        old_data = json.loads(old_data_str) if old_data_str else {}
        
        # Store new data
        await self.redis_client.set(key, json.dumps(new_data))
        
        # Check for changes
        changes = self._detect_changes(old_data, new_data)
        
        if changes:
            # Broadcast update
            update_message = {
                "type": "update",
                "username": username,
                "changed": changes,
                "snapshot": new_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.broadcast(json.dumps(update_message))
            logger.info(f"Broadcasted update for {username}: {changes}")
    
    def _detect_changes(self, old_data: Dict[str, Any], new_data: Dict[str, Any]) -> List[str]:
        """Detect what changed between old and new data"""
        changes = []
        
        # Check key metrics
        metrics = ['followers', 'following', 'posts', 'display_name', 'bio']
        
        for metric in metrics:
            if metric in old_data and metric in new_data:
                if old_data[metric] != new_data[metric]:
                    changes.append(metric)
            elif metric in new_data:
                changes.append(metric)
        
        # Check latest posts
        old_posts = old_data.get('latest_posts', [])
        new_posts = new_data.get('latest_posts', [])
        
        if old_posts != new_posts:
            changes.append('latest_posts')
        
        return changes
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.stop_scraping_loop()
        if self.redis_client:
            await self.redis_client.close()

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
