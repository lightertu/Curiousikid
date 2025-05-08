import os
from typing import List
from pathlib import Path
from memory.podcast.models import Podcast
from memory.data_loader import load_models_from_yaml
import logging

logger = logging.getLogger(__name__)

DEFAULT_PODCASTS_FILE = Path(
    os.path.join(os.path.dirname(__file__), "data", "podcasts.yml")
)


class PodcastService:
    def __init__(self):
        self.podcasts = load_podcasts_from_yaml()

    def get_podcasts(self) -> List[Podcast]:
        return self.podcasts

    def get_podcast_by_id(self, id: str) -> Podcast:
        return next((podcast for podcast in self.podcasts if podcast.id == id), None)

    def get_podcasts_by_category(self, category: str) -> List[Podcast]:
        return [podcast for podcast in self.podcasts if podcast.category == category]


def load_podcasts_from_yaml(file_path: Path = DEFAULT_PODCASTS_FILE) -> List[Podcast]:
    """Loads story metadata from a YAML file using the generic loader."""
    logger.info(f"Loading users from: {file_path}")
    podcasts = load_models_from_yaml(file_path, Podcast)
    if not podcasts:
        logger.warning(f"No users were loaded from {file_path}.")
    return podcasts
