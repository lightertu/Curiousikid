from typing import Dict, List, Optional
from pydantic import BaseModel
from control_server.core.conversation import Conversation
class Dialogue(BaseModel):
    role: str
    content: str

class ConnectionStateStore(BaseModel):
    connection_id: str
    connected_at: Optional[float] = None
    handshake_data: Optional[dict] = None
    track_context: Optional[dict] = None
    conversations: Optional[Dict[str, Conversation]] = None
    is_streaming_voice: bool = False 