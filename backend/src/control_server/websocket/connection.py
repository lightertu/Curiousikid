import enum
import logging
import time
import uuid
from typing import Dict, Any, Optional, Set

from fastapi import WebSocket
from pydantic import BaseModel, Field

from control_server.common.device_state import DeviceState

logger = logging.getLogger(__name__)


class ConnectionStateStore(BaseModel):
    """Store for connection state information."""
    connection_id: str
    connected_at: float = 0.0
    device_state: DeviceState = Field(default_factory=DeviceState)

class ConnectionManager:
    """
    Manager for WebSocket connections.
    Handles connection lifecycle and state.
    """
    
    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_states: Dict[str, ConnectionStateStore] = {}
    
    async def connect(self, websocket: WebSocket) -> str:
        """
        Accept a WebSocket connection and add it to active connections.
        
        Args:
            websocket: The WebSocket connection to accept
            connection_id: The connection ID (generated if not provided)
            
        Returns:
            The connection ID
        """
        connection_id = str(uuid.uuid4())
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"WebSocket connection accepted: {connection_id}")
        
        # Initialize connection state
        self.connection_states[connection_id] = ConnectionStateStore(
            connection_id=connection_id,
            connected_at=time.time(),
            story_play_context={}
        )
        
        logger.info(f"WebSocket connection established: {connection_id}")
        return connection_id
    
    async def disconnect(self, connection_id: str) -> None:
        """
        Remove a connection from active connections.
        
        Args:
            connection_id: The connection ID to remove
        """
        if connection_id in self.active_connections:
            # Try to close the WebSocket if it's still open
            try:
                await self.active_connections[connection_id].close()
            except Exception as e:
                logger.warning(f"Error closing WebSocket: {str(e)}")
            
            # Remove from active connections
            del self.active_connections[connection_id]
            logger.info(f"WebSocket connection removed: {connection_id}")
        
        # Clean up connection state
        if connection_id in self.connection_states:
            del self.connection_states[connection_id]
    
    async def close_all(self) -> None:
        """Close all active WebSocket connections."""
        connection_ids = list(self.active_connections.keys())
        for connection_id in connection_ids:
            await self.disconnect(connection_id)
    
    def get_websocket(self, connection_id: str) -> Optional[WebSocket]:
        """
        Get the WebSocket for a connection ID.
        
        Args:
            connection_id: The connection ID
            
        Returns:
            The WebSocket if found, None otherwise
        """
        return self.active_connections.get(connection_id)
    
    def get_connection_state(self, connection_id: str) -> Optional[ConnectionStateStore]:
        """
        Get the connection state for a connection ID.
        
        Args:
            connection_id: The connection ID
            
        Returns:
            The connection state if found, None otherwise
        """
        return self.connection_states.get(connection_id)
    
    def update_connection_state(self, connection_id: str, **kwargs) -> None:
        """
        Update connection state with new values.
        
        Args:
            connection_id: The connection ID
            **kwargs: Key-value pairs to update
        """
        if connection_id in self.connection_states:
            state = self.connection_states[connection_id]
            
            # Update only the provided fields
            for key, value in kwargs.items():
                if hasattr(state, key):
                    setattr(state, key, value)
                else:
                    logger.warning(f"Attempting to set unknown state attribute: {key}")
    
    async def send_text(self, connection_id: str, message: str) -> bool:
        """
        Send a text message to a specific client.
        
        Args:
            connection_id: The connection ID
            message: The message to send
            
        Returns:
            True if the message was sent, False otherwise
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Attempting to send message to inactive connection: {connection_id}")
            return False
        
        try:
            await self.active_connections[connection_id].send_text(message)
            return True
        except Exception as e:
            logger.error(f"Error sending text message: {str(e)}")
            # Connection might be closed, remove it
            await self.disconnect(connection_id)
            return False
    
    async def send_binary(self, connection_id: str, data: bytes) -> bool:
        """
        Send binary data to a specific client.
        
        Args:
            connection_id: The connection ID
            data: The binary data to send
            
        Returns:
            True if the data was sent, False otherwise
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Attempting to send binary to inactive connection: {connection_id}")
            return False
        
        try:
            await self.active_connections[connection_id].send_bytes(data)
            return True
        except Exception as e:
            logger.error(f"Error sending binary data: {str(e)}")
            # Connection might be closed, remove it
            await self.disconnect(connection_id)
            return False
    
    async def broadcast_text(self, message: str, exclude: Optional[Set[str]] = None) -> None:
        """
        Broadcast a text message to all connected clients, with optional exclusions.
        
        Args:
            message: The message to broadcast
            exclude: Optional set of connection IDs to exclude
        """
        exclude = exclude or set()
        for connection_id in list(self.active_connections.keys()):
            if connection_id not in exclude:
                await self.send_text(connection_id, message)
    
    async def broadcast_binary(self, data: bytes, exclude: Optional[Set[str]] = None) -> None:
        """
        Broadcast binary data to all connected clients, with optional exclusions.
        
        Args:
            data: The binary data to broadcast
            exclude: Optional set of connection IDs to exclude
        """
        exclude = exclude or set()
        for connection_id in list(self.active_connections.keys()):
            if connection_id not in exclude:
                await self.send_binary(connection_id, data) 