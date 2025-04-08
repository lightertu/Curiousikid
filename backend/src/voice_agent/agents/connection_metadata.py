from enum import Enum
from pydantic import BaseModel


class AgentType(Enum):
    PROACTIVE_QUESTION = "proactive_question"
    CHAT_CHARACTER = "chat_character"
    USER_QUESTION = "user_question"


class ParticipantConnectionMetadata(BaseModel):
    agentType: AgentType
    userId: str
