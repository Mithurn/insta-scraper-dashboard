import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Browser, Page
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstagramScraper:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    def _parse_number(self, text: str) -> int:
        """Convert Instagram number format to integer (123k -> 123000, 1.2m -> 1200000)"""
        if not text:
            return 0
            
        # Remove commas and spaces
        text = text.replace(',', '').replace(' ', '').lower()
        
        # Handle different formats
        if 'k' in text:
            number = float(text.replace('k', ''))
            return int(number * 1000)
        elif 'm' in text:
            number = float(text.replace('m', ''))
            return int(number * 1000000)
        elif 'b' in text:
            number = float(text.replace('b', ''))
            return int(number * 1000000000)
        else:
            try:
                return int(float(text))
            except (ValueError, TypeError):
                return 0
    
    def _extract_profile_data(self, page_content: str, username: str) -> Optional[Dict]:
        """Extract profile data from page content"""
        try:
            # Look for JSON data in script tags
            import re
            
            # Pattern to find window._sharedData
            pattern = r'window\._sharedData\s*=\s*({.*?});'
            match = re.search(pattern, page_content, re.DOTALL)
            
            if match:
                try:
                    data = json.loads(match.group(1))
                    
                    if 'entry_data' in data and 'ProfilePage' in data['entry_data']:
                        profile_data = data['entry_data']['ProfilePage'][0]['graphql']['user']
                        
                        # Extract followers count
                        followers_count = profile_data.get('edge_followed_by', {}).get('count', 0)
                        following_count = profile_data.get('edge_follow', {}).get('count', 0)
                        posts_count = profile_data.get('edge_owner_to_timeline_media', {}).get('count', 0)
                        
                        # Get latest posts (up to 6)
                        latest_posts = []
                        if 'edge_owner_to_timeline_media' in profile_data:
                            edges = profile_data['edge_owner_to_timeline_media'].get('edges', [])
                            for edge in edges[:6]:  # Limit to 6 posts
                                node = edge.get('node', {})
                                post_data = {
                                    'url': f"https://www.instagram.com/p/{node.get('shortcode', '')}/",
                                    'thumbnail': node.get('thumbnail_src', ''),
                                    'likes': node.get('edge_liked_by', {}).get('count', 0),
                                    'comments': node.get('edge_media_to_comment', {}).get('count', 0),
                                    'is_video': node.get('is_video', False),
                                    'timestamp': node.get('taken_at_timestamp', 0)
                                }
                                latest_posts.append(post_data)
                        
                        return {
                            'username': profile_data.get('username', username),
                            'display_name': profile_data.get('full_name', ''),
                            'bio': profile_data.get('biography', ''),
                            'followers': followers_count,
                            'following': following_count,
                            'posts': posts_count,
                            'is_verified': profile_data.get('is_verified', False),
                            'is_private': profile_data.get('is_private', False),
                            'profile_pic_url': profile_data.get('profile_pic_url_hd', '') or profile_data.get('profile_pic_url', ''),
                            'latest_posts': latest_posts,
                            'fetched_at': datetime.now().isoformat()
                        }
                except (json.JSONDecodeError, KeyError, IndexError) as e:
                    logger.debug(f"Failed to parse JSON data: {e}")
                    return None
            
            # Fallback: try to extract from meta tags
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(page_content, 'html.parser')
            
            # Look for meta tags
            title = soup.find('meta', property='og:title')
            description = soup.find('meta', property='og:description')
            image = soup.find('meta', property='og:image')
            
            if title and description:
                # Try to extract numbers from description
                desc_text = description.get('content', '')
                
                # Look for follower patterns in description
                follower_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:followers?|follower)', desc_text, re.IGNORECASE)
                following_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:following)', desc_text, re.IGNORECASE)
                post_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:posts?|post)', desc_text, re.IGNORECASE)
                
                followers = self._parse_number(follower_match.group(1)) if follower_match else 0
                following = self._parse_number(following_match.group(1)) if following_match else 0
                posts = self._parse_number(post_match.group(1)) if post_match else 0
                
                return {
                    'username': username,
                    'display_name': title.get('content', ''),
                    'bio': desc_text,
                    'followers': followers,
                    'following': following,
                    'posts': posts,
                    'is_verified': False,
                    'is_private': False,
                    'profile_pic_url': image.get('content', '') if image else '',
                    'latest_posts': [],
                    'fetched_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error extracting profile data: {e}")
            return None
        
        return None
    
    async def scrape_profile(self, username: str) -> Optional[Dict]:
        """Scrape a single Instagram profile using Playwright"""
        if not username:
            return None
            
        username = username.strip().lower()
        logger.info(f"🔍 SCRAPING: {username}")
        
        try:
            # Create a new page
        page = await self.browser.new_page()
            
            # Set realistic user agent
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            
            # Navigate to profile
            url = f"https://www.instagram.com/{username}/"
            logger.info(f"🌐 Navigating to: {url}")
            
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for content to load
            await page.wait_for_timeout(3000)
            
            # Get page content
            content = await page.content()
            
            # Extract profile data
            profile_data = self._extract_profile_data(content, username)
            
            if profile_data:
                logger.info(f"✅ SUCCESS: Scraped {username} - {profile_data['followers']} followers")
                return profile_data
            else:
                logger.warning(f"❌ FAILED: Could not extract data for {username}")
                return None
                
        except Exception as e:
            logger.error(f"❌ ERROR scraping {username}: {e}")
            return None
        finally:
            if 'page' in locals():
                await page.close()
    
    async def scrape_multiple_profiles(self, usernames: List[str]) -> Dict[str, Optional[Dict]]:
        """Scrape multiple profiles"""
        results = {}
        
        for username in usernames:
            try:
                result = await self.scrape_profile(username)
                results[username] = result
                
                # Add delay between requests
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error scraping {username}: {e}")
                results[username] = None
        
        return results

# Synchronous wrapper for compatibility
class InstagramScraperSync:
    def __init__(self):
        self.scraper = InstagramScraper()
    
    def scrape_profile(self, username: str) -> Optional[Dict]:
        """Synchronous wrapper for scrape_profile"""
        async def _scrape():
            async with self.scraper as scraper:
                return await scraper.scrape_profile(username)
        
        return asyncio.run(_scrape())
    
    def scrape_multiple_profiles(self, usernames: List[str]) -> Dict[str, Optional[Dict]]:
        """Synchronous wrapper for scrape_multiple_profiles"""
        async def _scrape():
            async with self.scraper as scraper:
                return await scraper.scrape_multiple_profiles(usernames)
        
        return asyncio.run(_scrape())