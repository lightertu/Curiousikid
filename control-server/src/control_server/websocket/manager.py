import json
import logging
import uuid
from typing import Dict, Any

from fastapi import WebSocket


from .connection import ConnectionManager
from .message import MessageType, create_message, create_error_message
from .protocols import ProtocolRegistry

logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Manager for WebSocket connections and protocol handling.
    
    This class coordinates the WebSocket connections, protocols, and message routing.
    """
    
    def __init__(self):
        """Initialize the WebSocket manager."""
        self.connection_manager = ConnectionManager()
        self.protocol_registry = ProtocolRegistry(self.connection_manager)
    
    async def initialize(self):
        """Initialize the WebSocket manager and all protocols."""
        logger.info("Initializing WebSocket manager")
        await self.protocol_registry.initialize()
    
    async def shutdown(self):
        """Shutdown the WebSocket manager and all protocols."""
        logger.info("Shutting down WebSocket manager")
        await self.protocol_registry.shutdown()
        await self.connection_manager.close_all()
    
    async def connect(self, websocket: WebSocket) -> str:
        """
        Handle a new WebSocket connection.
        
        Args:
            websocket: The WebSocket connection
            
        Returns:
            The connection ID
        """
        # Accept the connection
        await websocket.accept()
        
        # Generate a connection ID
        connection_id = str(uuid.uuid4())
        
        # Add the connection
        self.connection_manager.connect(websocket=websocket, connection_id=connection_id)
        
        logger.info(f"New WebSocket connection: {connection_id}")
        
        # Send welcome message
        message = create_message(message_type=MessageType.HANDSHAKE_RESPONSE, payload={
            "message": "Connected to Curiousikid server",
            "connection_id": connection_id
        })
        await self.connection_manager.send_text(connection_id, message)
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """
        Handle a WebSocket disconnection.
        
        Args:
            connection_id: The connection ID
        """
        # Remove the connection
        self.connection_manager.remove_connection(connection_id)
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def handle_message(self, connection_id: str, data: str):
        """
        Handle a message from a WebSocket connection.
        
        Args:
            connection_id: The connection ID
            data: The message data (JSON string)
        """
        try:
            # Parse the message
            message = json.loads(data)
            
            # Extract message type and payload
            message_type = message.get("type")
            payload = message.get("payload", {})
            
            if not message_type:
                await self._send_error(
                    connection_id,
                    "Missing message type",
                    "invalid_message"
                )
                return
            
            logger.debug(f"Received message of type {message_type} from {connection_id}")
            
            # Handle the message using the protocol registry
            handled = await self.protocol_registry.handle_message(connection_id, message_type, payload)
            
            if not handled:
                await self._send_error(
                    connection_id,
                    f"Unhandled message type: {message_type}",
                    "unhandled_message_type"
                )
        except json.JSONDecodeError:
            await self._send_error(
                connection_id,
                "Invalid JSON",
                "invalid_json"
            )
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self._send_error(
                connection_id,
                f"Server error: {str(e)}",
                "server_error"
            )
    
    async def handle_binary(self, connection_id: str, data: bytes):
        """
        Handle binary data from a client.
        Used primarily for audio data.
        
        Args:
            connection_id: The connection ID
            data: The binary data
        """
        await self._handle_binary_data(connection_id, data)
    
    async def _handle_binary_data(self, connection_id: str, data: bytes):
        """
        Handle binary data from a WebSocket connection.
        
        Args:
            connection_id: The connection ID
            data: The binary data
        """
        # Binary data is likely audio from the microphone
        # Pass it to the microphone protocol if available
        for protocol in self.protocol_registry.protocols:
            if protocol.name == "microphone":
                await protocol.handle_binary_data(connection_id, data)
                return
        
        logger.warning(f"Received binary data but no microphone protocol found")
    
    async def _send_error(self, connection_id: str, message: str, error_code: str):
        """
        Send an error message to a WebSocket connection.
        
        Args:
            connection_id: The connection ID
            message: The error message
            error_code: The error code
        """
        error_message = create_error_message(message, error_code)
        await self.connection_manager.send_text(connection_id, error_message)
    