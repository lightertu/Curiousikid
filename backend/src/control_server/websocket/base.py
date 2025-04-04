import logging
import asyncio
from typing import Dict, Any, Callable, List, Set, Optional, Awaitable

from .connection import ConnectionManager
from .message import create_message, create_error_message

logger = logging.getLogger(__name__)

class Protocol:
    """
    Base class for WebSocket protocols.
    
    A protocol handles specific types of messages and provides functionality
    for a specific aspect of the application.
    """
    
    def __init__(self, name: str, connection_manager: ConnectionManager):
        """
        Initialize the protocol.
        
        Args:
            name: The protocol name
            connection_manager: The connection manager
        """
        self.name = name
        self.connection_manager = connection_manager
        self.handlers: Dict[str, Callable] = {}
    
    def register_handler(self, message_type: str, handler: Callable):
        """
        Register a message handler.
        
        Args:
            message_type: The message type to handle
            handler: The handler function
        """
        self.handlers[message_type] = handler
        logger.debug(f"Registered handler for {message_type} in {self.name} protocol")
    
    def get_handled_message_types(self) -> Set[str]:
        """
        Get the message types handled by this protocol.
        
        Returns:
            Set of message types
        """
        return set(self.handlers.keys())
    
    async def initialize(self) -> None:
        """Initialize the protocol. Override in subclasses."""
        logger.info(f"Initializing {self.name} protocol")
    
    async def shutdown(self) -> None:
        """Shutdown the protocol. Override in subclasses."""
        logger.info(f"Shutting down {self.name} protocol")
    
    async def handle_message(self, connection_id: str, message_type: str, payload: Dict[str, Any]) -> bool:
        """
        Handle a message.
        
        Args:
            connection_id: The connection ID
            message_type: The message type
            payload: The message payload
            
        Returns:
            True if the message was handled, False otherwise
        """
        handler = self.handlers.get(message_type)
        if handler:
            try:
                await handler(connection_id, payload)
                return True
            except Exception as e:
                logger.error(f"Error in {self.name} protocol handling {message_type}: {e}")
                await self.send_error(
                    connection_id,
                    f"Error handling {message_type}: {str(e)}",
                    f"{self.name}_handler_error"
                )
                return True  # We still "handled" it, even if an error occurred
        return False
    
    async def handle_binary_data(self, connection_id: str, data: bytes) -> bool:
        """
        Handle binary data.
        
        Args:
            connection_id: The connection ID
            data: The binary data
            
        Returns:
            True if the data was handled, False otherwise
        """
        # Override in subclasses that need to handle binary data
        return False
    
    async def send_message(self, connection_id: str, message_type: str, payload: Dict[str, Any]) -> None:
        """
        Send a message to a connection.
        
        Args:
            connection_id: The connection ID
            message_type: The message type
            payload: The message payload
        """
        message = create_message(message_type, payload)
        await self.connection_manager.send_message(connection_id, message)
    
    async def send_error(self, connection_id: str, message: str, error_code: str) -> None:
        """
        Send an error message to a connection.
        
        Args:
            connection_id: The connection ID
            message: The error message
            error_code: The error code
        """
        error_message = create_error_message(message, error_code)
        await self.connection_manager.send_message(connection_id, error_message) 