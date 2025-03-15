"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../lib/services/WebSocketService';

interface WebSocketContextType {
  isConnected: boolean;
  isVoiceStreaming: boolean;
  startVoiceStreaming: () => Promise<boolean>;
  stopVoiceStreaming: () => void;
  sendPlaybackState: () => void;
  sendTrackContextUpdate: (trackId: string, duration: number, currentTime: number) => void;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isVoiceStreaming, setIsVoiceStreaming] = useState(false);
  
  useEffect(() => {
    // Initialize the service
    const service = WebSocketService.getInstance(serverUrl);
    setWsService(service);
    
    // Set up event listeners
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    service.wsManager.on('connected', handleConnected);
    service.wsManager.on('disconnected', handleDisconnected);
    
    // Connect to the server
    service.connect();
    
    // Clean up on unmount
    return () => {
      service.wsManager.removeListener('connected', handleConnected);
      service.wsManager.removeListener('disconnected', handleDisconnected);
    };
  }, [serverUrl]);
  
  const startVoiceStreaming = async (): Promise<boolean> => {
    if (!wsService) return false;
    
    const result = await wsService.startVoiceStreaming();
    setIsVoiceStreaming(result);
    return result;
  };
  
  const stopVoiceStreaming = (): void => {
    if (!wsService) return;
    
    wsService.stopVoiceStreaming();
    setIsVoiceStreaming(false);
  };
  
  const sendPlaybackState = (): void => {
    if (!wsService) return;
    
    wsService.sendPlaybackState();
  };
  
  const sendTrackContextUpdate = (trackId: string, duration: number, currentTime: number): void => {
    if (!wsService) return;
    
    wsService.sendTrackContextUpdate(trackId, duration, currentTime);
  };
  
  const value = {
    isConnected,
    isVoiceStreaming,
    startVoiceStreaming,
    stopVoiceStreaming,
    sendPlaybackState,
    sendTrackContextUpdate
  };
  
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