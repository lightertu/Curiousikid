import enum
import json
import logging
from typing import Any, Dict, Optional, Union, Tuple

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class MessageType(str, enum.Enum):
    # Connection and authentication
    HANDSHAKE = "HANDSHAKE"
    HANDSHAKE_RESPONSE = "HANDSHAKE_RESPONSE"
    ERROR = "ERROR"

    # Story related
    GET_STORY_LIST = "GET_STORY_LIST"
    SEND_STORY_LIST = "SEND_STORY_LIST"
    SET_QUESTION_POINT = "SET_QUESTION_POINT"
    ACK_SET_QUESTION_POINT = "ACK_SET_QUESTION_POINT"
    CLEAR_QUESTION_POINT = "CLEAR_QUESTION_POINT"
    STORY_SELECTED = "STORY_SELECTED"
    STORY_STARTED = "STORY_STARTED"
    STORY_ENDED = "STORY_ENDED"
    STORY_PAUSED = "STORY_PAUSED"

    # Chat character related
    GET_CHAT_CHARACTER_LIST = "GET_CHAT_CHARACTER_LIST"
    SEND_CHAT_CHARACTER_LIST = "SEND_CHAT_CHARACTER_LIST"

    # Story playback
    SET_STORY_PROGRESS = "SET_STORY_PROGRESS"
    STORY_TRACK_END = "STORY_TRACK_END"

    # Interaction related
    SET_STORY_INTERACTION = "SET_STORY_INTERACTION"
    STORY_INTERACTION_TIMEOUT = "STORY_INTERACTION_TIMEOUT"
    STORY_INTERACTION_RESPONSE = "STORY_INTERACTION_RESPONSE"

    # Voice related
    VOICE_CHUNK = "VOICE_CHUNK"
    VOICE_END = "VOICE_END"

    # Microphone related
    MICROPHONE_START = "MICROPHONE_START"
    MICROPHONE_END = "MICROPHONE_END"
    MICROPHONE_DATA = "MICROPHONE_DATA"  # Binary message type
    MICROPHONE_TRANSCRIPT = "MICROPHONE_TRANSCRIPT"

    # Debug/development
    PING = "PING"
    PONG = "PONG"


class TextMessage(BaseModel):
    type: MessageType


def create_message(
    message_type: Union[MessageType, str], payload: Dict[str, Any] = None
) -> str:
    """
    Create a JSON message with the specified type and payload.

    Args:
        message_type: The type of message
        payload: The message payload (optional)

    Returns:
        A JSON string
    """
    if isinstance(message_type, MessageType):
        message_type = message_type.value

    message = {"type": message_type, "payload": payload or {}}

    try:
        return json.dumps(message)
    except (TypeError, ValueError) as e:
        logger.error(f"Error creating message: {e}")
        # Create a simple error message instead
        return json.dumps(
            {
                "type": "error",
                "payload": {"message": "Failed to serialize message payload"},
            }
        )


def create_error_message(
    message: str, code: str = "general_error", details: Any = None
) -> str:
    """
    Create an error message.

    Args:
        message: The error message
        code: The error code
        details: Additional error details (optional)

    Returns:
        A JSON string
    """
    return create_message(
        MessageType.ERROR, {"message": message, "code": code, "details": details}
    )


def parse_message(message: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Parse a JSON message into type and payload.

    Args:
        message: The JSON message to parse

    Returns:
        A tuple of (message_type, payload)
    """
    try:
        data = json.loads(message)

        # Validate message format
        if not isinstance(data, dict):
            logger.warning("Invalid message format: not a dict")
            return None, None

        message_type = data.get("type")
        if not message_type:
            logger.warning("Invalid message format: missing type")
            return None, None

        payload = data.get("payload", {})
        if not isinstance(payload, dict):
            logger.warning("Invalid message format: payload is not a dict")
            return None, None

        return message_type, payload

    except json.JSONDecodeError as e:
        logger.warning(f"Invalid JSON in message: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Error parsing message: {e}")
        return None, None


def get_message_type(message: str) -> Optional[str]:
    """
    Extract the message type from a JSON message.

    Args:
        message: The JSON message

    Returns:
        The message type, or None if the message is invalid
    """
    message_type, _ = parse_message(message)
    return message_type


def get_message_payload(message: str) -> Optional[Dict[str, Any]]:
    """
    Extract the payload from a JSON message.

    Args:
        message: The JSON message

    Returns:
        The message payload, or None if the message is invalid
    """
    _, payload = parse_message(message)
    return payload
