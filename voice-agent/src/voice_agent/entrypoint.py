import asyncio
import logging

from openai import BaseModel

from livekit.agents import (
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from voice_agent.inactivity_monitor import InactivityMonitor
from voice_agent.proactive_question_agent import ProactiveQuestionAgent

logger = logging.getLogger("voice-assistant")

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
    await ctx.connect()
    
    agent = ProactiveQuestionAgent()

    session = AgentSession()

    monitor = InactivityMonitor(session, ctx)

    print("Before")
    print("metadata", ctx.room.remote_participants)
    await session.start(agent=agent, room=ctx.room)
    print("After")

    # Make sure the monitor is running after the session is started
    asyncio.create_task(monitor.monitor_interaction())


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))