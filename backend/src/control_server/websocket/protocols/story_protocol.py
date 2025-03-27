import logging
from typing import Dict, Any, List

from pydantic import BaseModel

from control_server.core.device_state import INIT_STORY_LIST, StoryMetadata, CurrentStory
from control_server.websocket.message import MessageType, TextMessage

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
  
class SetQuestionPointPayload(BaseModel):
  storyId: str
  questionPointId: str
  interruptAt: float

class SetQuestionPointMessage(TextMessage):
  type: MessageType = MessageType.SET_QUESTION_POINT
  payload: SetQuestionPointPayload

class ACKSetQuestionPointMessage(TextMessage):
  type: MessageType = MessageType.ACK_SET_QUESTION_POINT
  payload: SetQuestionPointPayload


class StoryProtocol(Protocol):
    """
    Protocol for handling story-related messages.
    Manages story selection, playback, and interactions.
    """
    
    def __init__(self, connection_manager: ConnectionManager):
        """
        Initialize the story protocol.
        
        Args:
            connection_manager: The connection manager
        """
        super().__init__("story", connection_manager)
        # Register message handlers
        self.register_handler(MessageType.GET_STORY_LIST, self.handle_get_story_list)
        self.register_handler(MessageType.SET_STORY_PROGRESS, self.handle_set_story_progress)
        self.register_handler(MessageType.ACK_SET_QUESTION_POINT, self.handle_ack_set_question_point)

    def initialize(self) -> None:
        """Initialize the story protocol."""
        logger.info("Initializing story protocol")
    
    def shutdown(self) -> None:
        """Shutdown the story protocol."""
        logger.info("Shutting down story protocol")
        
    async def handle_get_story_list(self, connection_id: str, payload: Dict[str, Any]) -> None:
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
            user_id = payload.get("userId", "unknown")
            logger.info(f"Fetching stories for user: {user_id}")
            stories = INIT_STORY_LIST
            
            # Send the list of stories
            logger.info(f"Sending story list to {connection_id}, {stories}")
            await self.connection_manager.send_text(
                connection_id,
                SendStoryListMessage(
                    payload=stories
                ).model_dump_json()
            )
        except Exception as e:
            logger.error(f"Error handling story list request: {str(e)}")
            import traceback
            logger.error(f"Stacktrace: {traceback.format_exc()}")
            await self.send_error(
                connection_id,
                f"Failed to get story list: {str(e)}",
                "story_list_error"
            )
    
    async def handle_set_story_progress(self, connection_id: str, payload: Dict[str, Any]) -> None:
        """
        Handle a request to set the progress of a story.
        """
        logger.info(f"Handling set story progress request from {connection_id}")
        payload = SetStoryProgressMessage(**payload).payload
        device_state = self.connection_manager.get_connection_state(connection_id).device_state
        device_state.currentStory = payload
        
        question_point = 100
        delta = question_point - payload.currentTime
        if delta < 10 and delta > 0:
            logger.info(f"Detected question point for {payload.id} at {payload.currentTime}")
            await self.send_message(
                connection_id,
                SetQuestionPointMessage(
                    payload=SetQuestionPointPayload(    
                        storyId=payload.id,
                        questionPointId="question point 1",
                        interruptAt=payload.currentTime + 10
                    )
                )
            )

    async def handle_ack_set_question_point(self, connection_id: str, payload: Dict[str, Any]) -> None:
        """
        Handle a request to acknowledge a question point.
        """
        logger.info(f"Handling ack set question point request from {connection_id}")
        payload = ACKSetQuestionPointMessage(**payload)
        self.story_service.set_question_point(payload.story_id, payload.checkpoint_id, payload.interrupt_at)
    
    
    