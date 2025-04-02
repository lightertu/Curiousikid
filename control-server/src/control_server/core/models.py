from typing import Optional
from pydantic import BaseModel

# -----------------------------
# Define Pydantic models
# -----------------------------
class StoryMetadata(BaseModel):
    id: str
    title: str
    description: str
    artist: str
    audioUrl: str
    duration: float
    thumbnailUrl: str
    transcriptUrl: Optional[str] = None

class CurrentStory(StoryMetadata):
    currentTime: float
    
class QuestionPoint(BaseModel):
    storyId: str
    questionPointId: str
    connectAt: float
    interruptAt: float