import json
import time
import asyncio
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from curiousikid.models import Story, Action
from curiousikid.data import SAMPLE_STORIES

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

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_action(self, action: Action, websocket: WebSocket):
        await websocket.send_json(action.model_dump())

    async def broadcast(self, action: Action):
        for connection in self.active_connections:
            await connection.send_json(action.model_dump())

# Initialize the connection manager
manager = ConnectionManager()

# REST endpoint to list stories
@app.get("/api/stories", response_model=List[Story])
async def list_stories():
    """Returns a list of available stories"""
    return SAMPLE_STORIES

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send a welcome action when client connects
        welcome_action = Action(
            action_type="WELCOME", 
            payload={"message": "Connected to Curiousikid WebSocket"}, 
            timestamp=time.time()
        )
        await manager.send_action(welcome_action, websocket)
        
        # Listen for events from the client
        while True:
            # Wait for message from client
            data = await websocket.receive_text()
            
            # Process incoming data
            try:
                event_data = json.loads(data)
                event_type = event_data.get("event_type", "")
                
                # Create an appropriate action based on the event
                response_action = Action(
                    action_type="EVENT_RECEIVED",
                    payload={
                        "received_event": event_type,
                        "message": f"Server received event: {event_type}",
                        "data": event_data
                    },
                    timestamp=time.time()
                )
                
                # Send action back to client
                await manager.send_action(response_action, websocket)
                
            except json.JSONDecodeError:
                # If not valid JSON, send error
                error_action = Action(
                    action_type="ERROR",
                    payload={"message": "Invalid JSON format"},
                    timestamp=time.time()
                )
                await manager.send_action(error_action, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        
        # Notify other clients (optional)
        disconnect_action = Action(
            action_type="USER_DISCONNECTED",
            payload={"message": "A client has disconnected"},
            timestamp=time.time()
        )
        if manager.active_connections:  # Only broadcast if there are still connections
            await manager.broadcast(disconnect_action) 