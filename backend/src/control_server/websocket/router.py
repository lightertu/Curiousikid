# Create WebSocket manager instance
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from control_server.websocket.manager import WebSocketManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ws", tags=["websocket"])

websocket_manager = WebSocketManager()

# Legacy connection manager for older endpoints
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

# New WebSocket endpoint with protocol support
@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint supporting the full protocol features.
    Handles protocol messages, binary data, and client state management.
    """
    # Accept and register the connection
    connection_id = await websocket_manager.connection_manager.connect(websocket)
    
    try:
        # Handle incoming messages
        while True:
            # Wait for both text and binary messages
            message_data = await websocket.receive()
            
            if "text" in message_data:
                # Handle text message
                await websocket_manager.handle_message(connection_id, message_data["text"])
            elif "bytes" in message_data:
                # Handle binary message
                await websocket_manager.handle_binary(connection_id, message_data["bytes"])
    except WebSocketDisconnect:
        # Clean up on disconnect
        await websocket_manager.disconnect(connection_id)
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint: {e}")
        # Try to disconnect cleanly if possible
        try:
            await websocket_manager.disconnect(connection_id)
        except:
            pass 