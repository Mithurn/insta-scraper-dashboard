import requests
import time
import random
import re
import json
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LiveInstagramScraper:
    def __init__(self):
        self.user_agent = UserAgent()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
        })
        
    def _random_delay(self):
        """Random delay between requests"""
        delay = random.uniform(3, 7)
        time.sleep(delay)
    
    def scrape_profile(self, username):
        """Scrape real Instagram profile data from live Instagram"""
        try:
            self._random_delay()
            
            # Clean username
            username = username.strip().replace('@', '')
            
            # Try multiple approaches
            profile_data = self._scrape_via_web_request(username)
            
            if profile_data and profile_data.get('followers_count', 0) > 0:
                logger.info(f"Successfully scraped live data for {username}: {profile_data.get('followers_count', 0)} followers")
                return profile_data
            else:
                # Try alternative approach
                profile_data = self._scrape_via_json_ld(username)
                if profile_data and profile_data.get('followers_count', 0) > 0:
                    logger.info(f"Successfully scraped live data via JSON-LD for {username}: {profile_data.get('followers_count', 0)} followers")
                    return profile_data
                
        except Exception as e:
            logger.error(f"Error scraping profile {username}: {str(e)}")
            
        return None
    
    def _scrape_via_web_request(self, username):
        """Scrape profile via direct web request"""
        try:
            url = f"https://www.instagram.com/{username}/"
            
            # Add random headers
            self.session.headers.update({
                'User-Agent': self.user_agent.random,
                'Referer': 'https://www.instagram.com/',
            })
            
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                return self._extract_profile_data_from_html(response.text, username)
            elif response.status_code == 404:
                logger.warning(f"Profile {username} not found (404)")
                return None
            else:
                logger.warning(f"Unexpected status code {response.status_code} for {username}")
                
        except Exception as e:
            logger.error(f"Error in web request for {username}: {str(e)}")
            
        return None
    
    def _extract_profile_data_from_html(self, html_content, username):
        """Extract profile data from HTML content"""
        try:
            # Look for JSON data in script tags
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Method 1: Look for window._sharedData
            shared_data_match = re.search(r'window\._sharedData\s*=\s*({.*?});', html_content)
            if shared_data_match:
                try:
                    data = json.loads(shared_data_match.group(1))
                    profile_data = self._parse_shared_data(data, username)
                    if profile_data:
                        return profile_data
                except json.JSONDecodeError:
                    pass
            
            # Method 2: Look for JSON-LD structured data
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    profile_data = self._parse_json_ld(data, username)
                    if profile_data:
                        return profile_data
                except (json.JSONDecodeError, AttributeError):
                    continue
            
            # Method 3: Look for meta tags
            meta_data = self._extract_from_meta_tags(soup, username)
            if meta_data:
                return meta_data
            
            # Method 4: Look for any script with profile data
            scripts = soup.find_all('script', type='text/javascript')
            for script in scripts:
                if script.string:
                    # Look for follower count patterns
                    follower_match = re.search(r'"edge_followed_by":\s*{\s*"count":\s*(\d+)', script.string)
                    following_match = re.search(r'"edge_follow":\s*{\s*"count":\s*(\d+)', script.string)
                    posts_match = re.search(r'"edge_owner_to_timeline_media":\s*{\s*"count":\s*(\d+)', script.string)
                    name_match = re.search(r'"full_name":\s*"([^"]*)"', script.string)
                    verified_match = re.search(r'"is_verified":\s*(true|false)', script.string)
                    private_match = re.search(r'"is_private":\s*(true|false)', script.string)
                    
                    if follower_match:
                        followers = int(follower_match.group(1))
                        following = int(following_match.group(1)) if following_match else 0
                        posts = int(posts_match.group(1)) if posts_match else 0
                        
                        return {
                            'username': username,
                            'profile_name': name_match.group(1) if name_match else username.title(),
                            'followers_count': followers,
                            'following_count': following,
                            'posts_count': posts,
                            'engagement_rate': self._calculate_engagement_rate(followers, posts),
                            'bio': f'@{username} on Instagram',
                            'profile_pic_url': '',
                            'is_verified': 1 if verified_match and verified_match.group(1) == 'true' else 0,
                            'is_private': 1 if private_match and private_match.group(1) == 'true' else 0
                        }
            
        except Exception as e:
            logger.error(f"Error extracting profile data from HTML for {username}: {str(e)}")
            
        return None
    
    def _parse_shared_data(self, data, username):
        """Parse Instagram shared data"""
        try:
            entry_data = data.get('entry_data', {})
            profile_pages = entry_data.get('ProfilePage', [])
            
            if profile_pages:
                profile_page = profile_pages[0]
                graphql = profile_page.get('graphql', {})
                user_info = graphql.get('user', {})
                
                if user_info:
                    return {
                        'username': username,
                        'profile_name': user_info.get('full_name', ''),
                        'followers_count': user_info.get('edge_followed_by', {}).get('count', 0),
                        'following_count': user_info.get('edge_follow', {}).get('count', 0),
                        'posts_count': user_info.get('edge_owner_to_timeline_media', {}).get('count', 0),
                        'engagement_rate': self._calculate_engagement_rate(
                            user_info.get('edge_followed_by', {}).get('count', 0),
                            user_info.get('edge_owner_to_timeline_media', {}).get('count', 0)
                        ),
                        'bio': user_info.get('biography', ''),
                        'profile_pic_url': user_info.get('profile_pic_url_hd', ''),
                        'is_verified': 1 if user_info.get('is_verified') else 0,
                        'is_private': 1 if user_info.get('is_private') else 0
                    }
                    
        except Exception as e:
            logger.error(f"Error parsing shared data for {username}: {str(e)}")
            
        return None
    
    def _parse_json_ld(self, data, username):
        """Parse JSON-LD structured data"""
        try:
            if isinstance(data, dict) and data.get('@type') == 'Person':
                # Extract social media data
                same_as = data.get('sameAs', [])
                for url in same_as:
                    if 'instagram.com' in url:
                        # This is Instagram data, extract what we can
                        return {
                            'username': username,
                            'profile_name': data.get('name', username.title()),
                            'followers_count': 0,  # JSON-LD usually doesn't have follower counts
                            'following_count': 0,
                            'posts_count': 0,
                            'engagement_rate': 0.0,
                            'bio': data.get('description', f'@{username} on Instagram'),
                            'profile_pic_url': data.get('image', ''),
                            'is_verified': 0,
                            'is_private': 0
                        }
                        
        except Exception as e:
            logger.error(f"Error parsing JSON-LD for {username}: {str(e)}")
            
        return None
    
    def _extract_from_meta_tags(self, soup, username):
        """Extract basic info from meta tags"""
        try:
            # Look for Open Graph meta tags
            og_title = soup.find('meta', property='og:title')
            og_description = soup.find('meta', property='og:description')
            
            if og_description and og_description.get('content'):
                description = og_description.get('content')
                
                # Try to extract numbers from description
                # Pattern: "X Followers, Y Following, Z Posts"
                follower_match = re.search(r'([0-9,]+)\s*Followers', description)
                following_match = re.search(r'([0-9,]+)\s*Following', description)
                posts_match = re.search(r'([0-9,]+)\s*Posts', description)
                
                if follower_match:
                    followers = int(follower_match.group(1).replace(',', ''))
                    following = int(following_match.group(1).replace(',', '')) if following_match else 0
                    posts = int(posts_match.group(1).replace(',', '')) if posts_match else 0
                    
                    return {
                        'username': username,
                        'profile_name': og_title.get('content', '').replace(' (@' + username + ')', '') if og_title else username.title(),
                        'followers_count': followers,
                        'following_count': following,
                        'posts_count': posts,
                        'engagement_rate': self._calculate_engagement_rate(followers, posts),
                        'bio': description,
                        'profile_pic_url': '',
                        'is_verified': 1 if 'verified' in description.lower() else 0,
                        'is_private': 1 if 'private' in description.lower() else 0
                    }
                    
        except Exception as e:
            logger.error(f"Error extracting from meta tags for {username}: {str(e)}")
            
        return None
    
    def _scrape_via_json_ld(self, username):
        """Alternative scraping method via JSON-LD"""
        try:
            url = f"https://www.instagram.com/{username}/"
            
            # Try with different headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return self._extract_profile_data_from_html(response.text, username)
                
        except Exception as e:
            logger.error(f"Error in JSON-LD scraping for {username}: {str(e)}")
            
        return None
    
    def _calculate_engagement_rate(self, followers, posts):
        """Calculate a basic engagement rate"""
        if followers == 0 or posts == 0:
            return 0.0
        
        # This is a simplified calculation
        # Real engagement rate would require analyzing likes and comments
        # For now, we'll use a basic formula
        base_rate = 2.0  # Base 2% engagement rate
        follower_factor = min(1.0, 1000000 / followers)  # Higher follower count = lower engagement
        return round(base_rate + follower_factor, 1)
    
    def scrape_multiple_profiles(self, usernames):
        """Scrape multiple profiles"""
        results = []
        
        for username in usernames:
            try:
                profile_data = self.scrape_profile(username)
                if profile_data:
                    results.append(profile_data)
                    
                # Add delay between profiles to avoid rate limiting
                self._random_delay()
                
            except Exception as e:
                logger.error(f"Error scraping {username}: {str(e)}")
                continue
        
        return results
