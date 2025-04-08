"use client";

import React from 'react';
import useDeviceState from '../DeviceState';
/**
 * A simple component to display WebSocket connection status
 * Useful for debugging and user feedback
 */
const WebSocketStatus: React.FC = () => {
  const { isWebSocketConnected } = useDeviceState();

  return (
    <div className="fixed bottom-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-medium shadow-md">
      <div className={`flex items-center ${isWebSocketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        {isWebSocketConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default WebSocketStatus; 