from storage.story.service import StoryService


async def get_story_service() -> StoryService:
    return StoryService()