"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../lib/services/WebSocketService';
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType } from '../DeviceStateMachine';
import { useSelector } from '@xstate/react';

interface WebSocketContextType {
  isWebSocketConnected: boolean;
  websocketService: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
  serverUrl: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  serverUrl
}) => {
  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
    return {
      value: state.value,
      context: state.context
    }
  });

  const { isWebSocketConnected } = deviceContext.context;

  const setIsWebSocketConnected = (isConnected: boolean) => {
    console.log('setIsWebSocketConnected', isConnected);
    DEVICE_STATE_MACHINE_ACTOR.send({
      type: DeviceEventType.SET_IS_WEBSOCKET_CONNECTED,
      payload: {
        isWebSocketConnected: isConnected
      }
    });
  };

  useEffect(() => {
    // Initialize the service
    const service = WebSocketService.getInstance(serverUrl);
    setWsService(service);

    // Set up event listeners
    const handleConnected = () => setIsWebSocketConnected(true);
    const handleDisconnected = () => setIsWebSocketConnected(false);

    service.wsManager.on('connected', handleConnected);
    service.wsManager.on('disconnected', handleDisconnected);

    // Connect to the server
    service.wsManager.connect();

    // Clean up on unmount
    return () => {
      service.wsManager.removeListener('connected', handleConnected);
      service.wsManager.removeListener('disconnected', handleDisconnected);
    };
  }, [serverUrl]);

  const value = React.useMemo(() => ({
    isWebSocketConnected,
    websocketService: wsService as WebSocketService,
  }), [isWebSocketConnected, wsService]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}; 