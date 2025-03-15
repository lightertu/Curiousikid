import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import WebSocketManager from './WebSocketManager';

// Define the shape of our context
type WebSocketContextType = {
  websocket: WebSocketManager | null;
  isConnected: boolean;
  send: <T = unknown>(type: string, payload: T) => boolean;
  sendBinary: (data: ArrayBuffer | Blob) => boolean;
  reconnect: () => void;
};

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  websocket: null,
  isConnected: false,
  send: () => false,
  sendBinary: () => false,
  reconnect: () => {},
});

// Default WebSocket URL - consider moving to env variables
const WS_URL = 'ws://localhost:8000';

type WebSocketProviderProps = {
  children: ReactNode;
  url?: string;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url = WS_URL 
}) => {
  const [websocket, setWebsocket] = useState<WebSocketManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket
  useEffect(() => {
    // Create WebSocket manager
    const ws = new WebSocketManager(url);

    // Listen for connection state changes
    ws.on('connected', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    ws.on('disconnected', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Store the manager in state
    setWebsocket(ws);

    // Connect immediately
    ws.connect();

    // Cleanup on unmount
    return () => {
      ws.disconnect();
    };
  }, [url]);

  // Utility functions that wrap the WebSocket methods
  const send = <T = unknown>(type: string, payload: T): boolean => {
    return websocket?.send(type, payload) || false;
  };

  const sendBinary = (data: ArrayBuffer | Blob): boolean => {
    return websocket?.sendBinary(data) || false;
  };

  const reconnect = () => {
    websocket?.connect();
  };

  return (
    <WebSocketContext.Provider 
      value={{ websocket, isConnected, send, sendBinary, reconnect }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook for using WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}; 