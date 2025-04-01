import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, Optional, Set, List

from ..connection import ConnectionManager
from ..message import MessageType, TextMessage

logger = logging.getLogger(__name__)

class Protocol(ABC):
    """
    Base class for WebSocket protocols.
    
    A protocol handles a specific set of message types related to a specific
    area of functionality, such as authentication, story playback, etc.
    """
    
    def __init__(self, name: str, connection_manager: ConnectionManager):
        """
        Initialize the protocol.
        
        Args:
            name: The name of the protocol
            connection_manager: The connection manager
        """
        self.name = name
        self.connection_manager = connection_manager
        self.handlers: Dict[str, Callable] = {}
    
    @abstractmethod
    def initialize(self) -> None:
        """
        Initialize the protocol.
        This method is called when the protocol is registered.
        """
        pass
    
    @abstractmethod
    def shutdown(self) -> None:
        """
        Shutdown the protocol.
        This method is called when the server is shutting down.
        """
        pass
    
    def register_handler(self, message_type: MessageType, handler: Callable) -> None:
        """
        Register a handler for a specific message type.
        
        Args:
            message_type: The message type to handle
            handler: The handler function
        """
        if isinstance(message_type, MessageType):
            message_type = message_type.value
        
        self.handlers[message_type] = handler
        logger.info(f"Registered handler for message type {message_type} in protocol {self.name}")
    
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
                logger.error(f"Error handling message type {message_type} in protocol {self.name}: {str(e)}")
                return False
        
        return False
    
    async def send_message(self, connection_id: str, message: TextMessage) -> None:
        """
        Send a message to the connection.
        """
        await self.connection_manager.send_text(connection_id, message.model_dump_json())

class ProtocolRegistry:
    """
    Registry of protocols.
    
    This class manages a set of protocols and routes messages to the
    appropriate protocol handler.
    """
    
    def __init__(self):
        """Initialize the protocol registry."""
        self.protocols: Dict[str, Protocol] = {}
        self.message_types: Dict[str, str] = {}
    
    def register_protocol(self, protocol: Protocol) -> None:
        """
        Register a protocol.
        
        Args:
            protocol: The protocol to register
        """
        self.protocols[protocol.name] = protocol
        
        # Register all message types handled by this protocol
        for message_type in protocol.handlers.keys():
            self.message_types[message_type] = protocol.name
        
        # Initialize the protocol
        protocol.initialize()
        
        logger.info(f"Registered protocol: {protocol.name}")
    
    def get_protocol(self, protocol_name: str) -> Optional[Protocol]:
        """
        Get a protocol by name.
        
        Args:
            protocol_name: The name of the protocol
            
        Returns:
            The protocol if found, None otherwise
        """
        return self.protocols.get(protocol_name)
    
    def get_protocol_for_message(self, message_type: str) -> Optional[Protocol]:
        """
        Get the protocol for a specific message type.
        
        Args:
            message_type: The message type
            
        Returns:
            The protocol if found, None otherwise
        """
        protocol_name = self.message_types.get(message_type)
        if protocol_name:
            return self.protocols.get(protocol_name)
        
        return None
    
    async def handle_message(self, connection_id: str, message_type: str, payload: Dict[str, Any]) -> bool:
        """
        Handle a message by routing it to the appropriate protocol.
        
        Args:
            connection_id: The connection ID
            message_type: The message type
            payload: The message payload
            
        Returns:
            True if the message was handled, False otherwise
        """
        protocol = self.get_protocol_for_message(message_type)
        if protocol:
            return await protocol.handle_message(connection_id, message_type, payload)
        
        logger.warning(f"No protocol registered for message type: {message_type}")
        return False
    
    def shutdown(self) -> None:
        """Shutdown all protocols."""
        for protocol in self.protocols.values():
            try:
                protocol.shutdown()
            except Exception as e:
                logger.error(f"Error shutting down protocol {protocol.name}: {str(e)}")
        
        self.protocols.clear()
        self.message_types.clear()
        
        logger.info("All protocols shut down") 