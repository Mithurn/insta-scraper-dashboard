<h1 align="center">
  <br>
  <a href="#"><img src="https://img.icons8.com/fluency/96/000000/instagram-new.png" alt="Instagram Analytics" width="120"></a>
  <br>
  Instagram Analytics Dashboard
  <br>
</h1>

<h4 align="center">A full-stack, deployable web application that scrapes public Instagram profile data and presents it in an interactive analytics dashboard with real-time rankings and filtering capabilities.</h4>

<p align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/Python-3.8+-blue.svg?style=flat-square&logo=python" alt="Python">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square&logo=react" alt="React">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Flask-2.0+-000000.svg?style=flat-square&logo=flask" alt="Flask">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/PostgreSQL-13+-336791.svg?style=flat-square&logo=postgresql" alt="PostgreSQL">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker" alt="Docker">
  </a>
  <br>
  <a href="#">
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Status-In%20Development-yellow.svg?style=flat-square" alt="Status">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Tests-Passing-brightgreen.svg?style=flat-square" alt="Tests">
  </a>
  <a href="https://instagram-analytics-dashboard.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Available-blue.svg?style=flat-square" alt="Live Demo">
  </a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-documentation">API</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
    <img width="1466" height="735" alt="Instagram Analytics Dashboard" src="https://github.com/user-attachments/assets/18535cca-5f5a-48f0-8f2c-d2653bd85fd7" />
</p>

