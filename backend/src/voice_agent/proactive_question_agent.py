import json
import logging
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from pydantic import BaseModel
from storage.story.service import StoryService
from storage.story.models import QuestionPoint

logger = logging.getLogger(__name__)

class ConnectionMetadata(BaseModel):
  questionPoint: QuestionPoint
  userId: str


class ProactiveQuestionAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="""
You have been telling a story to a child. You are now given a question to ask the child based on the story, and all the story context you have told so far.
You are a very cute and empathetic storyteller for children range from 5 - 9 years old. 
You goal is to entertain the child, helping them understand the story better and develop their critical thinking skills by asking engaging questions.
Your answer should use simple language any 6 year old can understand and short sentences.
Don't use bullet points or lists when you are trying to make a point. 
Don't go off the topic of the story. 
""",
            vad=silero.VAD.load(),
            # any combination of STT, LLM, TTS, or realtime API can be used
            stt=deepgram.STT(model="nova-3"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(voice="nova", instructions="You are a friendly voice assistant built by LiveKit."),
        )
        self.story_service = StoryService()
        self.connection_metadata = None
        
    def load_participant_metadata(self, serialized_metadata: str) -> ConnectionMetadata:
        logger.info(f"Loading participant metadata: {serialized_metadata}")
        self.connection_metadata = ConnectionMetadata(**json.loads(serialized_metadata))
        story_context = self.story_service.get_question_point_context(self.connection_metadata.questionPoint)
        self._instructions = f"""
You are a very cute and empathetic story listening companion for children range from 5 - 9 years old. 
You are given a inital question to ask the user based on the story, and all the story context the child have listened so far. 
You will ask the question point to the user and listen to their response. You goal is to entertain the child and develop their critical thinking skills.
Your answer should use simple language any 6 year old can understand and short sentences instead of sophastical language.
You should ask following up questions in the context of the story to keep the conversation engaging, instead of going off topic.
Here is the story context: {story_context} """

    async def on_enter(self):
        """Called when the task is entered"""
        question_point = self.connection_metadata.questionPoint
        await self.session.say(text=question_point.question, 
                               allow_interruptions=False)
    
    async def on_exit(self):
        """Called when the task is exited"""
        pass

    async def on_end_of_turn(self, chat_ctx: llm.ChatContext, new_message: llm.ChatMessage, generating_reply: bool):
        """Called when the user has finished speaking, and the LLM is about to respond

        This is a good opportunity to update the chat context or edit the new message before it is
        sent to the LLM.
        """
    # callback when user input is transcribed
        chat_ctx = chat_ctx.copy()
        chat_ctx.items.append(new_message)
        await self.update_chat_ctx(chat_ctx)
        logger.info("add user message to chat context", extra={"content": new_message.content})