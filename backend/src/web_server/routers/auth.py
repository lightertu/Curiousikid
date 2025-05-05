from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta
import uuid

from ..models.models import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenData,
    GoogleSignIn,
    OTPRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)
from ..db.memory_db import db
from ..auth.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_user_by_email,
    generate_otp,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenData)
async def signup(user_data: UserCreate):
    # Check if email already exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email is already in use."
        )

    # Create new user
    user_id = str(uuid.uuid4())
    current_time = datetime.now()

    new_user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "img": "",
        "google_sign_in": False,
        "podcasts": [],
        "favorits": [],
        "created_at": current_time,
        "updated_at": current_time,
    }

    db.users[user_id] = new_user

    # Create token
    token = create_access_token({"id": user_id})

    # Prepare user response (without password)
    user_response = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "img": "",
        "google_sign_in": False,
        "podcasts": [],
        "favorits": [],
        "created_at": current_time,
        "updated_at": current_time,
    }

    return {"token": token, "user": user_response}


@router.post("/signin", response_model=TokenData)
async def signin(user_data: UserLogin):
    user = authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user["google_sign_in"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Entered email is Signed Up with google account. Please SignIn with google.",
        )

    token = create_access_token({"id": user["id"]})

    # Prepare user response (without password)
    user_response = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "img": user["img"],
        "google_sign_in": user["google_sign_in"],
        "podcasts": user["podcasts"],
        "favorits": user["favorits"],
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
    }

    return {"token": token, "user": user_response}


@router.post("/google", response_model=TokenData)
async def google_auth_sign_in(user_data: GoogleSignIn):
    # Check if user exists
    existing_user = get_user_by_email(user_data.email)
    current_time = datetime.now()

    if not existing_user:
        # Create new user
        user_id = str(uuid.uuid4())

        new_user = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "password": "",
            "img": user_data.img or "",
            "google_sign_in": True,
            "podcasts": [],
            "favorits": [],
            "created_at": current_time,
            "updated_at": current_time,
        }

        db.users[user_id] = new_user
        token = create_access_token({"id": user_id})

        # Prepare user response
        user_response = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "img": user_data.img or "",
            "google_sign_in": True,
            "podcasts": [],
            "favorits": [],
            "created_at": current_time,
            "updated_at": current_time,
        }

        return {"token": token, "user": user_response}
    elif existing_user["google_sign_in"]:
        # User exists and has Google sign in
        token = create_access_token({"id": existing_user["id"]})

        # Prepare user response
        user_response = {
            "id": existing_user["id"],
            "name": existing_user["name"],
            "email": existing_user["email"],
            "img": existing_user["img"],
            "google_sign_in": existing_user["google_sign_in"],
            "podcasts": existing_user["podcasts"],
            "favorits": existing_user["favorits"],
            "created_at": existing_user["created_at"],
            "updated_at": existing_user["updated_at"],
        }

        return {"token": token, "user": user_response}
    else:
        # User exists but not with Google sign in
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already exists with this email can't do google auth",
        )


@router.post("/logout")
async def logout():
    # In a stateless API, we don't need to do anything on the server
    # The client should discard the token
    return {"message": "Logged out"}


@router.get("/generateotp")
async def generate_otp_endpoint(email: str, name: str, reason: str = "SIGNUP"):
    # Generate OTP
    db.otp = generate_otp()

    # In a real implementation, this would send an email
    # For this mock, we'll just print the OTP
    print(f"OTP for {email}: {db.otp}")

    return {"message": "OTP sent"}


@router.get("/verifyotp")
async def verify_otp(code: str):
    if not db.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP has been generated"
        )

    if code == db.otp:
        db.otp = None
        db.reset_session = True
        return {"message": "OTP verified"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wrong OTP")


@router.get("/createResetSession")
async def create_reset_session():
    if db.reset_session:
        db.reset_session = False
        return {"message": "Access granted"}

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Session expired"
    )


@router.get("/findbyemail")
async def find_user_by_email(email: str):
    user = get_user_by_email(email)
    if user:
        return {"message": "User found"}
    return {"message": "User not found"}


@router.put("/forgetpassword")
async def reset_password(data: ResetPasswordRequest):
    if not db.reset_session:
        raise HTTPException(
            status_code=status.HTTP_440_FAILED_DEPENDENCY, detail="Session expired"
        )

    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Update password
    hashed_password = get_password_hash(data.password)
    user_id = user["id"]
    db.users[user_id]["password"] = hashed_password
    db.users[user_id]["updated_at"] = datetime.now()

    db.reset_session = False

    return {"message": "Password reset successful"}
