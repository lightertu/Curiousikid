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


class CurrentStory(StoryMetadata):
    currentTime: float


class QuestionPoint(BaseModel):
    id: str
    storyId: str
    userId: str
    question: str
    interruptAt: float


class ProactiveQuestionPoint(QuestionPoint):
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
