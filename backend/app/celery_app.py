from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Create Celery instance
celery_app = Celery(
    "instagram_scraper",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    include=["app.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    'scrape-all-profiles-daily': {
        'task': 'app.tasks.scrape_all_profiles',
        'schedule': 86400.0,  # Run every 24 hours
    },
    'scrape-all-profiles-twice-daily': {
        'task': 'app.tasks.scrape_all_profiles',
        'schedule': 43200.0,  # Run every 12 hours
    },
}

celery_app.conf.timezone = 'UTC'

# For backward compatibility
celery = celery_app
