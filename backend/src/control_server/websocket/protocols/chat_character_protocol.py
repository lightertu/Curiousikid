import logging
from typing import Dict, Any, List

from pydantic import BaseModel

from memory.chat_character.models import ChatCharacter
from memory.chat_character.service import CharacterService
from memory.user.service import UserService
from control_server.websocket.message import MessageType, TextMessage

from ..connection import ConnectionManager
from .base import Protocol


logger = logging.getLogger(__name__)


class GetChatCharacterListPayload(BaseModel):
    userId: str


class GetChatCharacterListMessage(TextMessage):
    type: MessageType = MessageType.GET_CHAT_CHARACTER_LIST
    payload: GetChatCharacterListPayload


class SendChatCharacterListMessage(TextMessage):
    type: MessageType = MessageType.SEND_CHAT_CHARACTER_LIST
    payload: List[ChatCharacter]


class ChatCharacterProtocol(Protocol):
    """
    Protocol for handling chat character-related messages.
    Manages chat character selection, playback, and interactions.
    """

    def __init__(
        self,
        connection_manager: ConnectionManager,
        character_service: CharacterService = None,
    ):
        """
        Initialize the story protocol.

        Args:
            connection_manager: The connection manager
        """
        super().__init__("story", connection_manager)
        self.character_service = character_service or CharacterService(
            user_service=UserService()
        )
        # Register message handlers
        self.register_handler(
            MessageType.GET_CHAT_CHARACTER_LIST, self.handle_get_character_list
        )
        self.register_handler(
            MessageType.SEND_CHAT_CHARACTER_LIST, self.handle_send_chat_character_list
        )

    def initialize(self) -> None:
        """Initialize the story protocol."""
        logger.info("Initializing story protocol")

    def shutdown(self) -> None:
        """Shutdown the story protocol."""
        logger.info("Shutting down story protocol")

    async def handle_get_character_list(
        self, connection_id: str, message: Dict[str, Any]
    ) -> None:
        """
        Handle a request for the list of available characters.

        Args:
            connection_id: The connection ID
            payload: The message payload
        """
        logger.info(f"Handling character list request from {connection_id}")

        try:
            message = GetChatCharacterListMessage(**message)
            await self.handle_send_chat_character_list(
                connection_id, message.payload.userId
            )
        except Exception as e:
            logger.error(f"Error handling character list request: {str(e)}")
            import traceback

            logger.error(f"Stacktrace: {traceback.format_exc()}")
            await self.send_error(
                connection_id,
                f"Failed to get character list: {str(e)}",
                "character_list_error",
            )

    async def handle_send_chat_character_list(
        self, connection_id: str, user_id: str
    ) -> None:
        """
        Handle a request to send the list of characters.
        """
        logger.info(f"Handling send character list request from {connection_id}")
        logger.info(f"Fetching characters for user: {user_id}")
        characters = self.character_service.get_characters()

        # Send the list of characters
        message = SendChatCharacterListMessage(payload=characters).model_dump_json()
        logger.info(f"Sending character list to {connection_id}, {message}")
        await self.connection_manager.send_text(connection_id, message)
