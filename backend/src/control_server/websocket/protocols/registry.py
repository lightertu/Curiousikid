import logging
from typing import Dict, Any


from .base import Protocol
from ..connection import ConnectionManager
from .story_protocol import StoryProtocol

logger = logging.getLogger(__name__)

class ProtocolRegistry:
    """
    Registry for WebSocket protocols that manages their lifecycle and message handling.
    
    This class handles protocol registration, initialization, shutdown, and message routing.
    It also provides dependency injection for protocols.
    """
    
    def __init__(self, connection_manager: ConnectionManager):
        """
        Initialize the protocol registry with dependencies.
        
        Args:
            connection_manager: The connection manager for WebSocket connections
        """
        self.connection_manager = connection_manager
        self.message_handlers: Dict[str, any] = {}
        
        # Auto-register default protocols
        self._setup_default_protocols()
    
    def _setup_default_protocols(self) -> None:
        """Set up and register the default protocols."""
        self.register_protocol(StoryProtocol(self.connection_manager))
    
    def register_protocol(self, protocol: Protocol) -> None:
        """
        Register a protocol with the registry.
        
        Args:
            protocol: The protocol to register
        """
        # Add to protocols list
        for message_type, handler in protocol.handlers.items():
            logger.info(f"Registering handler for message type: {message_type}")
            self.message_handlers[message_type] = handler

        logger.info(f"Registered protocol: {protocol.name}")
    
    async def initialize(self) -> None:
        """Initialize all registered protocols."""
        logger.info("Initializing all protocols")
        for protocol in self.protocols:
            try:
                await protocol.initialize()
            except Exception as e:
                logger.error(f"Error initializing protocol {protocol.name}: {e}")
    
    async def shutdown(self) -> None:
        """Shutdown all registered protocols."""
        logger.info("Shutting down all protocols")
        for protocol in self.protocols:
            try:
                await protocol.shutdown()
            except Exception as e:
                logger.error(f"Error shutting down protocol {protocol.name}: {e}")
    
    async def handle_message(self, connection_id: str, message_type: str, payload: Any) -> bool:
        """
        Handle a message by routing it to the appropriate protocol(s).
        
        Args:
            connection_id: ID of the connection
            message_type: The type of message
            payload: The message payload
            
        Returns:
            bool: True if at least one protocol handled the message, False otherwise
        """
        # Find protocols that handle this message type
        handler = self.message_handlers.get(message_type, [])
        
        if not handler:
            logger.warning(f"No handler found for message type: {message_type}")
            return False
        
        # Route the message to each handler
        try:
            await handler(connection_id, payload)
            return True
        except Exception as e:
            logger.error(f"Error in protocol handling message {message_type}: {e}")
            return False
