INSTA SIGHT
# Instagram Public Profile Analytics Dashboard

demo video- 

<img width="1465" height="774" alt="Screenshot 2025-10-01 at 11 03 21 PM" src="https://github.com/user-attachments/assets/eb2fc920-bcca-4f01-86ea-228b7947f7a7" />

<img width="1464" height="775" alt="Screenshot 2025-10-01 at 11 03 41 PM" src="https://github.com/user-attachments/assets/b49b7fac-d6af-467b-95c5-5de4c1dbf23f" />

<img width="1468" height="857" alt="Screenshot 2025-10-01 at 11 04 14 PM" src="https://github.com/user-attachments/assets/02f57679-79d4-42db-9232-810ca3d031eb" />



<img width="1466" height="780" alt="Screenshot 2025-10-01 at 11 04 24 PM" src="https://github.com/user-attachments/assets/6d6aa92c-2915-44bb-97c4-2f48de797202" />




A full-stack web application that scrapes public Instagram profile data and presents it in a centralized, interactive dashboard with real-time rankings and filtering capabilities.

## Features

### Data Collection
- **Public Profile Scraping**: Collects data from public Instagram profiles
- **Key Metrics**: Username, profile name, followers, following, posts count, engagement rate
- **Anti-Detection**: Randomized delays, user agent rotation, headless browser automation
- **Scheduled Updates**: Automatic data refresh every 12-24 hours

### Dashboard
- **Real-time Rankings**: Live ranking by followers, engagement, or other metrics
- **Interactive Table**: Sortable and filterable profile data
- **Modern UI**: Dark theme with cyan accents, responsive design
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Search & Filter**: Find profiles by username or minimum followers

### Technical Stack
- **Backend**: FastAPI (Python) with PostgreSQL database
- **Frontend**: React with TypeScript and Tailwind CSS
- **Scraping**: Playwright with anti-detection measures
- **Task Queue**: Celery with Redis for scheduled scraping
- **Deployment**: Docker containers with docker-compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd instascrape
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. **Populate Sample Data**
   ```bash
   # Add some popular Instagram profiles
   curl -X POST "http://localhost:8000/api/scraper/profiles/sync" \
        -H "Content-Type: application/json" \
        -d '{"usernames": ["instagram", "cristiano", "selenagomez", "therock", "arianagrande"]}'
   ```

### Local Development

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   playwright install chromium
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database and Redis URLs
   
   # Run the backend
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database Setup**
   ```bash
   # Using PostgreSQL locally or Docker
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
   ```

## API Endpoints

### Profiles
- `GET /api/profiles/` - Get all profiles
- `GET /api/profiles/ranked?by=followers_count&order=desc` - Get ranked profiles
- `GET /api/profiles/{username}` - Get specific profile
- `POST /api/profiles/` - Create new profile
- `PUT /api/profiles/{username}` - Update profile
- `DELETE /api/profiles/{username}` - Delete profile

### Scraping
- `POST /api/scraper/profiles/sync` - Scrape profiles synchronously
- `POST /api/scraper/profiles` - Scrape profiles in background
- `POST /api/scraper/update-all` - Update all existing profiles
- `GET /api/scraper/status` - Get scraper status

## Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/instascrape_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
SCRAPING_DELAY_MIN=2
SCRAPING_DELAY_MAX=5
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
```

### Scraping Configuration
- **Rate Limits**: 2-5 second delays between requests
- **Max Retries**: 3 attempts per profile
- **Concurrent Profiles**: Processed sequentially to avoid detection
- **Update Frequency**: Every 12-24 hours (configurable)

## Project Structure

```
instascrape/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   ├── scraper/         # Instagram scraper
│   │   ├── tasks.py         # Celery tasks
│   │   ├── celery_app.py    # Celery configuration
│   │   ├── database.py      # Database setup
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Usage Examples

### Adding New Profiles
```bash
# Add multiple profiles
curl -X POST "http://localhost:8000/api/scraper/profiles/sync" \
     -H "Content-Type: application/json" \
     -d '{"usernames": ["username1", "username2", "username3"]}'
```

### Getting Ranked Profiles
```bash
# Get top 10 profiles by followers
curl "http://localhost:8000/api/profiles/ranked?by=followers_count&order=desc&limit=10"

# Get profiles by engagement rate
curl "http://localhost:8000/api/profiles/ranked?by=engagement_rate&order=desc"
```

### Search Profiles
```bash
# Search by username
curl "http://localhost:8000/api/profiles/search/cristiano"
```

## Deployment

### Production Deployment

1. **Update Environment Variables**
   ```env
   DATABASE_URL=postgresql://user:pass@prod-db:5432/instascrape
   REDIS_URL=redis://prod-redis:6379/0
   SECRET_KEY=your-production-secret-key
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up Reverse Proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api/ {
           proxy_pass http://localhost:8000;
       }
   }
   ```

## Ethical Considerations

⚠️ **Important**: This tool is designed for educational and personal use only.

- Only scrapes **public** Instagram profiles
- Respects rate limits and implements delays
- Does not attempt to bypass authentication
- Follows Instagram's robots.txt guidelines
- Users should review Instagram's Terms of Service

## Troubleshooting

### Common Issues

1. **Scraping Fails**
   - Check if profiles are public
   - Verify internet connection
   - Check for Instagram changes to their structure

2. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify database exists

3. **Frontend Not Loading**
   - Check if backend API is running
   - Verify CORS settings
   - Check browser console for errors

### Logs
```bash
# View backend logs
docker-compose logs backend

# View scraper logs
docker-compose logs celery-worker

# View all logs
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes only. Please ensure compliance with Instagram's Terms of Service and applicable laws in your jurisdiction.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Open an issue on GitHub

---

**Note**: This application is designed to work with public Instagram data only. Always respect website terms of service and implement appropriate rate limiting.
