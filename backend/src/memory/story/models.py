from typing import List, Optional
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
    pixelArtCover: Optional[List[List[str]]] = None


class CurrentStory(StoryMetadata):
    currentTime: float


class QuestionPoint(BaseModel):
    storyId: str
    userId: str
    interruptAt: float


class ProactiveQuestionPoint(QuestionPoint):
    id: str
    question: str
    connectAt: float


class UserQuestionPoint(QuestionPoint):
    pass


class Segment(BaseModel):
    start: float
    end: float
    text: str


class StoryTranscription(BaseModel):
    text: str
    segments: List[Segment]
