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
    """
    Model representing an action to be sent to the frontend.
    
    This is provided for backward compatibility with older code.
    New code should use the Message models from websocket.message_types.
    """
    type: str  # Changed from action_type to match new protocol
    payload: Dict[str, Any]
    timestamp: Optional[float] = None 