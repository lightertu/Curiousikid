from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Story(BaseModel):
    """Model representing a story"""
    id: str
    title: str
    cover_image_url: str
    author: str
    description: str
    duration_seconds: int
    tags: List[str] = Field(default_factory=list)


class Action(BaseModel):
    """Model representing an action to be sent to the frontend"""
    action_type: str
    payload: Dict[str, Any]
    timestamp: Optional[float] = None 