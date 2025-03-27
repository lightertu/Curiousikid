import { EventEmitter } from 'events';

import { WebSocketConnection, ProtocolRegistry } from './Protocol';
import { MessageType } from './MessageTypes';
import { StoryProtocol } from './protocols/StoryProtocol';
import { MicrophoneProtocol } from './protocols/MicrophoneProtocol';

/**
 * WebSocketManager handles all WebSocket communication with the server.
 * It implements WebSocketConnection to provide a consistent interface for protocols.
 * It also extends EventEmitter to provide a pub/sub pattern for WebSocket events.
 */
export default class WebSocketManager extends EventEmitter implements WebSocketConnection {
  // Keep socket private to prevent external code from directly manipulating it
  private socket: WebSocket | null = null;
  private readonly url: string;
  
  // Protocol registry and specific protocols
  private readonly protocolRegistry: ProtocolRegistry;
  private readonly storyProtocol: StoryProtocol;
  private readonly microphoneProtocol: MicrophoneProtocol;
  
  // Reconnection logic variables
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  // Start with 2s delay, will increase exponentially with each attempt
  private readonly reconnectDelay = 2000;
  
  constructor(url: string) {
    super();
    this.url = url;
    
    // Create protocols and registry
    this.protocolRegistry = new ProtocolRegistry(this);
    this.storyProtocol = new StoryProtocol(this);
    this.microphoneProtocol = new MicrophoneProtocol(this);
    
    // Register protocols
    this.protocolRegistry.registerProtocol(this.storyProtocol);
    this.protocolRegistry.registerProtocol(this.microphoneProtocol);
  }
  
  /**
   * Initialize WebSocketManager and all protocols
   */
  async initialize(): Promise<void> {
    console.log('Initializing WebSocketManager');
    await this.protocolRegistry.initialize();
  }
  
  /**
   * Establishes WebSocket connection if not already connected.
   * Prevents multiple connection attempts if one is already in progress.
   */
  public connect(): void {
    // Guard against multiple connection attempts
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }
    
    this.socket = new WebSocket(this.url);
    
    // Bind event handlers using .bind(this) to maintain correct 'this' context
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    
    // Set to arraybuffer for better performance with binary data
    this.socket.binaryType = 'arraybuffer';
  }
  
  /**
   * Handles successful WebSocket connection.
   * Resets reconnection attempts and sends initial handshake.
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.emit('connected');
    
    // Send handshake immediately after connection to identify client
    this.send(MessageType.HANDSHAKE, { 
      client: 'web-player',
      version: '1.0.0',
      capabilities: ['audio-streaming', 'voice-input']
    });
  }
  
  /**
   * Handles WebSocket closure, implementing automatic reconnection.
   * Uses exponential backoff to prevent server flooding.
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.emit('disconnected', event);
    
    // Only attempt reconnect if closure wasn't clean (code 1000)
    // and we haven't exceeded max attempts
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handles WebSocket errors by emitting them for external error handling.
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }
  
  /**
   * Processes incoming WebSocket messages, handling both binary and JSON data.
   * Routes messages to appropriate protocols.
   */
  private handleMessage(event: MessageEvent): void {
    // Handle binary data
    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      this.handleBinaryData(event.data);
      return;
    }
    
    // Parse and distribute JSON messages
    try {
      const message = JSON.parse(event.data);
      const { type, payload } = message;
      
      if (!type) {
        console.error('Message missing type:', message);
        return;
      }
      
      // Emit event for backward compatibility
      this.emit(type, payload);
      
      // Route to protocol handlers
      this.protocolRegistry.handleMessage(type, payload).catch(error => {
        console.error('Error routing message:', error);
      });
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Handle binary data from the server
   */
  private handleBinaryData(data: ArrayBuffer | Blob): void {
    // Emit binary event for backward compatibility
    this.emit('binary', data);
    
    // Route to protocol handlers
    this.protocolRegistry.handleBinaryData(data).catch(error => {
      console.error('Error routing binary data:', error);
    });
  }
  
  /**
   * Implements exponential backoff for reconnection attempts.
   * Delay increases with each attempt to prevent overwhelming the server.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Use exponential backoff (1.5^attempts) to gradually increase delay
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts));
  }
  
  /**
   * Sends JSON message to server. Returns false if send fails.
   * Implements the WebSocketConnection interface.
   */
  public send(type: string, payload: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    this.socket.send(JSON.stringify({ type, payload }));
    return true;
  }
  
  /**
   * Clean disconnection method that prevents reconnection attempts
   */
  public disconnect(): void {
    if (this.socket) {
      // Use code 1000 for normal closure
      this.socket.close(1000, 'Client disconnected normally');
      this.socket = null;
    }
    
    // Clear any pending reconnect attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Send binary data to the server
   * Implements the WebSocketConnection interface.
   */
  public sendBinary(data: ArrayBuffer | Blob): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    this.socket.send(data);
    return true;
  }
  
  /**
   * Check if the WebSocket is connected
   * Implements the WebSocketConnection interface.
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get the story protocol for direct interaction
   */
  public getStoryProtocol(): StoryProtocol {
    return this.storyProtocol;
  }
  
  /**
   * Get the microphone protocol for direct interaction
   */
  public getMicrophoneProtocol(): MicrophoneProtocol {
    return this.microphoneProtocol;
  }
  
  /**
   * Clean up resources
   */
  public async shutdown(): Promise<void> {
    await this.protocolRegistry.shutdown();
    this.disconnect();
  }
} 