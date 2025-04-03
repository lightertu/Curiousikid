from typing import List
from control_server.common.models import StoryMetadata
from control_server.common.story_loader import load_stories_from_yaml


class StoryService:
    def __init__(self):
        self.stories = {story.id: story for story in load_stories_from_yaml()}

    def get_story(self, id: str) -> StoryMetadata:
        return self.stories.get(id) 
        
    def get_story_audio(self, id: str) -> str:
        story = self.get_story(id)
        return story.audioFilePath

    def get_stories(self) -> List[StoryMetadata]:
        return list(self.stories.values())
