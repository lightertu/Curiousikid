import asyncio
import logging

from memory.story.service import StoryService
from livekit.agents import (
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
)
from voice_agent.inactivity_monitor import InactivityMonitor
from voice_agent.proactive_question_agent import ProactiveQuestionAgent

STORY_SERVICE = StoryService()

logger = logging.getLogger("voice-assistant")


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    agent = ProactiveQuestionAgent()

    session = AgentSession()

    monitor = InactivityMonitor(session, ctx)

    # We pass question point to the agent via participant metadata,
    # assuming we have one remote participant per room
    if ctx.room.remote_participants:
        for _, participant in ctx.room.remote_participants.items():
            agent.load_participant_metadata(participant.metadata)
            break

    await session.start(agent=agent, room=ctx.room)

    # Make sure the monitor is running after the session is started
    asyncio.create_task(monitor.monitor_interaction())


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
