'use client';

import React, { useEffect } from 'react';
import { useState } from "react";
import useGlobalState from '../GlobalState';

import { CloseIcon } from "./livekit/CloseIcon";
import { NoAgentNotification } from "./livekit/NoAgentNotification";
import {
  AgentState,
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";

const AIVoiceModal: React.FC = () => {
  const { isLivekitRoomConnected, setIsPlaying, setQuestionPoint } = useGlobalState();
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [agentConnected, setAgentConnected] = useState<boolean>(false);
  const { state, audioTrack } = useVoiceAssistant();

  useEffect(() => {
    setAgentState(state);
    const isAgentConnected = state === "speaking" || state === "listening" || state === "thinking";
    setAgentConnected(isAgentConnected);
    if (isAgentConnected) {
      console.log("Agent is connected, set isPlaying to false");
      setQuestionPoint(null);
      setIsPlaying(false);
    } 
  }, [state, setIsPlaying]);

  return (
    <>
      {/* Always render these components regardless of state */}
      {/* Only show the modal when connected */}
      {isLivekitRoomConnected && agentConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          
          {/* Modal content */}
          <div className="relative w-[80%] max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            <main data-lk-theme="default" className="p-8">
              <div className="h-[300px] mx-auto mb-6">
                <BarVisualizer
                  state={state}
                  barCount={5}
                  trackRef={audioTrack}
                  className="agent-visualizer"
                  options={{ minHeight: 24 }}
                />
              </div>
              <ControlBar agentState={agentState} />
              <RoomAudioRenderer />
              <NoAgentNotification state={agentState} />
            </main>
          </div>
        </div>
      )}
    </>
  );
};

function ControlBar(props: { agentState: AgentState }) {
  // const krisp = useKrispNoiseFilter();
  // useEffect(() => {
  //   krisp.setNoiseFilterEnabled(true);
  // }, []);

  return (
    <div className="relative h-[100px]">
      {props.agentState !== "disconnected" && (
        <div className="flex h-8 justify-center">
          <VoiceAssistantControlBar controls={{ leave: false }} />
          <DisconnectButton>
            <CloseIcon />
          </DisconnectButton>
        </div>
      )}
    </div>
  );
}

export default AIVoiceModal; 