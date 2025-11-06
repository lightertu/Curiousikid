import logging
import os
import ffmpeg
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

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
    start_time: int = Query(68, description="Start time in seconds"),
):
    """
    Serves an MP3 audio file.
    """
    story = story_service.get_story(id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    file_path = story_service.get_story_mp3(id)
    logger.info(f"Attempting to serve audio file: {file_path}")

    if not os.path.isfile(file_path):
        logger.error(f"Audio file not found: {file_path}")
        raise HTTPException(status_code=404, detail="Audio file not found")

    async def iterfile():
        process = (
            ffmpeg
            .input(file_path, ss=start_time)
            .output('pipe:', format='mp3')
            .run_async(pipe_stdout=True, pipe_stderr=True)
        )
        while True:
            chunk = process.stdout.read(8192)
            if not chunk:
                break
            yield chunk
        process.wait()

    return StreamingResponse(iterfile(), media_type="audio/mpeg")
