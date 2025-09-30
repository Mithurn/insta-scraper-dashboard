AI Agent Prompt: Instagram Public Profile Scraper & Dashboard System

Project Title: Instagram Public Profile Analytics Dashboard

Overall Objective: Develop a full-stack, deployable, and visually impressive web application that scrapes public Instagram profile data, stores it, and presents it in a centralized, interactive dashboard with real-time rankings and filtering capabilities. The system should be robust, scalable, and easy to deploy.

Phase 1: Project Setup & Architecture Definition

Task: Define the complete technology stack and high-level architecture.
Deliverable: A document outlining the chosen technologies for each layer (frontend, backend, database, scraping tools, deployment platform) and a diagram illustrating the system architecture.
Key Decisions (AI Agent to propose and justify):
Specific Python libraries for scraping (e.g., requests, BeautifulSoup, Selenium/Playwright).
Backend framework (e.g., Flask, Django REST Framework, Node.js Express).
Database system (e.g., PostgreSQL, MongoDB).
Frontend framework (e.g., React, Vue, Angular) and UI component library.
Deployment strategy (e.g., Docker, chosen cloud provider like AWS/GCP/Heroku).
Phase 2: Data Collection (Scraping Layer)

Task: Build a robust web scraper for Instagram public profiles.
Requirements:
Target Data Points: For each public Instagram profile, collect:
Username / Profile Name
Number of Followers
Number Following
Posts Count
Post Engagement (if available, e.g., average likes/comments per post, or views for video posts). Prioritize likes/comments if views are hard to obtain consistently.
Technology: Python-based.
Anti-Scraping Measures: Implement strategies to mitigate Instagram's anti-scraping mechanisms:
Randomized request delays.
Rotation of User-Agent headers.
Consideration for proxy rotation (if direct requests are insufficient, the agent should propose integration with a proxy service).
If JavaScript rendering is required, integrate Selenium or Playwright with a headless browser.
Initial Data Population: The scraper should be able to process a list of at least 10 Instagram public profile URLs/usernames provided as input.
Error Handling: Gracefully handle cases where a profile is not found, private, or data points are missing.
Deliverable:
Well-documented Python scraping script(s).
Instructions on how to run the scraper.
A sample output of scraped data (e.g., JSON or CSV).
Phase 3: Backend & Data Storage Layer

Task: Develop the backend API and database to store and serve the scraped data.
Requirements:
Database Schema: Design a normalized database schema (for SQL) or a flexible document structure (for NoSQL) to efficiently store profile and post data.
profiles table/collection: username (unique), profile_name, followers_count, following_count, posts_count, engagement_rate (calculated), last_updated timestamp.
posts table/collection (optional but recommended for engagement calculation): profile_id (foreign key), post_url, likes_count, comments_count, views_count (if available), post_date.
API Endpoints: Create RESTful API endpoints to:
GET /api/profiles: Retrieve all profiles with their latest metrics.
GET /api/profiles/ranked?by={metric}: Retrieve profiles ranked by a specified metric (e.g., followers, engagement_rate). Default to followers.
GET /api/profiles/{username}: Retrieve detailed data for a specific profile.
POST /api/profiles/update: Endpoint to trigger a scrape for a given list of usernames (for manual updates).
Data Processing: Implement logic to calculate engagement_rate (e.g., (total_likes + total_comments) / total_followers for a set of recent posts, or a simpler average_likes_per_post / followers).
Scheduled Updates: Implement a mechanism (e.g., a cron job, a background task queue like Celery, or a built-in scheduler) to automatically run the scraping process for all tracked profiles at regular intervals (e.g., daily or every 12 hours).
Deliverable:
Backend API code (e.g., Flask/Django/Node.js project).
Database schema definition (SQL migration scripts or NoSQL schema description).
API documentation (e.g., OpenAPI/Swagger specification or clear endpoint descriptions).
Instructions for setting up and running the backend.
Phase 4: Frontend Dashboard Layer

Task: Build an interactive and visually appealing dashboard to display the data.
Requirements:
Framework: Use the chosen modern JavaScript framework (React, Vue, or Angular).
Core Features:
Tabular View: Display all collected profile data in a clean, responsive table.
Real-time Ranking: The table should default to ranking profiles by followers_count in descending order.
Sort & Filter: Allow users to sort the table by any metric (followers, following, posts, engagement) and filter profiles based on criteria (e.g., minimum followers, search by username).
Auto-refresh: The dashboard should automatically fetch and update data from the backend API at regular intervals (e.g., every 5-10 minutes) without requiring a page refresh.
Profile Details (Optional but impressive): Clicking on a profile row could open a modal or navigate to a detail page showing more historical data or recent posts (if posts data is collected).
Impressive UI/UX:
Modern Design: Clean, intuitive, and aesthetically pleasing interface.
Responsiveness: Fully functional and visually appealing across various screen sizes (desktop, tablet, mobile).
Interactive Elements: Smooth transitions, clear visual feedback for sorting/filtering, loading indicators.
Data Visualization (Optional): Consider simple charts for trends (e.g., follower growth over time for a selected profile, if historical data is stored).
Deliverable:
Frontend application code.
Instructions for building and running the frontend.
Phase 5: Deployment & Operationalization

Task: Prepare the entire system for easy deployment and ongoing operation.
Requirements:
Containerization: Dockerize the backend API, scraper, and potentially the database. Provide Dockerfiles and a docker-compose.yml for local development and single-server deployment.
Deployment Instructions: Provide clear, step-by-step instructions for deploying the entire system (frontend, backend, database) to the chosen cloud platform. This should cover:
Setting up the database.
Deploying the backend service.
Deploying the frontend static assets.
Configuring environment variables (e.g., database credentials, API keys).
Setting up the scheduled scraping task.
CI/CD (Conceptual): Outline a basic CI/CD pipeline strategy (e.g., using GitHub Actions) for automated testing and deployment upon code changes.
Deliverable:
Dockerfiles and docker-compose.yml.
Comprehensive deployment guide.
Conceptual CI/CD pipeline definition.
Phase 6: Documentation & Best Practices

Task: Ensure the entire project is well-documented and follows best practices.
Requirements:
Code Quality: Clean, readable, and well-commented code across all layers.
README.md: A comprehensive README.md file in the project root, covering:
Project overview.
Setup instructions (local development).
How to run the scraper, backend, and frontend.
API endpoints.
Deployment guide.
Troubleshooting.
Ethical Considerations: Include a section on the ethical implications of web scraping and adherence to Instagram's Terms of Service (for personal/educational use only).
Deliverable:
Clean, commented codebase.
Detailed README.md.
Constraints & Considerations for the AI Agent:

Focus on Public Data: Strictly adhere to scraping only publicly available profile information. Do not attempt to bypass login or access private data.
Robustness: Prioritize building a scraper that can withstand minor website changes and handle common scraping challenges.
Scalability: Design the database and backend with future scalability in mind (e.g., adding more profiles, more frequent updates).
Security: Implement basic security practices for the backend API (e.g., environment variables for sensitive data, input validation).
"Impressive" Factor: The frontend design and user experience should be a high priority to meet the "impressive" requirement.
Final Deliverable: A complete, functional, and deployable Instagram Public Profile Analytics Dashboard system, including all source code, documentation, and deployment instructions, ready for use.

System Architecture:
Data Scraping Layer (Backend)
Database (Storage)
Dashboard (Frontend)

Web Scraping (More Flexible)
