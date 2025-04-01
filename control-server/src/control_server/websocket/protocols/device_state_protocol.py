import logging
from mailbox import Message
from typing import Callable, Dict, Any

from pydantic import BaseModel


from ..connection import ConnectionManager
from .base import Protocol
from control_server.core.device_state import DeviceState

logger = logging.getLogger(__name__)

class UpdateDeviceStatePayload(BaseModel):
    update_path: str
    device_state: Any

class UpdateDeviceStateMessage(Message):
    message_type: str = "update_device_state"
    payload: UpdateDeviceStatePayload

DeviceStateUpdateCallbackType = Callable[[str, UpdateDeviceStatePayload], None]

class DeviceStateProtocol(Protocol):
    """
    Protocol for handling device state from the client.
    Manages device state, and processing.
    """
    
    def __init__(self, connection_manager: ConnectionManager):
        """
        Initialize the device state protocol.
        
        Args:
            connection_manager: The connection manager
        """
        super().__init__("device_state", connection_manager)
    
    def initialize(self) -> None:
        """Initialize the device state protocol."""
        logger.info("Initializing device state protocol")
    
    def shutdown(self) -> None:
        """Shutdown the device state protocol."""
        logger.info("Shutting down device state protocol")
        
        # Clean up any active recording sessions
    
    async def handle_device_state_updated(self, connection_id: str, payload: Dict[str, Any]) -> None:
        """
        Handle a device state update request.
        
        Args:
            connection_id: The connection ID
            payload: The message payload
        """
        logger.info(f"Starting microphone recording for {connection_id}")
        payload = UpdateDeviceStateMessage(**payload)
        
        connection_state = self.connection_manager.get_connection_state(connection_id)
        if not connection_state:
            await self.send_error(
                connection_id,
                "not connected",
                "not_connected"
            )
            return
        
        updated_device_state: DeviceState = connection_state.device_state.update(json_path=payload["update_path"], 
                                                                                 new_value=payload["device_state"])
        connection_state.device_state = updated_device_state
        
        logger.info(f"Updated device state for {connection_id}")
    
    async def update_device_state(self, connection_id: str, request: UpdateDeviceStateMessage) -> None:
        """
        Update the device state for a given connection.
        """
        connection_state = self.connection_manager.get_connection_state(connection_id)
        if not connection_state:
            return
        
        self.connection_manager.send_text(connection_id, request.model_dump_json())
    
    async def device_state_update_callback(self, connection_id: str, payload: UpdateDeviceStatePayload) -> None:
        """
        Callback for when the device state is updated.
        """
        if payload.update_path in self.device_state_update_callbacks:
            await self.device_state_update_callbacks[payload.update_path](connection_id, payload)
        else:
            logger.warning(f"No callback registered for {payload.update_path}")
