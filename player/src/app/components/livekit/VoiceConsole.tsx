"use client";

import { NoAgentNotification } from "./NoAgentNotification";
import {
  AgentState,
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface StoryContext {
  timestamp: number;
}

export interface VoiceConsoleRef {
  isConnected: boolean;
  disconnect: () => Promise<void>;
}

export interface VoiceConsoleProps {
  readonly onAgentStateChange?: (state: AgentState) => void;
}

export function VoiceConsole({ onAgentStateChange }: VoiceConsoleProps) {
  const [agentState, setAgentState] = useState<AgentState>("disconnected");

  // Update setAgentState to also call the parent's handler
  const handleAgentStateChange = (state: AgentState) => {
    setAgentState(state);
    onAgentStateChange?.(state);
  };

  return (
    <main data-lk-theme="white" className="h-full grid content-center bg-[var(--lk-bg)]">
      <SimpleVoiceAssistant onStateChange={handleAgentStateChange} />
      <ControlBar agentState={agentState} />
      <RoomAudioRenderer />
      <NoAgentNotification state={agentState} />
    </main>
  );
}

function SimpleVoiceAssistant(props: { readonly onStateChange: (state: AgentState) => void }) {
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

function ControlBar(props: { readonly agentState: AgentState }) {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */


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
            <VoiceAssistantControlBar controls={{ leave: false }}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}