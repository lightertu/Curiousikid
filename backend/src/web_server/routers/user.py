from fastapi import APIRouter, HTTPException, Depends, status

from ..models.models import UserResponse
from ..db.memory_db import db
from ..auth.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["Users"])


@router.get("/")
async def get_user(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # In a real application with a database, we would fetch the user here
    # For this mock, we already have the user from the dependency

    # Prepare user response (without password)
    user_response = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "img": current_user["img"],
        "google_sign_in": current_user["google_sign_in"],
        "podcasts": current_user["podcasts"],
        "favorits": current_user["favorits"],
        "created_at": current_user["created_at"],
        "updated_at": current_user["updated_at"],
    }

    return user_response
