import asyncio
import random
import time
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Browser, Page
from fake_useragent import UserAgent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstagramScraper:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.user_agent = UserAgent()
        self.delay_min = 2
        self.delay_max = 5
        
    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
            ]
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        await self.playwright.stop()
    
    async def _random_delay(self):
        """Random delay between requests"""
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)
    
    async def _create_page(self) -> Page:
        """Create a new page with anti-detection measures"""
        context = await self.browser.new_context(
            user_agent=self.user_agent.random,
            viewport={'width': 1366, 'height': 768},
            locale='en-US',
            timezone_id='America/New_York'
        )
        
        # Add stealth measures
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)
        
        page = await context.new_page()
        
        # Set extra headers
        await page.set_extra_http_headers({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        return page
    
    async def scrape_profile(self, username: str) -> Optional[Dict]:
        """Scrape Instagram profile data"""
        try:
            await self._random_delay()
            
            page = await self._create_page()
            
            # Navigate to profile
            profile_url = f"https://www.instagram.com/{username}/"
            logger.info(f"Scraping profile: {profile_url}")
            
            await page.goto(profile_url, wait_until='networkidle', timeout=30000)
            
            # Check if profile exists and is public
            await page.wait_for_timeout(3000)
            
            # Check for private account
            private_indicator = await page.query_selector('text="This Account is Private"')
            if private_indicator:
                logger.warning(f"Profile {username} is private")
                await page.close()
                return None
            
            # Check for account not found
            not_found = await page.query_selector('text="Sorry, this page isn\'t available."')
            if not_found:
                logger.warning(f"Profile {username} not found")
                await page.close()
                return None
            
            # Extract profile data
            profile_data = await self._extract_profile_data(page, username)
            
            await page.close()
            return profile_data
            
        except Exception as e:
            logger.error(f"Error scraping profile {username}: {str(e)}")
            return None
    
    async def _extract_profile_data(self, page: Page, username: str) -> Dict:
        """Extract profile data from the page"""
        try:
            # Wait for profile elements to load
            await page.wait_for_selector('article', timeout=10000)
            
            # Extract basic profile info
            profile_name = await self._extract_text(page, 'h2')
            
            # Extract bio
            bio_element = await page.query_selector('div[data-testid="user-bio"]')
            bio = await bio_element.inner_text() if bio_element else ""
            
            # Extract follower/following/posts counts
            stats = await self._extract_stats(page)
            
            # Extract profile picture URL
            profile_pic_element = await page.query_selector('img[data-testid="user-avatar"]')
            profile_pic_url = await profile_pic_element.get_attribute('src') if profile_pic_element else ""
            
            # Check if verified
            verified_element = await page.query_selector('svg[aria-label="Verified"]')
            is_verified = 1 if verified_element else 0
            
            # Calculate engagement rate (simplified)
            engagement_rate = 0.0
            if stats['posts_count'] > 0 and stats['followers_count'] > 0:
                # Get recent posts for engagement calculation
                recent_posts = await self._get_recent_posts_engagement(page)
                if recent_posts:
                    total_engagement = sum(post['likes'] + post['comments'] for post in recent_posts)
                    avg_engagement = total_engagement / len(recent_posts)
                    engagement_rate = (avg_engagement / stats['followers_count']) * 100
            
            profile_data = {
                'username': username,
                'profile_name': profile_name,
                'followers_count': stats['followers_count'],
                'following_count': stats['following_count'],
                'posts_count': stats['posts_count'],
                'engagement_rate': round(engagement_rate, 2),
                'bio': bio,
                'profile_pic_url': profile_pic_url,
                'is_verified': is_verified,
                'is_private': 0
            }
            
            logger.info(f"Successfully scraped {username}: {stats['followers_count']} followers")
            return profile_data
            
        except Exception as e:
            logger.error(f"Error extracting profile data for {username}: {str(e)}")
            return {
                'username': username,
                'profile_name': None,
                'followers_count': 0,
                'following_count': 0,
                'posts_count': 0,
                'engagement_rate': 0.0,
                'bio': "",
                'profile_pic_url': "",
                'is_verified': 0,
                'is_private': 0
            }
    
    async def _extract_text(self, page: Page, selector: str) -> Optional[str]:
        """Extract text from element"""
        try:
            element = await page.query_selector(selector)
            return await element.inner_text() if element else None
        except:
            return None
    
    async def _extract_stats(self, page: Page) -> Dict:
        """Extract follower, following, and posts count"""
        stats = {
            'followers_count': 0,
            'following_count': 0,
            'posts_count': 0
        }
        
        try:
            # Find stats section
            stats_section = await page.query_selector('section main div')
            if not stats_section:
                return stats
            
            # Extract follower count
            followers_text = await self._extract_text(page, 'a[href*="/followers/"] span')
            if followers_text:
                stats['followers_count'] = self._parse_count(followers_text)
            
            # Extract following count
            following_text = await self._extract_text(page, 'a[href*="/following/"] span')
            if following_text:
                stats['following_count'] = self._parse_count(following_text)
            
            # Extract posts count
            posts_text = await self._extract_text(page, 'div[role="tablist"] span')
            if posts_text and 'posts' in posts_text.lower():
                stats['posts_count'] = self._parse_count(posts_text)
            
        except Exception as e:
            logger.error(f"Error extracting stats: {str(e)}")
        
        return stats
    
    async def _get_recent_posts_engagement(self, page: Page, limit: int = 9) -> List[Dict]:
        """Get engagement data from recent posts"""
        posts = []
        try:
            # Find post elements
            post_elements = await page.query_selector_all('article div[role="button"]')
            
            for i, post_element in enumerate(post_elements[:limit]):
                try:
                    # Click on post to open it
                    await post_element.click()
                    await page.wait_for_timeout(1000)
                    
                    # Extract likes and comments
                    likes_element = await page.query_selector('section span[aria-label*="like"]')
                    comments_element = await page.query_selector('section span[aria-label*="comment"]')
                    
                    likes = 0
                    comments = 0
                    
                    if likes_element:
                        likes_text = await likes_element.inner_text()
                        likes = self._parse_count(likes_text)
                    
                    if comments_element:
                        comments_text = await comments_element.inner_text()
                        comments = self._parse_count(comments_text)
                    
                    posts.append({'likes': likes, 'comments': comments})
                    
                    # Close the post
                    await page.keyboard.press('Escape')
                    await page.wait_for_timeout(500)
                    
                except Exception as e:
                    logger.error(f"Error extracting post {i}: {str(e)}")
                    continue
            
        except Exception as e:
            logger.error(f"Error getting recent posts: {str(e)}")
        
        return posts
    
    def _parse_count(self, text: str) -> int:
        """Parse count text (e.g., '1.2M' -> 1200000)"""
        if not text:
            return 0
        
        text = text.replace(',', '').replace('.', '')
        
        if 'K' in text.upper():
            return int(float(text.replace('K', '').replace('k', '')) * 1000)
        elif 'M' in text.upper():
            return int(float(text.replace('M', '').replace('m', '')) * 1000000)
        elif 'B' in text.upper():
            return int(float(text.replace('B', '').replace('b', '')) * 1000000000)
        else:
            try:
                return int(text)
            except:
                return 0
    
    async def scrape_multiple_profiles(self, usernames: List[str]) -> List[Dict]:
        """Scrape multiple profiles"""
        results = []
        
        for username in usernames:
            try:
                profile_data = await self.scrape_profile(username)
                if profile_data:
                    results.append(profile_data)
                await self._random_delay()
            except Exception as e:
                logger.error(f"Error scraping {username}: {str(e)}")
                continue
        
        return results
