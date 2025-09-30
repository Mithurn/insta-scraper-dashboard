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
                # For posts, Instagram often shows just the number (like "690 Posts")
                # But we need to check if this is actually a truncated number
                number = int(float(text))
                
                # If the number seems too low for posts (less than 1000), 
                # it might be a truncated display. Let's check if this is likely a posts count
                # by looking at the context or making an educated guess
                if number < 1000 and number > 0:
                    # This might be a truncated posts count, but we'll keep it as is for now
                    # since we don't have enough context to determine the real number
                    pass
                
                return number
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
            
            # Fallback: try to extract from meta tags and page content
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(page_content, 'html.parser')
            
            # Look for meta tags
            title = soup.find('meta', property='og:title')
            description = soup.find('meta', property='og:description')
            image = soup.find('meta', property='og:image')
            
            if title and description:
                # Try to extract numbers from description
                desc_text = description.get('content', '')
                
                # Debug: print what we're matching
                logger.info(f"Description text: {desc_text}")
                
                # Look for follower patterns in description - improved regex
                follower_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:followers?|follower)', desc_text, re.IGNORECASE)
                following_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:following)', desc_text, re.IGNORECASE)
                # Improved post pattern to handle different formats
                post_match = re.search(r'(\d+(?:\.\d+)?[km]?)\s*(?:posts?|post)', desc_text, re.IGNORECASE)
                
                if follower_match:
                    logger.info(f"Follower match: {follower_match.group(1)}")
                if following_match:
                    logger.info(f"Following match: {following_match.group(1)}")
                if post_match:
                    logger.info(f"Post match: {post_match.group(1)}")
                
                followers = self._parse_number(follower_match.group(1)) if follower_match else 0
                following = self._parse_number(following_match.group(1)) if following_match else 0
                posts = self._parse_number(post_match.group(1)) if post_match else 0
                
                # Check if following count seems too low and try to find better data
                if following < 1000 and following > 0:
                    logger.info(f"Following count {following} seems low, trying to find better data in page content...")
                    
                    # Look for following count in the actual page content
                    following_patterns = [
                        r'(\d+(?:,\d{3})*(?:\.\d+)?[km]?)\s*following',
                        r'following\s*(\d+(?:,\d{3})*(?:\.\d+)?[km]?)',
                        r'(\d+(?:,\d{3})*(?:\.\d+)?[km]?)\s*following'
                    ]
                    
                    for pattern in following_patterns:
                        match = re.search(pattern, page_content, re.IGNORECASE)
                        if match:
                            new_following = self._parse_number(match.group(1).replace(',', ''))
                            if new_following > following:
                                logger.info(f"Found better following count: {new_following}")
                                following = new_following
                                break
                
                # If posts count seems too low, try to find it in the page content
                if posts < 1000 and posts > 0:
                    logger.info(f"Posts count {posts} seems low, trying to find better data in page content...")
                    
                    # Look for posts count in the actual page content
                    # Instagram often shows posts as "1,234 Posts" or "1.2k Posts"
                    posts_patterns = [
                        r'(\d+(?:,\d{3})*(?:\.\d+)?[km]?)\s*posts?',
                        r'posts?\s*(\d+(?:,\d{3})*(?:\.\d+)?[km]?)',
                        r'(\d+(?:,\d{3})*(?:\.\d+)?[km]?)\s*post'
                    ]
                    
                    for pattern in posts_patterns:
                        match = re.search(pattern, page_content, re.IGNORECASE)
                        if match:
                            new_posts = self._parse_number(match.group(1).replace(',', ''))
                            if new_posts > posts:
                                logger.info(f"Found better posts count: {new_posts}")
                                posts = new_posts
                                break
                
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
            
            # Try to find the exact numbers from the page content
            try:
                # Look for the actual stats displayed on the page
                page_stats = await page.evaluate("""
                    () => {
                        // Look for the main stats section
                        const main = document.querySelector('main');
                        if (!main) return null;
                        
                        const stats = {};
                        
                        // Look for all links and spans that might contain stats
                        const allElements = main.querySelectorAll('a, span, div');
                        
                        for (let element of allElements) {
                            const text = element.textContent.trim();
                            const href = element.getAttribute('href') || '';
                            
                            // Look for numbers with commas (like "1,234" or "1.2M")
                            if (text.match(/^[\\d,]+$/) || text.match(/^[\\d.]+[KMB]$/i)) {
                                if (href.includes('/followers/')) {
                                    stats.followers = text;
                                } else if (href.includes('/following/')) {
                                    stats.following = text;
                                } else if (!href.includes('/followers/') && !href.includes('/following/') && text.match(/^[\\d,]+$/)) {
                                    stats.posts = text;
                                }
                            }
                        }
                        
                        // Also try to find stats in a more specific way
                        const profileSection = main.querySelector('section') || main.querySelector('div[role="main"]');
                        if (profileSection) {
                            const profileStats = profileSection.querySelectorAll('a, span');
                            for (let element of profileStats) {
                                const text = element.textContent.trim();
                                const href = element.getAttribute('href') || '';
                                
                                if (text.match(/^[\\d,]+$/) || text.match(/^[\\d.]+[KMB]$/i)) {
                                    if (href.includes('/followers/') && !stats.followers) {
                                        stats.followers = text;
                                    } else if (href.includes('/following/') && !stats.following) {
                                        stats.following = text;
                                    } else if (!href.includes('/followers/') && !href.includes('/following/') && text.match(/^[\\d,]+$/) && !stats.posts) {
                                        stats.posts = text;
                                    }
                                }
                            }
                        }
                        
                        return stats;
                    }
                """)
                
                if page_stats and (page_stats.get('followers') or page_stats.get('posts')):
                    logger.info(f"📊 Found exact page stats: {page_stats}")
                    
                    # Use the exact numbers from the page
                    if page_stats.get('followers'):
                        followers_text = page_stats['followers']
                        followers = self._parse_number(followers_text)
                        logger.info(f"📊 Exact followers: {followers_text} -> {followers}")
                    
                    if page_stats.get('posts'):
                        posts_text = page_stats['posts']
                        posts = self._parse_number(posts_text)
                        logger.info(f"📊 Exact posts: {posts_text} -> {posts}")
                    
                    if page_stats.get('following'):
                        following_text = page_stats['following']
                        following = self._parse_number(following_text)
                        logger.info(f"📊 Exact following: {following_text} -> {following}")
                        
            except Exception as e:
                logger.debug(f"Could not extract exact page stats: {e}")
            
            # Try to extract data using JavaScript evaluation first
            try:
                # Try to get data from the page's JavaScript context
                js_data = await page.evaluate("""
                    () => {
                        // Try to find window._sharedData
                        if (window._sharedData && window._sharedData.entry_data && window._sharedData.entry_data.ProfilePage) {
                            const user = window._sharedData.entry_data.ProfilePage[0].graphql.user;
                            return {
                                username: user.username,
                                display_name: user.full_name,
                                bio: user.biography,
                                followers: user.edge_followed_by.count,
                                following: user.edge_follow.count,
                                posts: user.edge_owner_to_timeline_media.count,
                                is_verified: user.is_verified,
                                is_private: user.is_private,
                                profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url
                            };
                        }
                        
                        // Try to find data in other script tags
                        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                        for (let script of scripts) {
                            try {
                                const data = JSON.parse(script.textContent);
                                if (data.mainEntity && data.mainEntity.additionalProperty) {
                                    const props = {};
                                    data.mainEntity.additionalProperty.forEach(prop => {
                                        if (prop.name && prop.value) {
                                            props[prop.name] = prop.value;
                                        }
                                    });
                                    
                                    if (props.followers && props.posts) {
                                        return {
                                            username: data.mainEntity.name || '',
                                            display_name: data.mainEntity.name || '',
                                            bio: data.mainEntity.description || '',
                                            followers: parseInt(props.followers.replace(/[^0-9]/g, '')) || 0,
                                            following: parseInt(props.following.replace(/[^0-9]/g, '')) || 0,
                                            posts: parseInt(props.posts.replace(/[^0-9]/g, '')) || 0,
                                            is_verified: false,
                                            is_private: false,
                                            profile_pic_url: data.mainEntity.image || ''
                                        };
                                    }
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                        
                        return null;
                    }
                """)
                
                if js_data and js_data.followers > 0:
                    logger.info(f"✅ SUCCESS: Got exact data via JavaScript for {username} - {js_data['followers']} followers, {js_data['posts']} posts")
                    return {
                        **js_data,
                        'latest_posts': [],
                        'fetched_at': datetime.now().isoformat()
                    }
            except Exception as e:
                logger.debug(f"JavaScript extraction failed: {e}")
            
            # Fallback to content parsing
            content = await page.content()
            profile_data = self._extract_profile_data(content, username)
            
            if profile_data:
                logger.info(f"✅ SUCCESS: Scraped exact data for {username} - {profile_data['followers']} followers, {profile_data['posts']} posts")
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
        
        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're in a running loop, create a new task
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, _scrape())
                    return future.result()
            else:
                return asyncio.run(_scrape())
        except RuntimeError:
            # Fallback to asyncio.run
            return asyncio.run(_scrape())
    
    def scrape_multiple_profiles(self, usernames: List[str]) -> Dict[str, Optional[Dict]]:
        """Synchronous wrapper for scrape_multiple_profiles"""
        async def _scrape():
            async with self.scraper as scraper:
                return await scraper.scrape_multiple_profiles(usernames)
        
        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're in a running loop, create a new task
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, _scrape())
                    return future.result()
            else:
                return asyncio.run(_scrape())
        except RuntimeError:
            # Fallback to asyncio.run
            return asyncio.run(_scrape())