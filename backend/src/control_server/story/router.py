import logging
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from control_server.story.dependencies import get_story_service
from memory.story.service import StoryService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/v1/stories", tags=["stories"])


@router.get("/{id}/audio")
async def get_story_audio(
    id: str,
    story_service: Annotated[StoryService, Depends(get_story_service)],
):
    """
    Serves an audio file (MP3 or WAV).
    """
    story = story_service.get_story(id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    file_path = story_service.get_story_audio(id)
    logger.info(f"Attempting to serve audio file: {file_path}")

    if not os.path.isfile(file_path):
        logger.error(f"Audio file not found: {file_path}")
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Determine the file extension and set the appropriate media type
    if file_path.endswith('.wav'):
        return FileResponse(path=file_path, media_type="audio/wav", filename="audio.wav")
    else:
        return FileResponse(path=file_path, media_type="audio/mpeg", filename="audio.mp3") 
