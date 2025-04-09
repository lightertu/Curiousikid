from typing import List
from pydantic import BaseModel


# -----------------------------
# Define Pydantic models
# -----------------------------
class ChatCharacter(BaseModel):
    id: str
    name: str
    description: str
    imageUrl: str


class UserCharacterMapping(BaseModel):
    userId: str
    characters: List[str]
