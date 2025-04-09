'use client';

import React, { useEffect } from 'react';

import { CloseIcon } from "./livekit/CloseIcon";
import { NoAgentNotification } from "./livekit/NoAgentNotification";
import {
  AgentState,
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useMaybeRoomContext,
} from "@livekit/components-react";
import { AudioTrack, RoomEvent } from 'livekit-client';

export interface AIVoiceModalProps {
  show: boolean;
  agentState: AgentState;
  audioTrack: AudioTrack;
  onDisconnect: () => void;
  onConnect: () => void;
}

const AIVoiceModal: React.FC<AIVoiceModalProps> = ({ show, agentState, audioTrack, onDisconnect, onConnect: onConnected }) => {
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
    const isAgentConnected = agentState === "speaking" || agentState === "listening" || agentState === "thinking";
    if (isAgentConnected) {
      onConnected();
    }

  }, [agentState]);

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
            <main data-lk-theme="default" className="p-8">
              <div className="h-[300px] mx-auto mb-6">
                <BarVisualizer
                  state={agentState}
                  barCount={5}
                  trackRef={audioTrack}
                  className="agent-visualizer"
                  options={{ minHeight: 24 }}
                />
              </div>
              <ControlBar agentState={agentState} onDisconnect={onDisconnect} />
              <RoomAudioRenderer />
              <NoAgentNotification state={agentState} />
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
