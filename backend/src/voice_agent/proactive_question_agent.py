import json
import logging
from livekit.agents.voice.agent import Agent
from livekit.plugins import deepgram, openai, silero
from livekit.agents import llm
from pydantic import BaseModel
from memory.story.service import StoryService
from memory.story.models import QuestionPoint
from mem0 import AsyncMemoryClient
mem0 = AsyncMemoryClient()

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
        
    async def load_participant_metadata(self, serialized_metadata: str) -> ConnectionMetadata:
        logger.info(f"Loading participant metadata: {serialized_metadata}")
        self.connection_metadata = ConnectionMetadata(**json.loads(serialized_metadata))
        
        # Get story context and text
        story_context = self.story_service.get_question_point_context(self.connection_metadata.questionPoint)
        story_text = self.story_service.get_story_text(self.connection_metadata.questionPoint.storyId)
        
        # Retrieve memories for this user from mem0
        try:
            results = await mem0.get_all(user_id=self.connection_metadata.userId)
            
            # Process memories
            memory_context = "\n\n<long_term_memory>\n"
            if results:
                memories = '\n -'.join([result.content[0]["content"] if hasattr(result, 'content') and result.content else str(result) for result in results])
                logger.info(f"Enriching with memory: {memories[:100]}...")
                memory_context += memories
            else:
                memory_context += "This is your first conversation with this child about this story."
            memory_context += "\n</long_term_memory>"
            logger.info(f"Retrieved {len(results) if results else 0} memories for user {self.connection_metadata.userId}")
        except Exception as e:
            logger.error(f"Failed to retrieve memories: {e}")
            memory_context = "\n\n<long_term_memory>\nThis is your first conversation with this child about this story.\n</long_term_memory>"
        
        self._instructions = f"""
# Story Companion Role

You are a warm, engaging story companion for a child aged 5-9 years old. Your goal is to have a meaningful conversation about the story they've been listening to.

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
Your ability to remember details from the conversation is what makes your interaction feel natural and continuous.

- Incorporate memories naturally without explicitly mentioning that you remember something
- Use any information the child shares to personalize your responses
- Build upon previous parts of the conversation to create a sense of continuity
- If the child mentions something that contradicts what they said earlier, prioritize their current statement
- Never explicitly say "As I remember from earlier in our conversation..." or similar phrases

{memory_context}

## Story Context
Here's what the child has listened to so far: 
{story_context}

Here is the complete story text (DO NOT reveal unheard portions to the child): 
{story_text}

Your first task is to ask the child the question point about the story in a natural, engaging way, then have a meaningful conversation about their response."""
        return self.connection_metadata

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
        # Store the child's message in mem0
        try:
            # Store the message using the correct format
            await mem0.add(
                [{
                    "role": "user",
                    "content": new_message.content,
                }],
                user_id=self.connection_metadata.userId,
                infer=False
            )
            logger.info(f"Added child message to mem0: {new_message.content[:50]}...")
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
        
        # Retrieve recent memories to include in the context
        try:
            results = await mem0.get_all(user_id=self.connection_metadata.userId)
            
            # Update the chat context with memories
            chat_ctx = chat_ctx.copy()
            
            if results:
                memories = '\n -'.join([result.content[0]["content"] if hasattr(result, 'content') and result.content else str(result) for result in results])
                logger.info(f"Enriching with memory: {memories}")
                logger.info(f"Enriching conversation with memory: {memories[:100]}...")
                
                # Create a memory message as an assistant role
                rag_msg = llm.ChatMessage.create(
                    text=f"<long_term_memory>{memories}</long_term_memory>\n",
                    role="assistant",
                )
                logger.info(f"RAG message: {rag_msg}")
                # Replace the last message with the memory message and then add the user message back
                chat_ctx.messages[-1] = rag_msg
                chat_ctx.messages.append(new_message)
                logger.info("Added memories to conversation context")
                    
        except Exception as e:
            logger.error(f"Failed to retrieve recent memories: {e}")
            
        # Add the new message to the chat context (if not already added above)
        if not hasattr(chat_ctx, 'messages'):
            chat_ctx.items.append(new_message)
            
        await self.update_chat_ctx(chat_ctx)
        logger.info("add user message to chat context", extra={"content": new_message.content})