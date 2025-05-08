from typing import List
from pydantic import BaseModel


class Creator(BaseModel):
    name: str
    img: str


class Episode(BaseModel):
    id: str
    name: str
    desc: str
    file: str
    creator: Creator


class Podcast(BaseModel):
    id: str
    name: str
    category: str
    desc: str
    thumbnail: str
    type: str
    views: int
    creator: Creator
    tags: List[str]
    episodes: List[Episode]
    createdAt: str
