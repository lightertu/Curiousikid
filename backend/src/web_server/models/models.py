from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
import uuid


class EpisodeBase(BaseModel):
    name: str
    desc: str
    thumbnail: Optional[str] = ""
    type: str = "audio"
    duration: Optional[str] = ""
    file: Optional[str] = ""


class EpisodeCreate(EpisodeBase):
    pass


class Episode(EpisodeBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PodcastBase(BaseModel):
    name: str
    desc: str
    thumbnail: Optional[str] = ""
    tags: List[str] = []
    type: str = "audio"
    category: str = "podcast"


class PodcastCreate(PodcastBase):
    episodes: List[EpisodeCreate] = []


class Podcast(PodcastBase):
    id: str
    creator_id: str
    episodes: List[Episode] = []
    views: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class GoogleSignIn(UserBase):
    img: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: str
    img: Optional[str] = ""
    google_sign_in: bool = False
    podcasts: List[str] = []
    favorits: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: str
    img: Optional[str] = ""
    google_sign_in: bool = False
    podcasts: List[str] = []
    favorits: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    token: str
    user: UserResponse


class OTPRequest(BaseModel):
    email: EmailStr
    name: str
    reason: Optional[str] = "SIGNUP"


class VerifyOTPRequest(BaseModel):
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    password: str
