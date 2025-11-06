import os
import json
from typing import List, TypedDict

from livekit.agents import llm

from environment.config import PROJECT_ROOT
from memory.story.models import StoryMetadata


class MemoryMessage(TypedDict):
    role: str
    message: str


class DialogueSession(TypedDict):
    story_name: str
    story_description: str
    messages: List[llm.ChatMessage]


class FileSystemMemory:
    def __init__(self, file_path: str = PROJECT_ROOT / ".memory" / "user_memory.jsonl"):
        self.file_path = file_path
        if not os.path.exists(self.file_path):
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            with open(self.file_path, "w") as f:
                f.write("")

    def add_session(self, dialogue_session: DialogueSession):
        """Append a chat message object to the memory file as a JSON line."""
        serialized = json.dumps(dialogue_session)
        with open(self.file_path, "a") as f:
            f.write(serialized + "\n")

    def get(self):
        """Return the entire file contents as a string."""
        with open(self.file_path, "r") as f:
            return f.read()
