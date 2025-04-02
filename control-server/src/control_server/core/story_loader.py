import os
from typing import List
from pydantic import ValidationError
import yaml
from pathlib import Path
from control_server.core.models import StoryMetadata
from control_server.environment.config import PROJECT_ROOT

# --- Function to load stories from YAML --- 
DEFAULT_STORIES_FILE = os.path.join(PROJECT_ROOT, "data", "stories", "metadata.yml")

def load_stories_from_yaml(file_path: Path = DEFAULT_STORIES_FILE) -> List[StoryMetadata]:
    """Loads story metadata from a YAML file."""
    stories = []
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
        
        if not isinstance(data, list):
            print(f"Warning: YAML file {file_path} does not contain a list. Using empty list.")
            return []

        for item in data:
            try:
                # Load directly from YAML data, do not modify audioUrl here
                story = StoryMetadata(**item) 
                # print(f"Loaded story: {story.id} - {story.title}") # Optional: uncomment for debugging
                stories.append(story)
            except ValidationError as e:
                print(f"Warning: Skipping invalid story data in {file_path}: {item}\nError: {e}")
        
        if not stories:
             print(f"Warning: No valid stories found in {file_path}.")

    except FileNotFoundError:
        print(f"Warning: Stories file not found at {file_path}. Using empty list.")
    except yaml.YAMLError as e:
        print(f"Warning: Error parsing YAML file {file_path}: {e}. Using empty list.")
    except Exception as e:
        print(f"Warning: An unexpected error occurred loading stories from {file_path}: {e}. Using empty list.")
        
    return stories

def transcribe_story(story: StoryMetadata) -> StoryMetadata:
    """Transcribes a story and returns a new StoryMetadata object with the transcript."""
    pass