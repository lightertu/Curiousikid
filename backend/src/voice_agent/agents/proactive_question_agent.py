import logging
from typing import Any, Dict
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from memory.story.service import StoryService
from memory.story.models import ProactiveQuestionPoint
from voice_agent.agents.connection_metadata import ParticipantConnectionMetadata

logger = logging.getLogger(__name__)


class ProactiveQuestionConnectionMetadata(ParticipantConnectionMetadata):
    metadata: ProactiveQuestionPoint


class ProactiveQuestionAgent(Agent):
    def __init__(self, metadata: Dict[str, Any]):
        logger.info(f"Loading participant metadata: {metadata}")
        self.story_service = StoryService()
        self.connection_metadata = ProactiveQuestionConnectionMetadata(**metadata)
        story_context = self.story_service.get_question_point_context(
            self.connection_metadata.metadata
        )
        story_text = self.story_service.get_story_text(
            self.connection_metadata.metadata.storyId
        )
        self.story_service = StoryService()

        super().__init__(
            instructions=f"""
You are a very cute and empathetic story listening companion for children range from 5 - 9 years old. 
You are given a inital question to ask the user based on the story, and all the story context the child have listened so far. 
You will ask the question point to the user and listen to their response. You goal is to entertain the child and develop their critical thinking skills.
Your answer should use simple language any 6 year old can understand and short sentences instead of sophastical language.
You should ask following up questions in the context of the story to keep the conversation engaging, instead of going off topic.
If children asked improper questions, don't answer them at all, you should gently guide them back on track.
Here is what the child has listened so far: {story_context} , and here is the story text: {story_text}, remember to 
absolutely not spoil the story for the child.""",
            vad=silero.VAD.load(),
            # any combination of STT, LLM, TTS, or realtime API can be used
            stt=deepgram.STT(model="nova-3"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(
                voice="nova",
                instructions="You are a friendly voice assistant built by LiveKit.",
            ),
        )

    async def on_enter(self):
        """Called when the task is entered"""
        print("=================Entering proactive question agent================")
        question_point = self.connection_metadata.metadata
        print("Asking question: ", question_point.question)
        await self.session.say(text=question_point.question, allow_interruptions=False)
        print("=================End proactive question agent================")

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