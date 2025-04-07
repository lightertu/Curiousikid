from pathlib import Path
from typing import List
from environment.config import MEMORY_ROOT
from memory.character.models import ChatCharacter, UserCharacterMapping
from memory.data_loader import load_models_from_yaml
import logging
import os

from memory.user.service import UserService

logger = logging.getLogger(__name__)

DEFAULT_CHARACTERS_FILE = Path(
    os.path.join(MEMORY_ROOT, "character", "data", "characters.yml")
)

DEFAULT_USER_CHARACTER_MAPPINGS_FILE = Path(
    os.path.join(MEMORY_ROOT, "character", "data", "user_character_mapping.yml")
)


def load_characters_from_yaml(
    file_path: Path = DEFAULT_CHARACTERS_FILE,
) -> List[ChatCharacter]:
    """Loads story metadata from a YAML file using the generic loader."""
    logger.info(f"Loading characters from: {file_path}")
    characters = load_models_from_yaml(file_path, ChatCharacter)
    if not characters:
        logger.warning(f"No characters were loaded from {file_path}.")
    return characters


def load_user_character_mappings_from_yaml(
    file_path: Path = DEFAULT_USER_CHARACTER_MAPPINGS_FILE,
) -> List[UserCharacterMapping]:
    """Loads user character mappings from a YAML file using the generic loader."""
    logger.info(f"Loading user character mappings from: {file_path}")
    return load_models_from_yaml(file_path, UserCharacterMapping)


class CharacterService:
    def __init__(self, user_service: UserService):
        self.characters = {
            character.id: character for character in load_characters_from_yaml()
        }
        self.user_character_mappings = {
            mapping.userId: mapping
            for mapping in load_user_character_mappings_from_yaml()
        }

        self.user_service = user_service

    def get_character(self, id: str) -> ChatCharacter:
        return self.characters.get(id)

    def get_characters(self, user_id: str) -> List[ChatCharacter]:
        user = self.user_service.get_user(user_id)

        if user.id not in self.user_character_mappings:
            raise ValueError(f"No user character mappings found for user {user.id}")

        return [
            self.characters[character_id]
            for character_id in self.user_character_mappings[user.id].characters
        ]


if __name__ == "__main__":
    characters = load_characters_from_yaml()
    print(characters)
