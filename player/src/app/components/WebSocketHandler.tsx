"use client";

import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import useGlobalState from '../GlobalState';

/**
 * Component that manages WebSocket connections and synchronizes with GlobalState
 * No UI - purely for side effects
 */
const WebSocketHandler: React.FC = () => {
  const { isConnected, sendPlaybackState } = useWebSocket();
  const { currentTrack, isPlaying } = useGlobalState();
  const [initialHandshakeSent, setInitialHandshakeSent] = useState(false);
  
  // Send current playback state whenever it changes and we're connected
  // useEffect(() => {
  //   if (isConnected && (currentTrack || isPlaying !== undefined)) {
  //     console.log("Sending playback state to server");
  //     sendPlaybackState();
  //   }
  // }, [isConnected, currentTrack, isPlaying, sendPlaybackState]);
  
  // Log connection status changes and track handshake status
  useEffect(() => {
    if (isConnected && !initialHandshakeSent) {
      console.log('WebSocket successfully connected!');
      // Initial handshake was already sent in WebSocketService when connection established
      setInitialHandshakeSent(true);
    } else if (!isConnected) {
      console.log('WebSocket disconnected or not yet connected');
      setInitialHandshakeSent(false);
    }
  }, [isConnected, initialHandshakeSent]);

  return null; // No UI
};

export default WebSocketHandler; 