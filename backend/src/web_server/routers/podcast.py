from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
import uuid
from typing import List, Optional

from ..models.models import PodcastCreate, Podcast, Episode, EpisodeCreate
from ..db.memory_db import db
from ..auth.auth import get_current_user

router = APIRouter(prefix="/api/podcasts", tags=["Podcasts"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_podcast(
    podcast_data: PodcastCreate, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    current_time = datetime.now()
    podcast_id = str(uuid.uuid4())
    episode_ids = []

    # Create episodes
    for episode_data in podcast_data.episodes:
        episode_id = str(uuid.uuid4())

        db.episodes[episode_id] = {
            "id": episode_id,
            "name": episode_data.name,
            "desc": episode_data.desc,
            "thumbnail": episode_data.thumbnail,
            "creator_id": user_id,
            "type": episode_data.type,
            "duration": episode_data.duration,
            "file": episode_data.file,
            "created_at": current_time,
            "updated_at": current_time,
        }

        episode_ids.append(episode_id)

    # Create podcast
    podcast = {
        "id": podcast_id,
        "name": podcast_data.name,
        "desc": podcast_data.desc,
        "thumbnail": podcast_data.thumbnail,
        "creator_id": user_id,
        "tags": podcast_data.tags,
        "type": podcast_data.type,
        "category": podcast_data.category,
        "views": 0,
        "episodes": episode_ids,
        "created_at": current_time,
        "updated_at": current_time,
    }

    db.podcasts[podcast_id] = podcast

    # Update user's podcasts list
    db.users[user_id]["podcasts"].append(podcast_id)

    return podcast


@router.post("/episode")
async def add_episodes(
    podid: str,
    episodes: List[EpisodeCreate],
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    current_time = datetime.now()

    # Check if podcast exists
    if podid not in db.podcasts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found"
        )

    # Create episodes
    for episode_data in episodes:
        episode_id = str(uuid.uuid4())

        db.episodes[episode_id] = {
            "id": episode_id,
            "name": episode_data.name,
            "desc": episode_data.desc,
            "thumbnail": episode_data.thumbnail,
            "creator_id": user_id,
            "type": episode_data.type,
            "duration": episode_data.duration,
            "file": episode_data.file,
            "created_at": current_time,
            "updated_at": current_time,
        }

        # Update podcast's episodes list
        db.podcasts[podid]["episodes"].append(episode_id)

    return {"message": "Episode added successfully"}


@router.get("/")
async def get_podcasts():
    podcasts = []

    for podcast_id, podcast in db.podcasts.items():
        # Get creator info
        creator = db.users.get(podcast["creator_id"], {})
        creator_info = {"name": creator.get("name", ""), "img": creator.get("img", "")}

        # Get episodes
        episodes = []
        for episode_id in podcast["episodes"]:
            episode = db.episodes.get(episode_id)
            if episode:
                episodes.append(episode)

        # Construct response
        podcast_with_relations = {
            **podcast,
            "creator": creator_info,
            "episodes": episodes,
        }

        podcasts.append(podcast_with_relations)

    return podcasts


@router.get("/get/{id}")
async def get_podcast_by_id(id: str):
    podcast = db.podcasts.get(id)
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found"
        )

    # Get creator info
    creator = db.users.get(podcast["creator_id"], {})
    creator_info = {"name": creator.get("name", ""), "img": creator.get("img", "")}

    # Get episodes
    episodes = []
    for episode_id in podcast["episodes"]:
        episode = db.episodes.get(episode_id)
        if episode:
            episodes.append(episode)

    # Construct response
    podcast_with_relations = {**podcast, "creator": creator_info, "episodes": episodes}

    return podcast_with_relations


@router.post("/favorit")
async def favorit_podcast(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # Check if podcast exists
    if id not in db.podcasts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found"
        )

    # Check if user is the creator of the podcast
    if user_id == db.podcasts[id]["creator_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can't favorit your own podcast!",
        )

    # Check if already favorited
    if id in db.users[user_id]["favorits"]:
        # Remove from favorites
        db.users[user_id]["favorits"].remove(id)
        return {"message": "Removed from favorit"}
    else:
        # Add to favorites
        db.users[user_id]["favorits"].append(id)
        return {"message": "Added to favorit"}


@router.post("/addview/{id}")
async def add_view(id: str):
    # Check if podcast exists
    if id not in db.podcasts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found"
        )

    # Increment views
    db.podcasts[id]["views"] += 1

    return {"message": "The view has been increased."}


@router.get("/random")
async def random_podcasts():
    # In a real app, we would randomly select podcasts
    # For this mock, we'll just return all podcasts (up to 40)
    podcasts = []

    for podcast_id, podcast in list(db.podcasts.items())[:40]:
        # Get creator info
        creator = db.users.get(podcast["creator_id"], {})
        creator_info = {"name": creator.get("name", ""), "img": creator.get("img", "")}

        # Get episodes
        episodes = []
        for episode_id in podcast["episodes"]:
            episode = db.episodes.get(episode_id)
            if episode:
                episodes.append(episode)

        # Construct response
        podcast_with_relations = {
            **podcast,
            "creator": creator_info,
            "episodes": episodes,
        }

        podcasts.append(podcast_with_relations)

    return podcasts


@router.get("/mostpopular")
async def most_popular():
    # Sort podcasts by views
    sorted_podcasts = sorted(
        db.podcasts.items(), key=lambda x: x[1]["views"], reverse=True
    )

    podcasts = []

    for podcast_id, podcast in sorted_podcasts:
        # Get creator info
        creator = db.users.get(podcast["creator_id"], {})
        creator_info = {"name": creator.get("name", ""), "img": creator.get("img", "")}

        # Get episodes
        episodes = []
        for episode_id in podcast["episodes"]:
            episode = db.episodes.get(episode_id)
            if episode:
                episodes.append(episode)

        # Construct response
        podcast_with_relations = {
            **podcast,
            "creator": creator_info,
            "episodes": episodes,
        }

        podcasts.append(podcast_with_relations)

    return podcasts


@router.get("/tags")
async def get_by_tag(tags: str):
    tag_list = tags.split(",")

    podcasts = []

    for podcast_id, podcast in db.podcasts.items():
        # Check if any of podcast's tags are in the requested tags
        if any(tag in podcast["tags"] for tag in tag_list):
            # Get creator info
            creator = db.users.get(podcast["creator_id"], {})
            creator_info = {
                "name": creator.get("name", ""),
                "img": creator.get("img", ""),
            }

            # Get episodes
            episodes = []
            for episode_id in podcast["episodes"]:
                episode = db.episodes.get(episode_id)
                if episode:
                    episodes.append(episode)

            # Construct response
            podcast_with_relations = {
                **podcast,
                "creator": creator_info,
                "episodes": episodes,
            }

            podcasts.append(podcast_with_relations)

    return podcasts


@router.get("/category")
async def get_by_category(q: str):
    podcasts = []

    for podcast_id, podcast in db.podcasts.items():
        # Check if category matches (case-insensitive)
        if q.lower() in podcast["category"].lower():
            # Get creator info
            creator = db.users.get(podcast["creator_id"], {})
            creator_info = {
                "name": creator.get("name", ""),
                "img": creator.get("img", ""),
            }

            # Get episodes
            episodes = []
            for episode_id in podcast["episodes"]:
                episode = db.episodes.get(episode_id)
                if episode:
                    episodes.append(episode)

            # Construct response
            podcast_with_relations = {
                **podcast,
                "creator": creator_info,
                "episodes": episodes,
            }

            podcasts.append(podcast_with_relations)

    return podcasts


@router.get("/search")
async def search(q: str):
    podcasts = []
    limit = 40
    count = 0

    for podcast_id, podcast in db.podcasts.items():
        if count >= limit:
            break

        # Check if name matches (case-insensitive)
        if q.lower() in podcast["name"].lower():
            # Get creator info
            creator = db.users.get(podcast["creator_id"], {})
            creator_info = {
                "name": creator.get("name", ""),
                "img": creator.get("img", ""),
            }

            # Get episodes
            episodes = []
            for episode_id in podcast["episodes"]:
                episode = db.episodes.get(episode_id)
                if episode:
                    episodes.append(episode)

            # Construct response
            podcast_with_relations = {
                **podcast,
                "creator": creator_info,
                "episodes": episodes,
            }

            podcasts.append(podcast_with_relations)
            count += 1

    return podcasts
