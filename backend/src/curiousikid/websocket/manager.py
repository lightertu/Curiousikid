import json
import time
import uuid
import logging
from typing import Dict, List, Any, Callable, Awaitable, Optional, Set

from fastapi import WebSocket
from pydantic import BaseModel, ValidationError

from .message_types import (
    MessageType, 
    HandshakePayload, HandshakeResponsePayload,
    ErrorPayload, UpdateTrackContextPayload)

logger = logging.getLogger(__name__)

# Type for message handlers
MessageHandler = Callable[[WebSocket, Any], Awaitable[None]]

class ConnectionStateStore(BaseModel):
    connection_id: str
    connected_at: Optional[float] = None
    handshake_data: Optional[HandshakePayload] = None
    track_context: Optional[UpdateTrackContextPayload] = None


class WebSocketManager:
    """
    Manages WebSocket connections and message handlers.
    Provides functionality for handling different message types.
    """
    
    def __init__(self):
        """Initialize the WebSocket manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_states: Dict[str, ConnectionStateStore] = {}
        self.message_handlers: Dict[MessageType, List[MessageHandler]] = {}
        self.binary_handlers: List[Callable[[WebSocket, bytes], Awaitable[None]]] = []
        
        # Register default handlers
        self.register_message_handler(MessageType.HANDSHAKE, self.handle_handshake)
        self.register_message_handler(MessageType.UPDATE_TRACK_CONTEXT, self.handle_track_context_update)
        
    def get_connection_state(self, websocket: WebSocket) -> ConnectionStateStore:
        connection_id = next(
            (cid for cid, ws in self.active_connections.items() if ws == websocket),
            None
        )

        if connection_id is None:
            return None

        return self.connection_states.get(connection_id, None)
    
    async def handle_track_context_update(self, websocket: WebSocket, payload: dict):
        """
        Handle track context update from a client.
        """
        connection_id = next(
            (cid for cid, ws in self.active_connections.items() if ws == websocket),
            None
        )
        
        if not connection_id:
            logger.error("Could not find connection_id for track context update")
            return
            
        try:
            # Validate the payload
            track_data = UpdateTrackContextPayload(**payload)
            
            # Store the track context in the connection state
            if connection_id in self.connection_states:
                self.connection_states[connection_id].track_context = track_data
            
            logger.info(
                f"Track context update from {connection_id}: "
                f"Track {track_data.trackId}, "
                f"position {track_data.currentTime:.2f}s / {track_data.duration:.2f}s"
            )
            
            # Here you would store or process the track context
            # For example, updating a database, triggering analytics, etc.
            
            # You could also broadcast this to other clients if needed
            # await self.broadcast(
            #     MessageType.UPDATE_TRACK_CONTEXT,
            #     track_data.dict(),
            #     exclude={connection_id}  # Don't send back to the sender
            # )
            
        except ValidationError as e:
            logger.warning(f"Invalid track context update payload: {e}")
            await self.send_error(
                connection_id,
                "INVALID_TRACK_UPDATE",
                "Invalid track context update request",
                e.errors()
            )

    async def handle_handshake(self, websocket: WebSocket, payload: dict):
        """
        Handle a client handshake message.
        """
        connection_state = self.get_connection_state(websocket)
        if connection_state is None:
            logger.error("Could not find connection_id for handshake")
            return
        
        try:
            # Validate the payload
            handshake_data = HandshakePayload(**payload)
            
            # Update connection info
            connection_state.handshake_data = handshake_data
            
            logger.info(f"Handshake from {connection_state.connection_id}: {handshake_data.user_id}")
            
            # Send handshake response
            response = HandshakeResponsePayload(
                sessionId=connection_state.connection_id,
            )
            
            await self.send_message(
                connection_state.connection_id,
                MessageType.HANDSHAKE_RESPONSE,
                response.model_dump()
            )
            
        except ValidationError as e:
            logger.warning(f"Invalid handshake payload: {e}")
            await self.send_error(
                connection_state.connection_id,
                "INVALID_HANDSHAKE",
                "Invalid handshake payload",
                e.errors()
            )
    
    async def connect(self, websocket: WebSocket) -> str:
        """
        Accept a WebSocket connection and add it to active connections.
        Returns a unique connection ID.
        """
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.connection_states[connection_id] = ConnectionStateStore(connection_id=connection_id, connected_at=time.time())
        logger.info(f"Client connected: {connection_id}")
        return connection_id
    
    def disconnect(self, connection_id: str):
        """
        Remove a connection from active connections.
        """
        if connection_id in self.active_connections:
            self.active_connections.pop(connection_id)
            client_info = self.connection_states.pop(connection_id, {})
            logger.info(f"Client disconnected: {connection_id}")
            if client_info.get("is_streaming_voice"):
                # Cleanup any voice streaming resources
                logger.info(f"Cleaning up voice streaming for {connection_id}")
    
    def register_message_handler(
        self,
        message_type: MessageType,
        handler: MessageHandler
    ):
        """
        Register a handler for a specific message type.
        """
        if message_type not in self.message_handlers:
            self.message_handlers[message_type] = []
        self.message_handlers[message_type].append(handler)
    
    def register_binary_handler(
        self,
        handler: Callable[[WebSocket, bytes], Awaitable[None]]
    ):
        """
        Register a handler for binary messages.
        """
        self.binary_handlers.append(handler)
    
    async def broadcast(
        self,
        message_type: MessageType,
        payload: Any,
        exclude: Optional[Set[str]] = None
    ):
        """
        Broadcast a message to all connected clients, with optional exclusions.
        """
        exclude = exclude or set()
        message = {"type": message_type, "payload": payload}
        message_json = json.dumps(message)
        
        for connection_id, websocket in self.active_connections.items():
            if connection_id not in exclude:
                try:
                    await websocket.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error broadcasting to {connection_id}: {e}")
    
    async def send_message(
        self,
        connection_id: str,
        message_type: MessageType,
        payload: Any
    ):
        """
        Send a message to a specific client.
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Cannot send message: client {connection_id} not connected")
            return False
        
        message = {"type": message_type, "payload": payload}
        try:
            await self.active_connections[connection_id].send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending message to {connection_id}: {e}")
            return False
    
    async def send_binary(self, connection_id: str, data: bytes):
        """
        Send binary data to a specific client.
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Cannot send binary: client {connection_id} not connected")
            return False
        
        try:
            await self.active_connections[connection_id].send_bytes(data)
            return True
        except Exception as e:
            logger.error(f"Error sending binary to {connection_id}: {e}")
            return False
    
    async def handle_message(self, connection_id: str, message: str):
        """
        Process an incoming text message and route it to registered handlers.
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Received message from unknown connection: {connection_id}")
            return
        
        websocket = self.active_connections[connection_id]
        
        try:
            # Parse the message
            message_data = json.loads(message)
            message_type = message_data.get("type")
            payload = message_data.get("payload", {})
            
            if not message_type:
                logger.warning(f"Received message without type: {message}")
                return
            
            # Convert message_type string to enum
            try:
                message_type_enum = MessageType(message_type)
            except ValueError:
                logger.warning(f"Unknown message type: {message_type}")
                await self.send_error(
                    connection_id,
                    "UNKNOWN_MESSAGE_TYPE",
                    f"Unknown message type: {message_type}"
                )
                return
            
            # Call registered handlers
            if message_type_enum in self.message_handlers:
                for handler in self.message_handlers[message_type_enum]:
                    try:
                        await handler(websocket, payload)
                    except Exception as e:
                        logger.error(f"Error in handler for {message_type}: {e}")
                        await self.send_error(
                            connection_id,
                            "HANDLER_ERROR",
                            f"Error processing message: {str(e)}"
                        )
            else:
                logger.info(f"No handlers for message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.warning(f"Received invalid JSON: {message}")
            await self.send_error(
                connection_id,
                "INVALID_JSON",
                "Could not parse message as JSON"
            )
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error(
                connection_id,
                "INTERNAL_ERROR",
                "Internal server error processing message"
            )
    
    async def handle_binary(self, connection_id: str, data: bytes):
        """
        Process incoming binary data.
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Received binary from unknown connection: {connection_id}")
            return
        
        websocket = self.active_connections[connection_id]
        connection_data = self.connection_states.get(connection_id, {})
        
        # Only process binary data if client is streaming voice
        if not connection_data.get("is_streaming_voice", False):
            logger.warning(f"Received binary data from non-streaming client: {connection_id}")
            return
        
        # Call registered binary handlers
        for handler in self.binary_handlers:
            try:
                await handler(websocket, data)
            except Exception as e:
                logger.error(f"Error in binary handler: {e}")
    
    async def send_error(self, connection_id: str, code: str, message: str, details: Any = None):
        """
        Send an error message to a client.
        """
        error_payload = ErrorPayload(code=code, message=message, details=details)
        await self.send_message(connection_id, MessageType.ERROR, error_payload.dict())
    