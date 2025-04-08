import logging
from typing import Dict, Any, List

from pydantic import BaseModel

from control_server.common.device_state import (
    INIT_STORY_LIST,
    StoryMetadata,
    CurrentStory,
    DeviceState,
)
from memory.story.models import ProactiveQuestionPoint
from control_server.websocket.message import MessageType, TextMessage
from memory.story.service import StoryService

from ..connection import ConnectionManager
from .base import Protocol


logger = logging.getLogger(__name__)


class GetStoryListPayload(BaseModel):
    userId: str


class GetStoryListMessage(TextMessage):
    type: MessageType = MessageType.GET_STORY_LIST
    payload: GetStoryListPayload


class SendStoryListMessage(TextMessage):
    type: MessageType = MessageType.SEND_STORY_LIST
    payload: List[StoryMetadata]


class SetStoryProgressMessage(TextMessage):
    type: MessageType = MessageType.SET_STORY_PROGRESS
    payload: CurrentStory


class SetProactiveQuestionPointMessage(TextMessage):
    type: MessageType = MessageType.SET_QUESTION_POINT
    payload: ProactiveQuestionPoint


class ACKSetProactiveQuestionPointMessage(TextMessage):
    type: MessageType = MessageType.ACK_SET_QUESTION_POINT
    payload: ProactiveQuestionPoint


class ClearProactiveQuestionPointMessage(TextMessage):
    type: MessageType = MessageType.CLEAR_QUESTION_POINT


class StoryProtocol(Protocol):
    """
    Protocol for handling story-related messages.
    Manages story selection, playback, and interactions.
    """

    def __init__(
        self, connection_manager: ConnectionManager, story_service: StoryService = None
    ):
        """
        Initialize the story protocol.

        Args:
            connection_manager: The connection manager
        """
        super().__init__("story", connection_manager)
        self.story_service = story_service or StoryService()
        # Register message handlers
        self.register_handler(MessageType.GET_STORY_LIST, self.handle_get_story_list)
        self.register_handler(
            MessageType.SET_STORY_PROGRESS, self.handle_set_story_progress
        )
        self.register_handler(
            MessageType.ACK_SET_QUESTION_POINT, self.handle_ack_set_question_point
        )
        self.register_handler(
            MessageType.CLEAR_QUESTION_POINT, self.handle_clear_question_point
        )

    def initialize(self) -> None:
        """Initialize the story protocol."""
        logger.info("Initializing story protocol")

    def shutdown(self) -> None:
        """Shutdown the story protocol."""
        logger.info("Shutting down story protocol")

    async def handle_get_story_list(
        self, connection_id: str, message: Dict[str, Any]
    ) -> None:
        """
        Handle a request for the list of available stories.

        Args:
            connection_id: The connection ID
            payload: The message payload
        """
        logger.info(f"Handling story list request from {connection_id}")

        try:
            # Get the list of available stories
            # Parse the payload correctly based on the structure
            user_id = message.get("userId", "unknown")
            logger.info(f"Fetching stories for user: {user_id}")
            stories = INIT_STORY_LIST

            # Send the list of stories
            message = SendStoryListMessage(payload=stories).model_dump_json()
            logger.info(f"Sending story list to {connection_id}, {message}")
            await self.connection_manager.send_text(connection_id, message)
        except Exception as e:
            logger.error(f"Error handling story list request: {str(e)}")
            import traceback

            logger.error(f"Stacktrace: {traceback.format_exc()}")
            await self.send_error(
                connection_id, f"Failed to get story list: {str(e)}", "story_list_error"
            )

    async def handle_set_story_progress(
        self, connection_id: str, message: Dict[str, Any]
    ) -> None:
        """
        Handle a request to set the progress of a story.
        """
        logger.info(f"Handling set story progress request from {connection_id}")
        message = SetStoryProgressMessage(**message).payload
        device_state = self.connection_manager.get_connection_state(
            connection_id
        ).device_state
        device_state.currentStory = message

        if not device_state.ProactiveQuestionPoint:
            question_point = self.get_question_point(message.id, message.currentTime)

            if question_point:
                logger.info(
                    f"Detected question point for {message.id} at {message.currentTime}"
                )
                await self.send_message(
                    connection_id,
                    SetProactiveQuestionPointMessage(payload=question_point),
                )

    async def handle_ack_set_question_point(
        self, connection_id: str, message: Dict[str, Any]
    ) -> None:
        """
        Handle a request to acknowledge a question point.
        """
        logger.info(f"Handling ack set question point request from {connection_id}")
        message = ACKSetProactiveQuestionPointMessage(**message)
        device_state: DeviceState = self.connection_manager.get_connection_state(
            connection_id
        ).device_state
        device_state.ProactiveQuestionPoint = message.payload
        logger.info(f"Updated device state: {device_state}")

    async def handle_clear_question_point(
        self, connection_id: str, message: Dict[str, Any]
    ) -> None:
        """
        Handle a request to clear the question point.
        """
        logger.info(f"Handling clear question point request from {connection_id}")
        device_state: DeviceState = self.connection_manager.get_connection_state(
            connection_id
        ).device_state
        device_state.ProactiveQuestionPoint = None
        logger.info(f"Updated device state: {device_state}")

    def get_question_point(
        self, story_id: str, current_time: float
    ) -> ProactiveQuestionPoint:
        question_points = self.story_service.get_question_points(story_id)
        print(question_points)
        for question_point in question_points:
            if (
                question_point.connectAt >= current_time
                and question_point.connectAt < current_time + 10
            ):
                return question_point

        return None
