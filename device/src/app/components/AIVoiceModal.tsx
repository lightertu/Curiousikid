'use client';

import React, { useEffect } from 'react';
import { useState } from "react";
import useDeviceState from '../DeviceState';

import { CloseIcon } from "./livekit/CloseIcon";
import { NoAgentNotification } from "./livekit/NoAgentNotification";
import {
  AgentState,
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  useMaybeRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from 'livekit-client';

export interface AIVoiceModalProps {
  show: boolean;
  headline: string;
  onDisconnect: () => void;
  onConnect: () => void;
}

const AIVoiceModal: React.FC<AIVoiceModalProps> = ({ show, headline, onDisconnect, onConnect: onConnected }) => {
  const { voiceAgentState, setVoiceAgentState } = useDeviceState();
  const [agentConnected, setAgentConnected] = useState<boolean>(false);
  const { state, audioTrack } = useVoiceAssistant();
  const room = useMaybeRoomContext();


  useEffect(() => {
    const handleDisconnect = () => {
      if (room) {
        room.disconnect();
        onDisconnect();
        room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
      }

      console.log("Disconnected from room");
    }
    if (room) {
      room.on(RoomEvent.ParticipantDisconnected, handleDisconnect);
    }

    return () => {
      handleDisconnect();
    };
  }, [room]);

  useEffect(() => {
    setVoiceAgentState(state);
    const isAgentConnected = state === "speaking" || state === "listening" || state === "thinking";
    setAgentConnected(isAgentConnected);
    if (isAgentConnected) {
      onConnected();
    }

  }, [state]);

  return (
    <>
      {/* Always render these components regardless of state */}
      {/* Only show the modal when connected */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Modal content */}
          <div className="relative w-[80%] max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            <h1 className="text-2xl font-bold">{headline}</h1>
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
              <ControlBar agentState={voiceAgentState} onDisconnect={onDisconnect} />
              <RoomAudioRenderer />
              <NoAgentNotification state={voiceAgentState} />
            </main>
          </div>
        </div>
      )}
    </>
  );
};

function ControlBar(props: { agentState: AgentState, onDisconnect: () => void }) {
  // const krisp = useKrispNoiseFilter();
  // useEffect(() => {
  //   krisp.setNoiseFilterEnabled(true);
  // }, []);
  const room = useMaybeRoomContext();

  const disconnect = () => {
    if (room) {
      room.disconnect();
      props.onDisconnect();
    }
  }

  return (
    <div className="relative h-[100px]">
      {props.agentState !== "disconnected" && (
        <div className="flex h-8 justify-center">
          <VoiceAssistantControlBar controls={{ leave: false }} />
          <DisconnectButton onClick={disconnect}>
            <CloseIcon />
          </DisconnectButton>
        </div>
      )}
    </div>
  );
}

export default AIVoiceModal;
