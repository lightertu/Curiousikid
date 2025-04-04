import os
import yaml
import logging
import json
from typing import List, Type, TypeVar, Optional
from pydantic import BaseModel, ValidationError
from pathlib import Path
from memorystory.models import StoryMetadata, StoryTranscription
from environment.config import PROJECT_ROOT

# --- Basic Logging Setup --- 
# Configures the root logger. Call this once, ideally at application startup.
# If your application already configures logging elsewhere, you might not need this here.
logging.basicConfig(
    level=logging.INFO,  # Set the minimum level of messages to handle (e.g., INFO, DEBUG)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Configure logger for this module
logger = logging.getLogger(__name__)

# --- Generic Pydantic Model Loader from YAML --- 
T = TypeVar('T', bound=BaseModel)

def load_models_from_yaml(file_path: Path, model_cls: Type[T]) -> List[T]:
    """Loads a list of Pydantic models from a YAML file."""
    models = []
    model_name = model_cls.__name__

    try:
        # Ensure file_path is a Path object
        if not isinstance(file_path, Path):
            file_path = Path(file_path)

        if not file_path.is_file():
            logger.warning(f"{model_name} source file not found at {file_path}. Returning empty list.")
            return []

        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)

        if not isinstance(data, list):
            logger.warning(f"YAML file {file_path} does not contain a list. Cannot load {model_name} models.")
            return []

        for item in data:
            if not isinstance(item, dict):
                 logger.warning(f"Skipping non-dictionary item in {file_path} when loading {model_name}: {item}")
                 continue
            try:
                model_instance = model_cls(**item)
                models.append(model_instance)
            except ValidationError as e:
                logger.warning(f"Skipping invalid {model_name} data in {file_path}: {item}\nValidation Error: {e}")
            except Exception as e:
                 logger.warning(f"Skipping item due to unexpected error during {model_name} instantiation in {file_path}: {item}\nError: {e}")

        if not models:
             logger.warning(f"No valid {model_name} models found or loaded from {file_path}.")

    except FileNotFoundError:
        logger.warning(f"{model_name} source file not found at {file_path}. Returning empty list.")
    except yaml.YAMLError as e:
        logger.warning(f"Error parsing YAML file {file_path} for {model_name}: {e}. Returning empty list.")
    except Exception as e:
        logger.warning(f"An unexpected error occurred loading {model_name} models from {file_path}: {e}. Returning empty list.")

    return models

# --- Function to load Transcription from JSON --- 
def load_transcription_from_json(file_path: str) -> Optional[StoryTranscription]:
    """Loads and validates StoryTranscription data from a JSON file."""
    model_name = StoryTranscription.__name__

    try:
        # Ensure file_path is a Path object
        if not isinstance(file_path, Path):
            file_path = Path(file_path)

        if not file_path.is_file():
            logger.warning(f"{model_name} source file not found at {file_path}. Returning None.")
            return None

        with open(file_path, 'r') as f:
            data = json.load(f)

        # Validate the loaded data using the Pydantic model
        transcription_model = StoryTranscription(**data)
        logger.info(f"Successfully loaded and validated {model_name} from {file_path}.")
        return transcription_model

    except FileNotFoundError: # Should be caught by is_file check, but kept for robustness
        logger.warning(f"{model_name} source file not found at {file_path}. Returning None.")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON from file {file_path} for {model_name}: {e}. Returning None.")
        return None
    except ValidationError as e:
        logger.error(f"Invalid {model_name} data in {file_path}. Validation Error: {e}. Returning None.")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred loading {model_name} from {file_path}: {e}. Returning None.")
        return None
