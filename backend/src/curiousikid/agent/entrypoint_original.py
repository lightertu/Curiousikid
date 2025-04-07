import asyncio
import logging
import json
import time
import random
import re
from datetime import datetime

from livekit.agents import JobContext, llm, AutoSubscribe, WorkerOptions
from livekit.agents.cli import cli
from livekit.agents.llm import ChatContext, LLMStream
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, openai, silero
from livekit.rtc import RemoteParticipant
from livekit.plugins import openai, deepgram, silero, elevenlabs, anthropic
from typing import Annotated, Optional, List, Dict, Any

from curiousikid.envionrment import ENV
from curiousikid.agent.prompts import system_prompt, voice_instructions, voice_instructions_2
from curiousikid.agent.rag_index import retrieve_stories, add_rag_to_prompt

logger = logging.getLogger("chatroom")

# Define conversation state constants
IDLE_TIMEOUT = 20  # seconds of silence before proactive engagement
MAX_TURNS_WITHOUT_QUESTION = 3  # maximum number of exchanges without a question from agent
INTEREST_TOPICS = ["space", "animals", "dinosaurs", "weather", "music", "sports", "science"]

# Define story request patterns
STORY_REQUEST_PATTERNS = [
    r"(?i)tell me a story",
    r"(?i)can you tell a story",
    r"(?i)story about",
    r"(?i)stories about",
    r"(?i)once upon a time",
    r"(?i)let's make a story",
    r"(?i)i want to hear a story",
    r"(?i)tell me about .+ story",
]


class CurioFnc(llm.FunctionContext):
    """
    The class defines LLM functions that the Curio assistant can execute.
    """
    
    def _is_story_request(self, message: str) -> bool:
        """Check if the message is requesting a story"""
        if not message:
            return False
            
        for pattern in STORY_REQUEST_PATTERNS:
            if re.search(pattern, message):
                return True
        return False
    
    @llm.ai_callable()
    async def retrieve_insp_story(
        self,
        user_input: Annotated[str, llm.TypeInfo(description="The child's message or story request")],
    ) -> Dict[str, Any]:
        """
        Called when the child asks for a story. This function will retrieve relevant story inspiration 
        based on the child's input.
        Only call this function when the child explicitly asks for a story.
        """
        logger.info(f"Retrieving inspirational stories for query: '{user_input}'")
        
        try:
            # Retrieve relevant stories
            stories = retrieve_stories(
                query=user_input,
                build_if_missing=True,
                top_k=2
            )
            
            if not stories:
                logger.info("No relevant stories found")
                return {"inspiration": "", "found": False}
            
            # Create inspiration context
            inspiration = add_rag_to_prompt(stories)
            logger.info("Story inspiration retrieved successfully")
            
            return {
                "inspiration": inspiration,
                "found": True
            }
            
        except Exception as e:
            logger.error(f"Error retrieving story inspiration: {str(e)}")
            return {"inspiration": "", "found": False, "error": str(e)}


async def entrypoint(ctx: JobContext):
    
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
           system_prompt
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    logger.info(f"waiting for participant to join")
    participant = await ctx.wait_for_participant()

    async def rag(agent: VoicePipelineAgent, chat_ctx: llm.ChatContext):
        print(ctx.room.remote_participants.get(participant.identity).metadata)
        
        # ADD A RAG to pull some inspirational story from the database 
        # add that as the additional context in the form of another system message 
        # Then pass that to the story generation LLM agent to send out the repsonse. 
        # RAG to also pull personal information from mem-0 database 
        # Events contextual information such as date, time, location, etc. 
    
        # Use our standalone function with the build_if_missing flag instead
        """
        user_msg = chat_ctx.messages[-1]

        results = retrieve_stories(
            query=str(user_msg),
            build_if_missing=True,  # Build the index if needed
            top_k=3
        )
        rag_prompt = add_rag_to_prompt(results)

        rag_msg = llm.ChatMessage.create(
                text="Context:\n" + rag_prompt,
                role="assistant",
            )

        chat_ctx.messages[-1] = rag_msg
        chat_ctx.messages.append(user_msg)

        #return agent.llm.chat(
        #    chat_ctx=chat_ctx,
        #    fnc_ctx=agent.fnc_ctx,
        #)
        """

    # Create function context with our story retrieval function
    fnc_ctx = CurioFnc()

    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        #llm=openai.LLM(model="gpt-3.5-turbo"),
        llm=anthropic.LLM(model="claude-3-7-sonnet-20250219"),
        tts=openai.TTS(model="gpt-4o-mini-tts", voice="nova", instructions=voice_instructions),
        #tts=elevenlabs.tts.TTS(
        #    model="eleven_turbo_v2_5",  # Using user's specified model
        #    voice=elevenlabs.tts.Voice(
        #        id="jBpfuIE2acCO8z3wKNLl",  # Required voice ID
        #        name="gigi",  # Using user's specified voice
        #        category="premade",
        #        settings=elevenlabs.tts.VoiceSettings(
        #            stability=0.71,  # Using user's stability setting
        #            similarity_boost=0.5,  # Using user's similarity_boost setting
        #            style=0.0,  # Using user's style setting
        #            use_speaker_boost=True, 
        #            speed=0.9
        #       ),
        #    )
        #),
        before_llm_cb=rag,
        chat_ctx=initial_ctx,
        fnc_ctx=fnc_ctx,  # Add the function context
    )
    
    agent.start(ctx.room)
    await asyncio.sleep(1)

    await agent.say("Hey! Unmute yourself if you wanna chat!", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
