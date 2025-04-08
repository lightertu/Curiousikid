import asyncio
import logging
from voice_agent.agents.agent_factory import AgentFactory
from livekit.agents import (
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
)
from voice_agent.inactivity_monitor import InactivityMonitor

logger = logging.getLogger("voice-assistant")


async def entrypoint(ctx: JobContext):
    await ctx.connect()
    participant = await ctx.wait_for_participant()
    print("Participant joined with metadata: ", participant.metadata)

    agent_factory = AgentFactory()

    agent = agent_factory.get_agent(participant.metadata)

    session = AgentSession()

    monitor = InactivityMonitor(session, ctx)

    await session.start(agent=agent, room=ctx.room)
    # Make sure the monitor is running after the session is started
    asyncio.create_task(monitor.monitor_interaction())


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
