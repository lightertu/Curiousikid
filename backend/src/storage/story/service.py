import logging
from pathlib import Path
from typing import List, Optional
from environment.config import PROJECT_ROOT
from storage.story.models import QuestionPoint, StoryMetadata, StoryTranscription                   
from storage.data_loader import load_models_from_yaml, load_transcription_from_json
import os
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

DEFAULT_STORIES_FILE = Path(os.path.join(PROJECT_ROOT, "src", "storage", "story", "data", "stories.yml"))
DEFAULT_STORY_DIR = Path(os.path.join(PROJECT_ROOT, "src", "storage", "story", "data"))

def load_stories_from_yaml(file_path: Path = DEFAULT_STORIES_FILE) -> List[StoryMetadata]:
    """Loads story metadata from a YAML file using the generic loader."""
    logger.info(f"Loading stories from: {file_path}")
    stories = load_models_from_yaml(file_path, StoryMetadata)
    if not stories:
        logger.warning(f"No stories were loaded from {file_path}.")
    return stories

class StoryService:
    def __init__(self):
        self.stories = {story.id: story for story in load_stories_from_yaml()}
        self.transcriptions = {story.id: load_transcription_from_json(self._get_story_transcription_file(story.id)) for story in self.stories.values()}

    def get_story(self, id: str) -> StoryMetadata:
        return self.stories.get(id) 
        
    def get_story_mp3(self, id: str) -> str:
        return os.path.join(DEFAULT_STORY_DIR, id, "audio.mp3")

    def get_stories(self) -> List[StoryMetadata]:
        return list(self.stories.values())

    def get_concatenated_segment_text_at_time(self, question_point: QuestionPoint) -> str:
        """Get the concatenated text of segments that contain the specified time point."""
        transcription = self.get_story_transcription(question_point.storyId)
        if not transcription:
            raise ValueError(f"Transcription not found for story {question_point.storyId}")
        
        # Filter segments based on interruptAt time
        matching_segments = [segment for segment in transcription.segments if segment.start <= question_point.interruptAt and segment.end >= question_point.interruptAt]
        
        # Concatenate the text of matching segments
        concatenated_text = " ".join(segment.text for segment in matching_segments)
        
        return concatenated_text # Return the concatenated string

    def get_story_transcription(self, storyId: str) -> Optional[StoryTranscription]:
        return self.transcriptions.get(storyId)

    def _get_story_transcription_file(self, storyId: str) -> str:
        return os.path.join(DEFAULT_STORY_DIR, storyId, "transcription_processed.json")
    