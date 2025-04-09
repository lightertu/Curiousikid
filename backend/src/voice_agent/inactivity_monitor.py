import asyncio
import time
import logging
from pydantic import BaseModel

from livekit.agents import AgentSession, JobContext

logger = logging.getLogger("agent-monitor")

TIMEOUT_SECONDS = 100000
PROMPT_WARNING_TIME = 100000
GOODBYE_DELAY = 0.5
SILENCE_FOLLOW_UP_RETRY = 2


class InteractionActivityState(BaseModel):
    last_interaction_time: float
    is_agent_speaking: bool
    is_user_speaking: bool
    silence_follow_up_retry: int

    @property
    def is_active(self):
        return self.is_agent_speaking or self.is_user_speaking

    def reset_timeout(self):
        self.last_interaction_time = time.time()

    def reset_follow_up_retry(self):
        self.silence_follow_up_retry = SILENCE_FOLLOW_UP_RETRY


class InactivityMonitor:
    def __init__(self, session: AgentSession, ctx: JobContext):
        self.state = InteractionActivityState(
            last_interaction_time=time.time(),
            is_agent_speaking=False,
            is_user_speaking=False,
            silence_follow_up_retry=SILENCE_FOLLOW_UP_RETRY,
        )
        self.session = session
        self._register_event_handlers()
        self.ctx = ctx

    async def monitor_interaction(self):
        while True:
            if self.state.is_active:
                self.state.reset_timeout()
                await asyncio.sleep(1)  # Check every second
                continue

            if await self._should_end_call():
                logger.info("Ending call due to inactivity.")
                await self.session.say("Goodbye!", allow_interruptions=False)
                await asyncio.sleep(GOODBYE_DELAY)
                await self._hangup()
                break

            is_inactive_timeout = (
                time.time() - self.state.last_interaction_time >= PROMPT_WARNING_TIME
            )

            if not self.state.is_active and is_inactive_timeout:
                logger.info("Sending follow up prompt")
                self.state.silence_follow_up_retry = (
                    self.state.silence_follow_up_retry - 1
                )
                await self.session.say("Are you still there?", allow_interruptions=True)

            await asyncio.sleep(1)  # Check every second

    async def _hangup(self):
        logger.info("Idle too long, hanging up")
        try:
            await self.ctx.room.disconnect()
            # Or maybe you want to remove participant here?
            # https://github.com/livekit-examples/outbound-caller-python/blob/main/agent.py#L108
        except Exception as e:
            logger.warning(f"Error while ending call: {e}")

    async def _should_end_call(self):
        is_inactive = not (self.state.is_agent_speaking or self.state.is_user_speaking)
        is_inactive_timeout = (
            time.time() - self.state.last_interaction_time >= PROMPT_WARNING_TIME
        )
        is_exhausted_follow_up = self.state.silence_follow_up_retry <= 0
        return is_inactive and is_exhausted_follow_up and is_inactive_timeout

    def _register_event_handlers(self):
        self.session.on("agent_started_speaking", self._handle_agent_started_speaking)
        self.session.on("agent_stopped_speaking", self._handle_agent_stopped_speaking)
        self.session.on("user_started_speaking", self._handle_user_started_speaking)
        self.session.on("user_stopped_speaking", self._handle_user_stopped_speaking)

    # Event handlers
    def _handle_agent_started_speaking(self):
        self.state.is_agent_speaking = True
        logger.info("Agent started speaking")
        self.state.reset_timeout()

    def _handle_agent_stopped_speaking(self):
        self.state.is_agent_speaking = False
        logger.info("Agent stopped speaking")
        self.state.reset_timeout()

    def _handle_user_started_speaking(self):
        self.state.is_user_speaking = True
        logger.info("User started speaking")
        self.state.reset_follow_up_retry()

    def _handle_user_stopped_speaking(self):
        self.state.is_user_speaking = False
        logger.info("User stopped speaking")
        self.state.reset_follow_up_retry()
