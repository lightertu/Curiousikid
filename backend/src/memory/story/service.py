import logging
from pathlib import Path
from typing import List, Optional, Dict
from environment.config import MEMORY_ROOT
from memory.story.models import (
    ProactiveQuestionPoint,
    StoryMetadata,
    StoryTranscription,
)
from memory.data_loader import load_models_from_yaml, load_transcription_from_json
import os
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

DEFAULT_STORIES_FILE = Path(os.path.join(MEMORY_ROOT, "story", "data", "stories.yml"))
DEFAULT_STORY_DIR = Path(os.path.join(MEMORY_ROOT, "story", "data", "stories"))
DEFAULT_QUESTION_POINTS_FILE = Path(
    os.path.join(MEMORY_ROOT, "story", "data", "proactive_question_points.yml")
)


class StoryService:
    def __init__(self):
        self.id_to_story = self._load_stories_from_yaml()
        self.story_id_to_question_points = self._load_question_points_from_yaml()
        self.story_id_to_transcription = self._load_transcriptions()

    def get_story(self, id: str) -> StoryMetadata:
        return self.id_to_story.get(id)

    def get_story_mp3(self, story_id: str) -> str:
        return os.path.join(DEFAULT_STORY_DIR, story_id, "audio.mp3")

    def get_stories(self) -> List[StoryMetadata]:
        return list(self.id_to_story.values())

    def get_question_points(self, story_id: str) -> List[ProactiveQuestionPoint]:
        return self.story_id_to_question_points.get(story_id)

    def get_question_point_context(self, question_point: ProactiveQuestionPoint) -> str:
        """Get the concatenated text of segments that contain the specified time point."""
        transcription = self.get_story_transcription(question_point.storyId)
        if not transcription:
            raise ValueError(
                f"Transcription not found for story {question_point.storyId}"
            )

        # Filter segments based on interruptAt time
        matching_segments = [
            segment
            for segment in transcription.segments
            if segment.end <= question_point.interruptAt
        ]

        # Concatenate the text of matching segments
        concatenated_text = " ".join(segment.text for segment in matching_segments)

        return concatenated_text  # Return the concatenated string

    def get_story_text(self, storyId: str) -> str:
        transcription = self.get_story_transcription(storyId)
        if not transcription:
            raise ValueError(f"Transcription not found for story {storyId}")

        return " ".join(segment.text for segment in transcription.segments)

    def get_story_transcription(self, storyId: str) -> Optional[StoryTranscription]:
        return self.story_id_to_transcription.get(storyId)

    def _load_stories_from_yaml(
        self, file_path: Path = DEFAULT_STORIES_FILE
    ) -> List[StoryMetadata]:
        """Loads story metadata from a YAML file using the generic loader."""
        logger.info(f"Loading stories from: {file_path}")

        id_to_story = {}
        stories = load_models_from_yaml(file_path, StoryMetadata)
        if not stories:
            logger.warning(f"No stories were loaded from {file_path}.")
        else:
            for story in stories:
                id_to_story[story.id] = story
        return id_to_story

    def _load_question_points_from_yaml(
        self, file_path: Path = DEFAULT_QUESTION_POINTS_FILE
    ) -> List[ProactiveQuestionPoint]:
        """Loads question points from a YAML file using the generic loader."""
        logger.info(f"Loading question points from: {file_path}")
        id_to_question_points = {}
        question_points = load_models_from_yaml(file_path, ProactiveQuestionPoint)
        if not question_points:
            logger.warning(f"No question points were loaded from {file_path}.")
        else:
            for question_point in question_points:
                question_points = id_to_question_points.get(
                    question_point.storyId, []
                )  # Get the list of question points for the story
                question_points.append(
                    question_point
                )  # Add the question point to the list
                id_to_question_points[question_point.storyId] = (
                    question_points  # Update the list of question points for the story
                )

        return id_to_question_points

    def _load_transcriptions(self) -> Dict[str, StoryTranscription]:
        def _get_story_transcription_file(storyId: str) -> str:
            return os.path.join(
                DEFAULT_STORY_DIR, storyId, "transcription_processed.json"
            )

        return {
            story.id: load_transcription_from_json(
                _get_story_transcription_file(story.id)
            )
            for story in self.id_to_story.values()
        }


if __name__ == "__main__":
    story_service = StoryService()
    print(story_service.get_story_transcription("2"))
