import { EventEmitter } from 'events';

// Define handler types for better type safety and code readability
type MessageHandler = (data: any) => void;
type BinaryHandler = (data: Blob | ArrayBuffer) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

/**
 * WebSocketManager handles all WebSocket communication with the server.
 * It extends EventEmitter to provide a pub/sub pattern for WebSocket events,
 * allowing multiple components to listen for and react to WebSocket messages.
 */
export default class WebSocketManager extends EventEmitter {
  // Keep socket private to prevent external code from directly manipulating it
  private socket: WebSocket | null = null;
  private url: string;
  
  // Reconnection logic variables
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  // Start with 2s delay, will increase exponentially with each attempt
  private reconnectDelay = 2000;
  
  // Store message handlers separately from EventEmitter handlers
  // This allows for type-specific message handling and easier cleanup
  private messageHandlers: Record<string, MessageHandler[]> = {};
  private binaryHandlers: BinaryHandler[] = [];
  
  constructor(url: string) {
    super();
    this.url = url;
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
    // Blobs would require additional async operations to process
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
    // This helps server understand client capabilities
    this.send('HANDSHAKE', { 
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
   * Routes messages to appropriate handlers based on type.
   */
  private handleMessage(event: MessageEvent): void {
    // Handle binary data
    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      console.log("Binary data received:", 
        event.data instanceof ArrayBuffer ? `${event.data.byteLength} bytes` : `${event.data.size} bytes`);
      this.handleBinaryData(event.data);
      return;
    }
    
    // Parse and distribute JSON messages to registered handlers
    try {
      const message = JSON.parse(event.data);
      const { type, payload } = message;
      
      // Emit specific event for EventEmitter listeners
      this.emit(type, payload);
      
      // Call type-specific handlers
      if (this.messageHandlers[type]) {
        this.messageHandlers[type].forEach(handler => handler(payload));
      }
      
      // Emit generic message event for logging/debugging
      this.emit('message', message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
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
   * Public methods below provide a clean API for external code to interact
   * with the WebSocket connection
   */
  
  /**
   * Sends JSON message to server. Returns false if send fails.
   */
  public send(type: string, payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    this.socket.send(JSON.stringify({ type, payload }));
    return true;
  }
  
  /**
   * Registers a handler for specific message types.
   * Returns cleanup function for easy handler removal.
   */
  public onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    
    this.messageHandlers[type].push(handler);
    
    // Return cleanup function for easy unsubscribe
    return () => {
      if (this.messageHandlers[type]) {
        const index = this.messageHandlers[type].indexOf(handler);
        if (index !== -1) {
          this.messageHandlers[type].splice(index, 1);
        }
      }
    };
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
  
  public sendBinary(data: ArrayBuffer | Blob): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    this.socket.send(data);
    return true;
  }
  
  public onBinary(handler: BinaryHandler): () => void {
    this.binaryHandlers.push(handler);
    
    return () => {
      const index = this.binaryHandlers.indexOf(handler);
      if (index !== -1) {
        this.binaryHandlers.splice(index, 1);
      }
    };
  }
  
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  private handleBinaryData(data: ArrayBuffer | Blob): void {
    // Log the binary data for debugging
    console.log(`Received binary data: ${data instanceof ArrayBuffer ? 
      `ArrayBuffer of ${data.byteLength} bytes` : 
      `Blob of ${data.size} bytes`}`);

    // 1. Emit an event that components can listen for using EventEmitter
    this.emit('binary', data);
    
    // 2. Call all registered binary handlers
    this.binaryHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in binary data handler:', error);
      }
    });
  }
} 