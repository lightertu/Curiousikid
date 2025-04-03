import json
import logging
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from pydantic import BaseModel

from storage.story.models import QuestionPoint

logger = logging.getLogger(__name__)

class ConnectionMetadata(BaseModel):
  questionPoint: QuestionPoint
  userId: str


class ProactiveQuestionAgent(Agent):
    def __init__(self, question_point: QuestionPoint = None):
        super().__init__(
            instructions="You are a friendly voice assistant built by LiveKit.",
            vad=silero.VAD.load(),
            # any combination of STT, LLM, TTS, or realtime API can be used
            stt=deepgram.STT(model="nova-3"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(voice="nova", instructions="You are a friendly voice assistant built by LiveKit."),
        )
        self.connection_metadata = None
        
    def load_participant_metadata(self, serialized_metadata: str) -> ConnectionMetadata:
        logger.info(f"Loading participant metadata: {serialized_metadata}")
        self.connection_metadata = ConnectionMetadata(**json.loads(serialized_metadata))

    async def on_enter(self):
        """Called when the task is entered"""
        await self.session.say("Hello, this is my dump question.", allow_interruptions=False)
    
    async def on_exit(self):
        """Called when the task is exited"""
        pass

    async def on_end_of_turn(self, chat_ctx: llm.ChatContext, new_message: llm.ChatMessage, generating_reply: bool):
        """Called when the user has finished speaking, and the LLM is about to respond

        This is a good opportunity to update the chat context or edit the new message before it is
        sent to the LLM.
        """
        pass
