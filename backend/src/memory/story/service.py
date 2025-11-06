import logging
from pathlib import Path
from typing import List, Optional, Dict, Type
import json
import os
from concurrent.futures import ProcessPoolExecutor

import ffmpeg
import torch
import whisper
from tqdm import tqdm

from environment.config import MEMORY_ROOT
from memory.story.models import (
    QuestionPoint,
    ProactiveQuestionPoint,
    StoryMetadata,
    StoryTranscription,
    Segment,
)
from memory.data_loader import load_models_from_yaml, load_transcription_from_json

logger = logging.getLogger(__name__)

DEFAULT_STORIES_FILE = Path(os.path.join(MEMORY_ROOT, "story", "data", "stories.yml"))
DEFAULT_STORY_DIR = Path(os.path.join(MEMORY_ROOT, "story", "data", "stories"))
DEFAULT_QUESTION_POINTS_FILE = Path(
    os.path.join(MEMORY_ROOT, "story", "data", "proactive_question_points.yml")
)


class StoryService:
    def __init__(self, whisper_model_name: str = "large-v3"):
        self.id_to_story = self._load_stories_from_yaml()
        self.story_id_to_question_points = self._load_question_points_from_yaml()
        self.story_id_to_transcription = self._load_transcriptions()
        # Transcription settings
        self.whisper_model_name = whisper_model_name
        self.NUM_GPUS = torch.cuda.device_count()
        self.max_workers = self.NUM_GPUS if self.NUM_GPUS > 0 else os.cpu_count()

    def get_story(self, id: str) -> StoryMetadata:
        return self.id_to_story.get(id)

    def get_story_mp3(self, story_id: str) -> str:
        return os.path.join(DEFAULT_STORY_DIR, story_id, "audio.mp3")

    def get_stories(self) -> List[StoryMetadata]:
        return list(self.id_to_story.values())

    def get_question_points(self, story_id: str) -> List[ProactiveQuestionPoint]:
        return self.story_id_to_question_points.get(story_id)

    def get_question_point_context(self, question_point: Type[QuestionPoint]) -> str:
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

    def get_story_voice_id(self, storyId: str) -> Optional[str]:
        story = self.id_to_story.get(storyId)
        if story:
            return story.voiceId
        return None

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

    # ==================== Transcription Generation Methods ====================

    def _get_story_folder(self, story_id: str) -> Path:
        """Get the specific folder path for a given story ID."""
        story_dir = DEFAULT_STORY_DIR / story_id
        story_dir.mkdir(parents=True, exist_ok=True)
        return story_dir

    def _get_source_audio_path(self, story_id: str) -> Path:
        """Constructs the full path to the source audio file."""
        story = self.get_story(story_id)
        if not story:
            raise ValueError(f"Story with ID {story_id} not found")
        # Audio files are stored as audio.mp3 in each story folder
        return DEFAULT_STORY_DIR / story_id / "audio.mp3"

    def _get_wav_file_path(self, story_id: str) -> Path:
        """Get the expected path for the WAV file of a story."""
        story_dir = self._get_story_folder(story_id)
        return story_dir / "audio.wav"

    def _get_raw_transcription_path(self, story_id: str) -> Path:
        """Get the path for raw transcription JSON."""
        story_dir = self._get_story_folder(story_id)
        return story_dir / "transcription_raw.json"

    def _get_processed_transcription_path(self, story_id: str) -> Path:
        """Get the path for processed transcription JSON."""
        story_dir = self._get_story_folder(story_id)
        return story_dir / "transcription_processed.json"

    def _convert_audio_to_wav(self, story_id: str) -> Path:
        """Converts the source audio file for a story to WAV format."""
        source_audio_path = self._get_source_audio_path(story_id)
        wav_path = self._get_wav_file_path(story_id)

        # Check if source audio exists
        if not source_audio_path.exists():
            raise FileNotFoundError(
                f"ERROR: Source audio file not found for story {story_id}: {source_audio_path}"
            )

        # Skip if WAV file already exists
        if wav_path.exists():
            logger.info(f"WAV already exists: {wav_path}")
            return wav_path

        # Perform Conversion using FFmpeg
        logger.info(
            f"Converting {source_audio_path.name} to {wav_path.name} for story {story_id}"
        )
        try:
            (
                ffmpeg.input(str(source_audio_path))
                .output(str(wav_path), acodec="pcm_s16le", ac=1, ar="16000")
                .run(overwrite_output=True, quiet=True)
            )
            logger.info(
                f"Converted {source_audio_path.name} to {wav_path.name} for story {story_id}"
            )
            return wav_path
        except ffmpeg.Error as e:
            logger.error(
                f"ERROR converting {source_audio_path.name} for story {story_id}: {e}"
            )
            if e.stderr:
                logger.error(f"FFmpeg stderr: {e.stderr.decode()}")
            raise e

    def _merge_transcription(self, result: dict) -> dict:
        """Merges transcription segments at sentence boundaries."""
        merged_segments = []
        buffer = ""
        start_time = None
        end_time = None

        for segment in result["segments"]:
            if start_time is None:
                start_time = segment["start"]

            buffer += segment["text"].strip() + " "

            if buffer.strip() and buffer.strip()[-1] in {".", "?", "!", ",", ":", ";"}:
                end_time = segment["end"]

                if buffer.strip()[-1] in {".", "?", "!"}:
                    merged_segments.append(
                        {"start": start_time, "end": end_time, "text": buffer.strip()}
                    )
                    buffer = ""
                    start_time = None
                    end_time = None

        if buffer.strip():
            final_end_time = (
                end_time if end_time is not None else result["segments"][-1]["end"]
            )
            merged_segments.append(
                {
                    "start": start_time
                    if start_time is not None
                    else result["segments"][-1]["start"],
                    "end": final_end_time,
                    "text": buffer.strip(),
                }
            )

        result["segments"] = merged_segments
        return result

    def _transcribe_wav(self, story_id: str, device: Optional[str] = None):
        """Transcribes a single story's WAV file using Whisper."""
        # Determine device
        if device is None:
            # Check if we're in a multiprocessing context
            current_process = torch.multiprocessing.current_process()
            if hasattr(current_process, '_identity') and current_process._identity:
                process_id = current_process._identity[0] if self.NUM_GPUS > 0 else 0
            else:
                # We're in the main process
                process_id = 0

            gpu_id = process_id % self.NUM_GPUS if self.NUM_GPUS > 0 else -1
            device = f"cuda:{gpu_id}" if gpu_id >= 0 else "cpu"

        wav_path = self._get_wav_file_path(story_id)
        raw_json_path = self._get_raw_transcription_path(story_id)
        processed_json_path = self._get_processed_transcription_path(story_id)

        if not wav_path.exists():
            logger.warning(
                f"Skipping transcription for story {story_id}: WAV file not found at {wav_path}"
            )
            return

        if processed_json_path.exists():
            logger.info(
                f"Processed transcription already exists for story {story_id}: {processed_json_path}"
            )
            return

        logger.info(f"Transcribing {wav_path.name} for story {story_id} on {device}...")
        model = whisper.load_model(name=self.whisper_model_name, device=device)
        result = model.transcribe(str(wav_path), verbose=False, language="en")

        # Save raw transcription
        try:
            with open(raw_json_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=4, ensure_ascii=False)
            logger.info(
                f"Raw transcription saved for story {story_id}: {raw_json_path}"
            )
        except IOError as e:
            logger.error(f"ERROR saving raw transcription for story {story_id}: {e}")
            return

        # Merge and save processed transcription
        merged_transcription = self._merge_transcription(result)
        try:
            with open(processed_json_path, "w", encoding="utf-8") as f:
                json.dump(merged_transcription, f, indent=4, ensure_ascii=False)
            logger.info(
                f"Processed transcription saved for story {story_id}: {processed_json_path}"
            )
        except IOError as e:
            logger.error(
                f"ERROR saving processed transcription for story {story_id}: {e}"
            )

    def generate_transcription(self, story_id: str) -> Optional[StoryTranscription]:
        """
        Generate transcription for a single story.

        Args:
            story_id: The ID of the story to transcribe

        Returns:
            The generated StoryTranscription object, or None if generation failed

        Raises:
            ValueError: If story_id is not found
            FileNotFoundError: If source audio file is missing
        """
        logger.info(f"Starting transcription generation for story {story_id}")

        # Validate story exists
        if story_id not in self.id_to_story:
            raise ValueError(f"Story with ID {story_id} not found")

        # Step 1: Convert audio to WAV
        self._convert_audio_to_wav(story_id)

        # Step 2: Transcribe WAV file
        self._transcribe_wav(story_id)

        # Step 3: Load and cache the transcription
        processed_json_path = self._get_processed_transcription_path(story_id)
        if processed_json_path.exists():
            transcription = load_transcription_from_json(str(processed_json_path))
            self.story_id_to_transcription[story_id] = transcription
            logger.info(f"Transcription generation completed for story {story_id}")
            return transcription
        else:
            logger.error(
                f"Transcription file not found after generation: {processed_json_path}"
            )
            return None

    def generate_all_transcriptions(self):
        """
        Generate transcriptions for all stories in parallel.

        This method processes all stories that don't already have transcriptions.
        It uses parallel processing for efficiency.
        """
        logger.info("Starting batch transcription generation for all stories")

        # Step 1: Convert all audio to WAV
        logger.info("Step 1: Converting audio files to WAV...")
        story_ids = list(self.id_to_story.keys())

        def convert_wrapper(story_id):
            try:
                self._convert_audio_to_wav(story_id)
            except Exception as e:
                logger.error(f"Failed to convert audio for story {story_id}: {e}")

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            list(
                tqdm(
                    executor.map(convert_wrapper, story_ids),
                    total=len(story_ids),
                    desc="Converting audio",
                )
            )

        # Step 2: Transcribe all WAV files
        logger.info("Step 2: Transcribing WAV files...")

        def transcribe_wrapper(story_id):
            try:
                self._transcribe_wav(story_id)
            except Exception as e:
                logger.error(f"Failed to transcribe story {story_id}: {e}")

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            list(
                tqdm(
                    executor.map(transcribe_wrapper, story_ids),
                    total=len(story_ids),
                    desc="Transcribing",
                )
            )

        # Step 3: Reload all transcriptions into cache
        logger.info("Step 3: Reloading transcriptions into cache...")
        self.story_id_to_transcription = self._load_transcriptions()

        logger.info("Batch transcription generation completed for all stories")


if __name__ == "__main__":
    story_service = StoryService()
    print(story_service.generate_transcription("6"))