![Dashboard Features](https://github.com/user-attachments/assets/4a1561ea-8dca-4a13-bd9a-42f896eee2ba)

## 🚀 Key Features

### 📊 **Comprehensive Analytics**
- **Real-time Profile Metrics**: Track followers, following, posts count, and engagement rates
- **Interactive Dashboard**: Sort, filter, and rank profiles by any metric
- **Auto-refresh**: Live data updates every 5-10 minutes
- **Historical Tracking**: Monitor growth trends over time

### 🔍 **Advanced Scraping Engine**
- **Anti-Detection**: Randomized delays, User-Agent rotation, and proxy support
- **Robust Error Handling**: Graceful handling of private profiles and missing data
- **Scalable Architecture**: Process multiple profiles simultaneously
- **Scheduled Updates**: Automated daily data collection

### 🎨 **Modern UI/UX**
- **Responsive Design**: Beautiful interface across all devices
- **Dark/Light Mode**: Customizable themes
- **Interactive Elements**: Smooth transitions and loading indicators
- **Data Visualization**: Charts and graphs for trend analysis

### 🏗️ **Production Ready**
- **Dockerized**: Complete containerization with docker-compose
- **RESTful API**: Well-documented endpoints
- **Database Optimization**: Efficient schema design
- **CI/CD Ready**: Automated testing and deployment

## 🛠️ Technical Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18+ | Modern UI with hooks and functional components |
| **Backend** | Flask | 2.0+ | Lightweight Python web framework for REST API |
| **Database** | PostgreSQL | 13+ | Robust relational database for complex queries |
| **Scraping** | Selenium/Playwright | Latest | JavaScript rendering for dynamic content |
| **Containerization** | Docker | Latest | Consistent deployment across environments |
| **Task Queue** | Celery | 5.0+ | Asynchronous task processing for scraping |
| **ORM** | SQLAlchemy | 2.0+ | Python SQL toolkit for database operations |

### **Technology Justification**

- **React 18+**: Chosen for its component-based architecture, excellent performance with concurrent features, and vast ecosystem
- **Flask**: Selected for its simplicity, flexibility, and perfect fit for REST API development without unnecessary overhead
- **PostgreSQL**: Opted for its ACID compliance, advanced indexing capabilities, and excellent performance with complex analytical queries
- **Selenium/Playwright**: Essential for handling Instagram's JavaScript-heavy interface and anti-bot measures
- **Docker**: Ensures consistent deployment and easy scaling across different environments

## 🧠 Challenges & Solutions

### **Challenge 1: Instagram Anti-Scraping Measures**
**Problem**: Instagram employs sophisticated anti-bot detection including rate limiting, CAPTCHAs, and behavioral analysis.

**Solution**: Implemented a multi-layered approach:
- **Randomized Delays**: Dynamic sleep intervals (2-8 seconds) between requests
- **User-Agent Rotation**: Pool of realistic browser user agents
- **Session Management**: Proper cookie handling and session persistence
- **Proxy Integration**: Optional proxy rotation for IP diversity
- **Request Headers**: Mimicking real browser behavior with proper headers

### **Challenge 2: Scalable Data Processing**
**Problem**: Processing hundreds of profiles efficiently while maintaining data consistency and handling failures gracefully.

**Solution**: Built a robust architecture:
- **Celery Task Queue**: Asynchronous processing with Redis backend
- **Database Connection Pooling**: Optimized connection management
- **Retry Logic**: Exponential backoff for failed requests
- **Data Validation**: Comprehensive input validation and error handling
- **Batch Processing**: Efficient bulk operations for database updates

## 🏛️ Architecture

```mermaid
graph TB
    A[Frontend - React] --> B[Backend API - Flask]
    B --> C[Database - PostgreSQL]
    D[Scraper - Python] --> C
    E[Scheduler] --> D
    F[Docker Compose] --> A
    F --> B
    F --> C
    F --> D
```


## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose
- PostgreSQL 13+ (optional for local development)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/Mithurn/instagram-analytics-dashboard.git
cd instagram-analytics-dashboard

# Start all services
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Manual Installation

```bash
# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend Setup (in a new terminal)
cd frontend
npm install
npm start
```

### Environment Setup

Create a `.env` file in the root directory with the following essential variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/instagram_analytics
REDIS_URL=redis://localhost:6379/0

# API Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

**Note**: See `.env.example` for additional configuration options.

## 🎯 Usage

### Adding Profiles to Track

1. **Via Dashboard**: Use the web interface to add Instagram usernames
2. **Via API**: POST to `/api/profiles/update` with a list of usernames
3. **Via Config**: Add profiles to the configuration file

### Dashboard Features

- **📈 Rankings**: View profiles ranked by followers, engagement, or growth
- **🔍 Search & Filter**: Find specific profiles or filter by criteria
- **📊 Analytics**: Detailed metrics and trend analysis
- **⚡ Real-time Updates**: Automatic data refresh

### API Endpoints

```bash
# Get all profiles
GET /api/profiles

# Get ranked profiles
GET /api/profiles/ranked?by=followers

# Get specific profile
GET /api/profiles/{username}

# Update profiles
POST /api/profiles/update
```

## 🐳 Deployment

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# With environment variables
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
## ⚖️ Legal & Ethical Considerations

This project is designed for **educational and personal use only**. Please ensure you:

- ✅ Only scrape **publicly available** data
- ✅ Respect Instagram's Terms of Service
- ✅ Implement reasonable rate limiting
- ✅ Use data responsibly and ethically

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author & Contact

**Mithurn Jeromme**  
*Full-Stack Developer & Data Enthusiast*

- 🌐 **Website**: [mithurnjeromme.vercel.app](https://mithurnjeromme.vercel.app)
- 💼 **LinkedIn**: [linkedin.com/in/mithurn-jeromme-s-k](https://www.linkedin.com/in/mithurn-jeromme-s-k/)
- 🐙 **GitHub**: [github.com/Mithurn](https://github.com/Mithurn)
- 📧 **Email**: mithurnjeromme172@gmail.com
- 🐦 **Twitter**: [@Mithurn_Jeromme](https://x.com/Mithurn_Jeromme)

---

<div align="center">

**Built with ❤️ for the developer community**

[Report Bug](https://github.com/Mithurn/instagram-analytics-dashboard/issues) • [Request Feature](https://github.com/Mithurn/instagram-analytics-dashboard/issues) • [Documentation](https://github.com/Mithurn/instagram-analytics-dashboard/wiki)

</div>
