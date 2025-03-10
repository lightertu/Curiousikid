"use client";

import { AnimatePresence, motion } from "framer-motion";
import {v4 as uuidv4} from 'uuid';
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  useRoomContext,
  AgentState,
} from "@livekit/components-react";
import {useCallback, useEffect, useRef, useState} from "react";
import { MediaDeviceFailure } from "livekit-client";
import type { LiveKitAuthPutResponse } from "@/app/api/livekit/auth/route";
import { NoAgentNotification } from "@/components/livekit/NoAgentNotification";
import {usePlayback} from "@/app/playback-context";
import {CustomVoiceAssistantControlBar} from "@/components/livekit/CustomerVoiceAssistantControlBar";

export function VoiceConsole() {
  const [connectionDetails, setConnectionDetails] = useState<
    LiveKitAuthPutResponse | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("initializing");
  const { currentTrack } = usePlayback();
  const connectRoom = () => {
    const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
        "/api/livekit/auth",
        window.location.origin
    );
    const participantId = "raytu";
    const roomName = `${participantId}-${currentTrack?.id}-${uuidv4()}`;
    fetch(url.toString(), {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: participantId,
        roomName: roomName
      })
    })
    .then(response => response.json())
    .then((data) => setConnectionDetails(data))
  }

  useEffect(connectRoom, []);

  return (
      <main
          data-lk-theme="default"
          className="h-full grid content-center bg-[var(--lk-bg)]"
      >
        <LiveKitRoom
            token={connectionDetails?.participantToken}
            serverUrl={connectionDetails?.serverUrl}
            connect={connectionDetails !== undefined}
            audio={false}
            video={false}
            onMediaDeviceFailure={onDeviceFailure}
            onDisconnected={() => {
              setConnectionDetails(undefined);
            }}
            className="grid grid-rows-[2fr_1fr] items-center"
        >
        <SimpleVoiceAssistant onStateChange={setAgentState} />
        <ControlBar
          agentState={agentState}
          onConnectButtonClicked={connectRoom}
        />
        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
        </LiveKitRoom>
      </main>
  )
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);
  return (
    <div className="h-[300px] max-w-[90vw] mx-auto">
      <BarVisualizer
        state={state}
        barCount={3}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{
          minHeight: 20,
          maxHeight: 30
        }}
      />
    </div>
  );
}

function ControlBar(props: {
  agentState: AgentState;
  onConnectButtonClicked: () => void;
}) {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on paid plans, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const { currentTrack, currentTime, pausePlay, resumePlay } = usePlayback();
  const currentRoom = useRoomContext();
  const currentTimeRef = useRef(currentTime);
  const currentTrackRef = useRef(currentTrack);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    currentTrackRef.current = currentTrack;
    currentRoomRef.current = currentRoom;

  }, [currentTime, currentTrack, currentRoom]);

  useEffect(() => {
    return () => {
      currentRoom.disconnect(true).then(() => {
        console.log(currentRoom);
      })
    }
  }, [currentRoom]);

  const onUnmuteClicked = () => {
    console.log(`From inside: ${currentTimeRef.current}`)
    pausePlay();
    currentRoom.localParticipant.setMetadata(JSON.stringify({
      podcast: currentTrackRef.current,
      podcastTimestamp: currentTimeRef.current,
    }))
  }

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{opacity: 0, top: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0, top: "-10px"}}
            transition={{duration: 1, ease: [0.09, 1.04, 0.245, 1.055]}}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
            onClick={() => {
              props.onConnectButtonClicked()
            }}
          >
          Reconnect
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!["initializing", "connecting", "disconnected"].includes(props.agentState) && (
          <motion.div
            initial={{opacity: 0, top: "10px"}}
            animate={{opacity: 1, top: 0}}
            exit={{opacity: 0, top: "-10px"}}
            transition={{duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055]}}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <CustomVoiceAssistantControlBar
              controls={{
                microphone: true,
                onMute: () => {
                  resumePlay()
                },
                onUnmute: onUnmuteClicked,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
      "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
