from datetime import datetime
import uuid
from passlib.context import CryptContext
from typing import Dict, List, Optional

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# In-memory database
class MemoryDB:
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.podcasts: Dict[str, dict] = {}
        self.episodes: Dict[str, dict] = {}
        self.otp: Optional[str] = None
        self.reset_session: bool = False
        self._initialize_mock_data()

    def _initialize_mock_data(self):
        # Create sample users
        user1_id = str(uuid.uuid4())
        user2_id = str(uuid.uuid4())

        self.users[user1_id] = {
            "id": user1_id,
            "name": "John Doe",
            "email": "john@example.com",
            "password": pwd_context.hash("password123"),
            "img": "https://randomuser.me/api/portraits/men/1.jpg",
            "google_sign_in": False,
            "podcasts": [],
            "favorits": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.users[user2_id] = {
            "id": user2_id,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "password": pwd_context.hash("password456"),
            "img": "https://randomuser.me/api/portraits/women/2.jpg",
            "google_sign_in": True,
            "podcasts": [],
            "favorits": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        # Create sample episodes
        episode1_id = str(uuid.uuid4())
        episode2_id = str(uuid.uuid4())
        episode3_id = str(uuid.uuid4())

        self.episodes[episode1_id] = {
            "id": episode1_id,
            "name": "Introduction to Podcasting",
            "desc": "Learn the basics of podcasting and how to get started",
            "thumbnail": "https://example.com/thumbnails/intro.jpg",
            "creator_id": user1_id,
            "type": "audio",
            "duration": "25:30",
            "file": "https://example.com/podcasts/intro.mp3",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.episodes[episode2_id] = {
            "id": episode2_id,
            "name": "Advanced Podcasting Techniques",
            "desc": "Take your podcasting skills to the next level",
            "thumbnail": "https://example.com/thumbnails/advanced.jpg",
            "creator_id": user1_id,
            "type": "audio",
            "duration": "32:15",
            "file": "https://example.com/podcasts/advanced.mp3",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.episodes[episode3_id] = {
            "id": episode3_id,
            "name": "Podcast Marketing Strategies",
            "desc": "Learn how to grow your podcast audience",
            "thumbnail": "https://example.com/thumbnails/marketing.jpg",
            "creator_id": user2_id,
            "type": "audio",
            "duration": "28:45",
            "file": "https://example.com/podcasts/marketing.mp3",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        # Create sample podcasts
        podcast1_id = str(uuid.uuid4())
        podcast2_id = str(uuid.uuid4())

        self.podcasts[podcast1_id] = {
            "id": podcast1_id,
            "name": "Podcasting Masterclass",
            "desc": "A comprehensive guide to podcasting",
            "thumbnail": "https://example.com/thumbnails/masterclass.jpg",
            "creator_id": user1_id,
            "tags": ["education", "podcasting", "technology"],
            "type": "audio",
            "category": "education",
            "views": 1250,
            "episodes": [episode1_id, episode2_id],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.podcasts[podcast2_id] = {
            "id": podcast2_id,
            "name": "Marketing for Podcasters",
            "desc": "Learn how to market your podcast effectively",
            "thumbnail": "https://example.com/thumbnails/marketing.jpg",
            "creator_id": user2_id,
            "tags": ["marketing", "business", "podcasting"],
            "type": "audio",
            "category": "business",
            "views": 980,
            "episodes": [episode3_id],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        # Update users with their podcasts
        self.users[user1_id]["podcasts"].append(podcast1_id)
        self.users[user2_id]["podcasts"].append(podcast2_id)

        # Add some favorites
        self.users[user1_id]["favorits"].append(podcast2_id)
        self.users[user2_id]["favorits"].append(podcast1_id)


# Create global database instance
db = MemoryDB()
