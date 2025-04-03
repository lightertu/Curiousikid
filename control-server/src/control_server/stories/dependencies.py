from control_server.stories.service import StoryService


async def get_story_service() -> StoryService:
    return StoryService()