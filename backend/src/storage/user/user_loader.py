import os
from typing import List
from pydantic import ValidationError
import yaml
from pathlib import Path
from storage.user.models import User
from environment.config import PROJECT_ROOT

# --- Function to load users from YAML --- 
DEFAULT_USERS_FILE = os.path.join(PROJECT_ROOT, "storage", "user", "data", "users.yml")

def load_users_from_yaml(file_path: Path = DEFAULT_USERS_FILE) -> List[User]:
    """Loads user metadata from a YAML file."""
    users = []
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
        
        if not isinstance(data, list):
            print(f"Warning: YAML file {file_path} does not contain a list. Using empty list.")
            return []

        for item in data:
            try:
                # Load directly from YAML data, do not modify audioUrl here
                user = User(**item) 
                # print(f"Loaded story: {story.id} - {story.title}") # Optional: uncomment for debugging
                users.append(user)
            except ValidationError as e:
                print(f"Warning: Skipping invalid story data in {file_path}: {item}\nError: {e}")
        
        if not users:
             print(f"Warning: No valid users found in {file_path}.")

    except FileNotFoundError:
        print(f"Warning: Stories file not found at {file_path}. Using empty list.")
    except yaml.YAMLError as e:
        print(f"Warning: Error parsing YAML file {file_path}: {e}. Using empty list.")
    except Exception as e:
        print(f"Warning: An unexpected error occurred loading stories from {file_path}: {e}. Using empty list.")
        
    return users
