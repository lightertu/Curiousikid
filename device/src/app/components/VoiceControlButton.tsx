import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import useDeviceState from '../DeviceState';

const VoiceControlButton: React.FC = () => {
  const { isWebSocketConnected, isVoiceStreaming, startVoiceStreaming, stopVoiceStreaming } = useDeviceState();
  const [isLoading, setIsLoading] = useState(false);

  const handleVoiceControl = async () => {
    if (!isWebSocketConnected) return;

    if (isVoiceStreaming) {
      stopVoiceStreaming();
    } else {
      setIsLoading(true);
      await startVoiceStreaming();
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleVoiceControl}
      disabled={!isWebSocketConnected || isLoading}
      className={`rounded-full w-12 h-12 flex items-center justify-center transition-all ${isVoiceStreaming
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-blue-500 hover:bg-blue-600'
        } ${!isWebSocketConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <span className="animate-spin">⟳</span>
      ) : isVoiceStreaming ? (
        <span>◼</span> // Stop icon
      ) : (
        <span>◉</span> // Mic icon
      )}
    </button>
  );
};

export default VoiceControlButton; 