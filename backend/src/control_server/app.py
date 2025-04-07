import logging

from fastapi import FastAPI  # <-- Add HTTPException
from fastapi.middleware.cors import CORSMiddleware

from control_server.story.router import router as stories_router
from control_server.websocket.router import router as websocket_router

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Curiousikid API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stories_router)
app.include_router(websocket_router)
