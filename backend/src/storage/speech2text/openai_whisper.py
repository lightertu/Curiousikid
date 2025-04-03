import argparse
import asyncio
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import os

import aiohttp
import ffmpeg
import torch
import whisper
import yaml
from tqdm import tqdm

from control_server.core.story_loader import load_stories_from_yaml
from control_server.core.models import StoryMetadata
from control_server.environment.config import PROJECT_ROOT

class WhisperTranscriber:
    """Transcribes audio files listed in a metadata YAML using OpenAI Whisper."""

    def __init__(self, metadata_file: str, model_name: str = "large-v3"):
        """Initialize the transcriber.

        Args:
            metadata_file (str): Path to the metadata YAML file (e.g., data/stories/metadata.yml).
            model_name (str): The name of the Whisper model to use (e.g., 'base', 'small', 'medium', 'large-v3').
        """
        self.metadata_file = Path(metadata_file)
        self.model_name = model_name
        
        self.stories_base_dir = PROJECT_ROOT / "data" / "stories"
        self.stories_base_dir.mkdir(parents=True, exist_ok=True)
        print(f"Using stories base directory: {self.stories_base_dir}")

        self.stories = load_stories_from_yaml(self.metadata_file)
        print(f"Loaded {len(self.stories)} stories from {self.metadata_file}")
        if not self.stories:
            raise ValueError("No stories loaded. Check metadata file path and content.")

        self.NUM_GPUS = torch.cuda.device_count()
        self.max_workers = self.NUM_GPUS if self.NUM_GPUS > 0 else os.cpu_count()

    def _get_story_folder(self, story: StoryMetadata) -> Path:
        """Get the specific folder path for a given story ID."""
        # Construct the path: data/stories/{story.id}
        story_dir = self.stories_base_dir / story.id 
        # Create the directory if it doesn't exist
        story_dir.mkdir(parents=True, exist_ok=True) 
        # Return the path
        return story_dir 

    def get_source_audio_path(self, story: StoryMetadata) -> Path:
        """Constructs the full path to the source audio file."""
        # PROJECT_ROOT / data / stories / {story.id} / {story.audioUrl_filename}
        return self.stories_base_dir / story.id / story.audioUrl

    def get_wav_file_path(self, story: StoryMetadata) -> Path:
        """Get the expected path for the WAV file of a story."""
        # Get the story-specific folder
        story_dir = self._get_story_folder(story) 
        # Define the WAV filename
        filename = f"story.wav" 
        # Return the full path
        return story_dir / filename 

    def get_raw_transcription_path(self, story: StoryMetadata) -> Path:
        story_dir = self._get_story_folder(story)
        filename = f"transcription_raw.json"
        return story_dir / filename

    def get_processed_transcription_path(self, story: StoryMetadata) -> Path:
        story_dir = self._get_story_folder(story)
        filename = f"transcription_processed.json"
        return story_dir / filename

    def _convert_audio_to_wav(self, story: StoryMetadata):
        """Converts the source audio file for a story to WAV format."""
        # Use the new helper to get the source path
        source_audio_path = self.get_source_audio_path(story) 
        # Get the target path for the WAV file
        wav_path = self.get_wav_file_path(story) 
        
        # Check if source audio exists
        if not source_audio_path.exists():
            # Raise error if source is missing, as conversion is impossible
            raise FileNotFoundError(f"ERROR: Source audio file not found for story {story.id}: {source_audio_path}") 
            
        # Log the conversion process
        print(f"Converting {source_audio_path.name} to {wav_path.name} for story {story.id}") 

        # Skip if WAV file already exists
        if wav_path.exists(): 
            print(f"WAV already exists: {wav_path}") 
            return wav_path # Return existing path

        # --- Perform Conversion using FFmpeg ---
        try:
            ( 
                ffmpeg
                .input(str(source_audio_path)) # Input file
                .output(str(wav_path), acodec='pcm_s16le', ac=1, ar='16000') # Output WAV, force mono, 16kHz
                .run(overwrite_output=True, quiet=True) # Execute conversion
            )
            print(f"Converted {source_audio_path.name} to {wav_path.name} for story {story.id}") 
            return wav_path 
        except ffmpeg.Error as e:
            print(f"ERROR converting {source_audio_path.name} for story {story.id}: {e}") 
            print(f"FFmpeg stderr: {e.stderr.decode() if e.stderr else 'N/A'}") 
            # Re-raise or handle appropriately if conversion failure should stop the process
            raise e # Or return None if you want to try continuing with other stories

    def _convert_all_audio_to_wav(self):
        print("Converting source audio files to WAV...")
        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            list(tqdm(executor.map(self._convert_audio_to_wav, self.stories), total=len(self.stories)))
        print("Finished converting audio to WAV.")

    def _transcribe_wav(self, story: StoryMetadata):
        process_id = torch.multiprocessing.current_process()._identity[0] if self.NUM_GPUS > 0 else 0
        gpu_id = process_id % self.NUM_GPUS if self.NUM_GPUS > 0 else -1
        device = f"cuda:{gpu_id}" if gpu_id >= 0 else "cpu"

        wav_path = self.get_wav_file_path(story)
        raw_json_path = self.get_raw_transcription_path(story)
        processed_json_path = self.get_processed_transcription_path(story)

        if not wav_path.exists():
            print(f"Skipping transcription for story {story.id}: WAV file not found at {wav_path}")
            return

        if processed_json_path.exists():
            print(f"Processed transcription already exists for story {story.id}: {processed_json_path}")
            return

        print(f"Transcribing {wav_path.name} for story {story.id} on {device}...")
        model = whisper.load_model(name=self.model_name, device=device)
        result = model.transcribe(str(wav_path), verbose=False, language="en")

        try:
            with open(raw_json_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=4, ensure_ascii=False)
            print(f"Raw transcription saved for story {story.id}: {raw_json_path}")
        except IOError as e:
            print(f"ERROR saving raw transcription for story {story.id}: {e}")
            return

        merged_transcription = self.merge_transcription(result)
        try:
            with open(processed_json_path, 'w', encoding='utf-8') as f:
                json.dump(merged_transcription, f, indent=4, ensure_ascii=False)
            print(f"Processed transcription saved for story {story.id}: {processed_json_path}")
        except IOError as e:
            print(f"ERROR saving processed transcription for story {story.id}: {e}")

    def merge_transcription(self, result):
        merged_segments = []
        buffer = ""
        start_time = None
        end_time = None

        for segment in result['segments']:
            if start_time is None:
                start_time = segment['start']

            buffer += segment['text'].strip() + " "

            if buffer.strip() and buffer.strip()[-1] in {'.', '?', '!', ',', ':', ';'}:
                end_time = segment['end']

                if buffer.strip()[-1] in {'.', '?', '!'}:
                    merged_segments.append({
                        'start': start_time,
                        'end': end_time,
                        'text': buffer.strip()
                    })
                    buffer = ""
                    start_time = None
                    end_time = None

        if buffer.strip():
            final_end_time = end_time if end_time is not None else result['segments'][-1]['end']
            merged_segments.append({
                'start': start_time if start_time is not None else result['segments'][-1]['start'],
                'end': final_end_time,
                'text': buffer.strip()
            })

        result['segments'] = merged_segments
        return result

    def _transcribe_all_wav(self):
        print("Transcribing all WAV files...")
        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            list(tqdm(executor.map(self._transcribe_wav, self.stories), total=len(self.stories)))
        print("Finished transcribing WAV files.")

    def transcribe(self):
        print("Step 1: Converting audio to WAV...")
        self._convert_all_audio_to_wav()

        print("\nStep 2: Transcribing WAV files...")
        self._transcribe_all_wav()

        print("\nTranscription process completed.")

def main():
    parser = argparse.ArgumentParser(description="Transcribe stories defined in a metadata YAML using Whisper.")

    parser.add_argument(
        '--metadata-file',
        type=str,
        default=str(PROJECT_ROOT / "data" / "stories" / "metadata.yml"),
        help="Path to the story metadata YAML file (default: data/stories/metadata.yml)"
    )
    parser.add_argument(
        '--model',
        type=str,
        default="large-v3",
        help="Name of the Whisper model to use (e.g., tiny, base, small, medium, large-v3)"
    )

    args = parser.parse_args()
    
    print(f"Starting transcription process...")
    print(f"  Metadata File: {args.metadata_file}")
    print(f"  Whisper Model: {args.model}")

    try:
        transcriber = WhisperTranscriber(
            metadata_file=args.metadata_file,
            model_name=args.model
        )
        transcriber.transcribe()
    except Exception as e:
        print(f"\nAn error occurred during transcription: {e}")

    print("\nScript finished.")

if __name__ == "__main__":
    torch.multiprocessing.set_start_method('spawn', force=True)
    main()
