from enum import Enum
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel


class MessageType(str, Enum):
    # Connection Management
    HANDSHAKE = "HANDSHAKE"
    HANDSHAKE_RESPONSE = "HANDSHAKE_RESPONSE"
    CONNECTION_KEEP_ALIVE = "CONNECTION_KEEP_ALIVE"
    
    # Track Context
    UPDATE_TRACK_CONTEXT = "UPDATE_TRACK_CONTEXT"
    
    # Playback Control
    PLAYBACK_CONTROL = "PLAYBACK_CONTROL"
    PLAYBACK_STATE = "PLAYBACK_STATE"
    
    # Voice Communication
    VOICE_STREAM_START = "VOICE_STREAM_START"
    VOICE_STREAM_END = "VOICE_STREAM_END"
    VOICE_DATA = "VOICE_DATA"
    
    # Application State
    STATE_UPDATE = "STATE_UPDATE"
    STATE_SYNC_REQUEST = "STATE_SYNC_REQUEST"
    STATE_SYNC_RESPONSE = "STATE_SYNC_RESPONSE"
    
    # Notifications/UI
    NOTIFICATION = "NOTIFICATION"
    ERROR = "ERROR"


# Base message model
class Message(BaseModel):
    type: MessageType
    payload: Dict[str, Any]

class UpdateTrackContextPayload(BaseModel):
    """Payload for track context updates from the client."""
    trackId: str
    duration: float  # Change to float to better match JavaScript's number type
    currentTime: float

# Request payload models
class HandshakePayload(BaseModel):
    user_id: str


class PlaybackControlPayload(BaseModel):
    action: str  # 'play' | 'pause' | 'seek' | 'next' | 'previous'
    trackId: Optional[str] = None
    position: Optional[float] = None


class VoiceStreamStartPayload(BaseModel):
    format: str
    sampleRate: int
    channels: int


class StateSyncRequestPayload(BaseModel):
    clientTime: int


class VoiceStreamEndPayload(BaseModel):
    timestamp: Optional[int] = None


# Response payload models
class HandshakeResponsePayload(BaseModel):
    sessionId: str


class PlaybackStatePayload(BaseModel):
    isPlaying: bool
    currentTrack: Optional[Dict[str, Any]] = None


class StateUpdatePayload(BaseModel):
    path: str
    value: Any


class NotificationPayload(BaseModel):
    type: str  # 'info' | 'warning' | 'error' | 'success'
    message: str
    duration: Optional[int] = None


class ErrorPayload(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class StateSyncResponsePayload(BaseModel):
    serverTime: int
    state: Dict[str, Any] 