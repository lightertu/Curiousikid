"use client";

import { CloseIcon } from "./CloseIcon";
import { NoAgentNotification } from "./NoAgentNotification";
import {
  AgentState,
  BarVisualizer,
  DisconnectButton,
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { AnimatePresence, motion } from "framer-motion";
import { MediaDeviceFailure } from "livekit-client";
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import type { ConnectionDetails } from "../../api/livekit";
import { LiveKitApi } from "../../api/livekit";
export interface StoryContext {
  timestamp: number;
}

export interface VoiceConsoleRef {
  connect: (storyContext: StoryContext) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface VoiceConsoleProps {
}


export const VoiceConsole = forwardRef<VoiceConsoleRef, VoiceConsoleProps>((props, ref) => {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(
    undefined
  );
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  
  useImperativeHandle(ref, () => ({
    connect: async (storyContext: StoryContext) => {
      await onConnectButtonClicked();
    },
    disconnect: async () => {
    },
  }));
  
  const liveKitApi = new LiveKitApi();

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const connectionDetailsData = await liveKitApi.getConnectionDetails() as ConnectionDetails;
    // updateConnectionDetails(connectionDetailsData);
  }, []);

  const onDisconnectButtonClicked = useCallback(async (storyContext: StoryContext) => {
    console.log("Disconnecting from story context:", storyContext);
  }, []);

  return (
    <>
      <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
        <LiveKitRoom
          token={connectionDetails?.participantToken}
          serverUrl={connectionDetails?.serverUrl}
          connect={connectionDetails !== undefined}
          audio={true}
          video={false}
          onMediaDeviceFailure={onDeviceFailure}
          onDisconnected={() => {
            updateConnectionDetails(undefined);
          }}
          className="grid grid-rows-[2fr_1fr] items-center"
        >
          <SimpleVoiceAssistant onStateChange={setAgentState} />
          <ControlBar agentState={agentState} />
          <RoomAudioRenderer />
          <NoAgentNotification state={agentState} />
        </LiveKitRoom>
      </main>
    </>
  );
});

function SimpleVoiceAssistant(props: { onStateChange: (state: AgentState) => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);
  return (
    <div className="h-[300px] max-w-[90vw] mx-auto">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: { agentState: AgentState }) {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState !== "disconnected" && props.agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}