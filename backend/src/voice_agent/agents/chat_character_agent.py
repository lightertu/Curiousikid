import json
import logging
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from memory.story.service import StoryService
from memory.chat_character.models import ChatCharacter
from typing import Any, Dict
from voice_agent.agents.connection_metadata import ParticipantConnectionMetadata

logger = logging.getLogger(__name__)


class ChatCharacterConnectionMetadata(ParticipantConnectionMetadata):
    metadata: ChatCharacter
    userId: str


class ChatCharacterAgent(Agent):
    def __init__(self, metadata: Dict[str, Any]):
        metadata = ChatCharacterConnectionMetadata(**metadata)
        super().__init__(
            instructions="""You are a friendly voice assistant built by LiveKit.""",
            vad=silero.VAD.load(),
            # any combination of STT, LLM, TTS, or realtime API can be used
            stt=deepgram.STT(model="nova-3"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(
                voice="nova",
                instructions="You are a friendly voice assistant built by LiveKit.",
            ),
        )
        self.story_service = StoryService()
        self.connection_metadata = None

    async def on_enter(self):
        """Called when the task is entered"""
        await self.session.say(text="Hi buddy!", allow_interruptions=False)

    async def on_exit(self):
        """Called when the task is exited"""
        pass

    async def on_end_of_turn(
        self,
        chat_ctx: llm.ChatContext,
        new_message: llm.ChatMessage,
        generating_reply: bool,
    ):
        """Called when the user has finished speaking, and the LLM is about to respond

        This is a good opportunity to update the chat context or edit the new message before it is
        sent to the LLM.
        """
        # callback when user input is transcribed
        chat_ctx = chat_ctx.copy()
        chat_ctx.items.append(new_message)
        await self.update_chat_ctx(chat_ctx)
        logger.info(
            "add user message to chat context", extra={"content": new_message.content}
        )
