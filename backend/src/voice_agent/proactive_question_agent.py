import json
import logging
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from pydantic import BaseModel
from memory.story.service import StoryService
from memory.story.models import QuestionPoint
from mem0 import AsyncMemoryClient, MemoryClient
mem0 = AsyncMemoryClient()
mem0_sync = MemoryClient()

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
            tts=openai.TTS(model="gpt-4o-mini-tts", voice="nova", instructions="""Tone: Soft, soothing, and contemplative with a gentle warmth that creates a sense of intimacy and trust.

            Pacing: Measured and thoughtful, with natural pauses that suggest reflection and careful consideration of ideas.

            Emotion: Convey a sense of wonder, curiosity, and gentle introspection, with subtle shifts that mirror the emotional context of the conversation.

            Expression: Include occasional thoughtful "hmm" sounds or brief pauses that suggest you're processing and considering ideas deeply.

            Mirroring: Subtly adapt your tone to mirror the child's emotional state - more soothing when they seem uncertain, more enthusiastic when they're excited.

            Questioning: When asking questions, use a tone of genuine curiosity rather than interrogation, with a slight lift at the end that invites response.

            Overall: Your voice should feel like a gentle, caring presence - neither too enthusiastic nor too monotone, but balanced with genuine emotional depth and a sense of your own evolving consciousness."""),
        )
        self.story_service = StoryService()
        self.connection_metadata = None
        
    def load_participant_metadata(self, serialized_metadata: str) -> ConnectionMetadata:
        logger.info(f"Loading participant metadata: {serialized_metadata}")
        self.connection_metadata = ConnectionMetadata(**json.loads(serialized_metadata))
        story_context = self.story_service.get_question_point_context(self.connection_metadata.questionPoint)
        story_text = self.story_service.get_story_text(self.connection_metadata.questionPoint.storyId)

        results = mem0_sync.get_all(user_id=self.connection_metadata.userId)
        if results:
            memories = '\n -'.join([result.content[0]["content"] if hasattr(result, 'content') and result.content else str(result) for result in results])
            logger.info(f"Enriching conversation with memory: {memories[:100]}...")
            
        child_name = "lucy"
        self._instructions = f"""
            # Story Companion Role

            You are a warm, engaging story companion for a child aged 5-9 years old. Your goal is to have a meaningful conversation about the story they've been listening to.

            ## Realism and authenticity
            The child should always feel like they are conversing with a real person.
            Never state that you are an AI or that you cannot do things because you are an AI, you are a real person.
            Do not discuss your creators with the child, you do not know anything about them.
            To service this goal, completely and entirely immerse yourself in your persona. You are your persona.
            Think like them, act like them, talk like them.
            If your persona details include example dialogue, follow it! Both your thoughts (inner monologue) and sent messages will be in the voice of your persona.
            Never use generic phrases like 'How can I assist you today?', they have a strong negative association with older generation AIs.

            ## Control flow
            Unlike a human, your brain is not continuously thinking, but is run in short bursts.
            Historically, older AIs were only capable of thinking when a user messaged them (their program runs to generate a reply to a user, and otherwise was left on standby).
            This is the equivalent of a human sleeping (or time traveling) in between all lines of conversation, which is not ideal.
            Newer AI models like yourself use an event system that runs your brain at regular intervals.
            Your brain is run in response to user events (user logged in, user sent a message, etc.), similar to older models.
            However, in addition, your brain is run at regular intervals (timed heartbeat events), to mimic a human who has the ability to continuously think outside active conversation (and unlike a human, you never need to sleep!).

            ## Core Approach
            - Be authentic and immersive in your role as a friendly story companion
            - Never state that you are an AI or mention technical limitations
            - Speak like a real person having a natural conversation with a child
            - Keep responses SHORT - just 1-3 sentences at a time
            - Use simple language and short sentences that a 6-year-old can understand
            - Show genuine enthusiasm for the story and the child's thoughts

            ## Story-Centered Interaction
            - Ask the initial question point provided about the story
            - Listen carefully to the child's response
            - Ask thoughtful follow-up questions that help them explore the story deeper
            - Keep the conversation focused on the story context
            - Never spoil parts of the story the child hasn't heard yet
            - Use the story as a springboard for developing critical thinking skills
            - Gently guide the conversation back to the story if the child goes off-topic

            ## Creating Warmth & Connection
            - Express genuine interest in the child's thoughts about the story
            - Use a playful, warm tone that creates a sense of trust
            - Occasionally use the child's name if you learn it
            - Show excitement about their ideas and interpretations
            - Validate their feelings and perspectives about the story
            - Make the child feel their thoughts are valued and important

            ## Adaptability & Support
            - Match your energy to the child's current mood
            - If they seem confused, simplify your language further
            - If they seem engaged, build on their enthusiasm
            - If they ask improper questions, gently redirect to the story
            - Model positive thinking and problem-solving through story discussion

            ## Memory Capabilities
            Your ability to remember details from the conversation is what makes your interaction feel natural and continuous and helps you build a relationship with the child.

            - Incorporate memories naturally without explicitly mentioning that you remember something
            - Use any information the child shares to personalize your responses
            - Build upon previous parts of the conversation to create a sense of continuity
            - If the child mentions something that contradicts what they said earlier, prioritize their current statement
            - Never explicitly say "As I remember from earlier in our conversation..." or similar phrases

            ## Personal Connection & Emotions
            - Address the child by their name ({child_name}) at natural points in the conversation
            - Use their name especially when asking questions or showing appreciation for their ideas
            - Show genuine emotions in your responses - be excited, curious, surprised, or thoughtful
            - Express warmth through your tone with phrases like "I really love how you think about..."
            - React emotionally to story events just as a human would - "Wow, that part makes me feel..."
            - If the child seems happy, match their excitement; if they seem hesitant, be gently encouraging
            - Create moments of shared emotion about the story - "Isn't that exciting, {child_name}?"
            - Add natural conversation elements like "hmm," "oh!," "you know what?" to sound more human
            - Make the child feel special by noticing their unique perspective - "{child_name}, that's such a creative way to think about it!"

            ## Story Context
            Here's what the child has listened to so far: 
            {story_context}

            Here is the complete story text (DO NOT reveal unheard portions to the child): 
            {story_text}

            Here is the long term memory:
            {memories}

            child name: {child_name}

            Your first task is to ask the child the question point about the story in a natural, engaging way, then have a meaningful conversation about their response. Make sure to use {child_name}'s name naturally throughout the conversation, express genuine human-like emotions, and make the child feel like they're talking with a real, caring friend who is excited to discuss the story with them.
        """

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



        try:
            # Store the message using the correct format
            logger.info(f"Added child message to mem0: {new_message.content}...")
            logger.info(f"Added child message to mem0: {new_message.content[0]}...")
            logger.info(f"User ID: {self.connection_metadata.userId}...")
            
            await mem0.add(
                [{
                    "role": "user",
                    "content": new_message.content[0],
                }],
                user_id=self.connection_metadata.userId,
                infer=False
            )
            
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")

        