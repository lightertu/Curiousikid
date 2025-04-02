import asyncio
import sys
import logging
import time

from openai import BaseModel
from voice_agent.environment import ENV

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import deepgram, openai, silero
logger = logging.getLogger("voice-assistant")

TIMEOUT_SECONDS = 10
PROMPT_WARNING_TIME = 3
GOODBYE_DELAY = 0.5
SILENCE_FOLLOW_UP_RETRY = 2
class AgentMonitoringState(BaseModel):
    last_interaction_time: float
    is_agent_speaking: bool
    is_user_speaking: bool
    silence_follow_up_retry: int

@function_tool
async def lookup_weather(
    context: RunContext,
    location: str,
):
    """Used to look up weather information."""

    return {"weather": "sunny", "temperature": 70}


async def entrypoint(ctx: JobContext):
    monitoring_state = AgentMonitoringState(
        last_interaction_time=time.time(),
        silence_follow_up_retry=SILENCE_FOLLOW_UP_RETRY,
        is_agent_speaking=False,
        is_user_speaking=False
    )

    await ctx.connect()

    agent = Agent(
        instructions="You are a friendly voice assistant built by LiveKit.",
        tools=[lookup_weather],
    )
    session = AgentSession(
        vad=silero.VAD.load(),
        # any combination of STT, LLM, TTS, or realtime API can be used
        stt=deepgram.STT(model="nova-3"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="nova", instructions="You are a friendly voice assistant built by LiveKit."),
    )

    def reset_timeout():
        nonlocal monitoring_state
        monitoring_state.last_interaction_time = time.time()

    def reset_follow_up_retry():
        nonlocal monitoring_state
        monitoring_state.silence_follow_up_retry = SILENCE_FOLLOW_UP_RETRY
        monitoring_state.last_interaction_time = time.time()

    
    async def hangup():
        logger.info("Idle too long, hanging up")
        try:
            await ctx.room.disconnect()
            # Or maybe you want to remove participant here?
            # https://github.com/livekit-examples/outbound-caller-python/blob/main/agent.py#L108
        except Exception as e:
            logger.warning(f"Error while ending call: {e}")

    async def should_end_call():
        nonlocal monitoring_state

        is_inactive = not (monitoring_state.is_agent_speaking or monitoring_state.is_user_speaking)
        is_exhausted_follow_up = monitoring_state.silence_follow_up_retry <= 0
        return is_inactive and is_exhausted_follow_up

    async def monitor_interaction():
        while True:
            print("monitoring_state", monitoring_state)
            is_active = monitoring_state.is_agent_speaking or monitoring_state.is_user_speaking
            if is_active:
                reset_timeout()
                await asyncio.sleep(1)  # Check every second
                continue
                
            if await should_end_call():
                logger.info("Ending call due to inactivity.")
                await session.say("Goodbye!", allow_interruptions=False)
                await asyncio.sleep(GOODBYE_DELAY)
                await hangup()
                break

            is_inactive = not (monitoring_state.is_agent_speaking or monitoring_state.is_user_speaking)
            is_inactive_timeout = time.time() - monitoring_state.last_interaction_time >= PROMPT_WARNING_TIME

            if is_inactive and is_inactive_timeout:
                logger.info("Sending follow up prompt")
                monitoring_state.silence_follow_up_retry = monitoring_state.silence_follow_up_retry - 1
                await session.say("Are you still there?", allow_interruptions=True)

            await asyncio.sleep(1)  # Check every second
    
    # Event handlers
    @session.on("agent_started_speaking")
    def handle_agent_started_speaking():
        nonlocal monitoring_state
        monitoring_state.is_agent_speaking = True
        logger.info("Agent started speaking")
        reset_timeout()

    @session.on("agent_stopped_speaking")
    def handle_agent_stopped_speaking():
        nonlocal monitoring_state
        monitoring_state.is_agent_speaking = False
        logger.info("Agent stopped speaking")
        reset_timeout()

    @session.on("user_started_speaking")
    def handle_user_started_speaking():
        nonlocal monitoring_state
        monitoring_state.is_user_speaking = True
        logger.info("User started speaking")
        reset_follow_up_retry()

    @session.on("user_stopped_speaking")
    def handle_user_stopped_speaking():
        nonlocal monitoring_state
        monitoring_state.is_user_speaking = False
        logger.info("User stopped speaking")
        reset_follow_up_retry()

    asyncio.create_task(monitor_interaction())

    await session.start(agent=agent, room=ctx.room)
    await session.say("Are you ready for a question?")
    await session.generate_reply(instructions="greet the user and ask about their day")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))