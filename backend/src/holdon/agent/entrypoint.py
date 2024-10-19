import asyncio
import logging

from livekit.agents import JobContext, llm, AutoSubscribe, WorkerOptions
from livekit.agents.cli import cli
from livekit.agents.llm import ChatContext, LLMStream
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, openai, silero
from livekit.rtc import RemoteParticipant

from holdon.envionrment import ENV

logger = logging.getLogger("chatroom")


async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice assistant created by LiveKit. Your interface with users will be voice. "
            "You should use short and concise responses, and avoiding usage of unpronouncable punctuation."
        ),
    )

    @ctx.room.on(event="participant_connected")
    def participant_connected(remote_participant: RemoteParticipant):
        print(f"remote: {remote_participant.metadata}")

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()

    # wait for the first participant to connect

    def rag(agent: VoicePipelineAgent, chat_ctx: ChatContext) -> LLMStream:
        logger.info(f"chat_ctx: {chat_ctx._metadata}")
        return agent.llm.chat(
            chat_ctx=chat_ctx,
            fnc_ctx=agent.fnc_ctx,
        )

    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-3.5-turbo"),
        tts=openai.TTS(),
        before_llm_cb=rag,
        chat_ctx=initial_ctx,
    )

    agent.start(ctx.room)
    await asyncio.sleep(1)

    await agent.say("Hey, how can I help you today?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
