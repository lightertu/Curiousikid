from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import routers
from .routers import auth, podcast, user

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Curiousikid Podcast API",
    description="Backend API for the Curiousikid podcast platform",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://curiousikid.com",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(podcast.router)
app.include_router(user.router)


# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Curiousikid Podcast API", "documentation": "/docs"}


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
