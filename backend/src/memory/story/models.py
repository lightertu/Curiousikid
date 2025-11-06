from typing import List, Optional
from pydantic import BaseModel, Field, computed_field

from memory.pixel_art_loader import load_pixel_art_cover_from_yaml


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
    transcriptUrl: str
    voiceId: Optional[str] = None
    # Internal field to store the relative path, excluded from serialization
    pixelArtCoverFile: str

    pixelArtCoverCache: Optional[List[List[str]]] = Field(default=None, exclude=True)

    # Use computed_field to include the result of this property in serialization
    @computed_field
    @property
    def pixelArtCover(self) -> List[List[str]]:
        if self.pixelArtCoverCache is not None:  # Check attribute directly
            return self.pixelArtCoverCache
        else:
            # Lazy load and cache
            pixelArtCover = load_pixel_art_cover_from_yaml(self.pixelArtCoverFile)
            object.__setattr__(self, "pixelArtCoverCache", pixelArtCover)
            return pixelArtCover

    model_config = {
        "validate_assignment": True,  # Recommended for catching errors
    }


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
