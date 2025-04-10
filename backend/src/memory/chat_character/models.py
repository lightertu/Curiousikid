from typing import List, Optional
from pydantic import BaseModel, Field, computed_field
from memory.pixel_art_loader import load_pixel_art_cover_from_yaml


# -----------------------------
# Define Pydantic models
# -----------------------------
class ChatCharacter(BaseModel):
    id: str
    name: str
    background: str
    traits: str
    voice: str
    pixelArtCoverFile: str
    speakingStyle: Optional[str] = None
    description: Optional[str] = None
    speechExamples: Optional[List[str]] = None

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


class UserCharacterMapping(BaseModel):
    userId: str
    characters: List[str]
