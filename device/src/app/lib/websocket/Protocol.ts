/**
 * Handler type for processing WebSocket messages
 */
export type MessageHandler = (payload: Record<string, unknown>) => void | Promise<void>;

/**
 * Base Protocol interface for handling specific message types
 */
export interface Protocol {
  /**
   * Unique name of the protocol
   */
  readonly name: string;
  
  /**
   * Get the list of message types this protocol handles
   */
  getHandledMessageTypes(): string[];
  
  /**
   * Initialize the protocol
   */
  initialize(): void | Promise<void>;
  
  /**
   * Clean up resources when shutting down
   */
  shutdown(): void | Promise<void>;
  
  /**
   * Handle a message of a specific type
   * 
   * @param messageType The type of message
   * @param payload The message payload
   * @returns True if the message was handled, false otherwise
   */
  handleMessage(message: {
    messageType: string, 
    payload: Record<string, unknown>}): boolean | Promise<boolean>;
  
  /**
   * Optional method to handle binary data
   * 
   * @param data Binary data from WebSocket
   * @returns True if the data was handled, false otherwise
   */
  handleBinaryData?(data: ArrayBuffer | Blob): boolean | Promise<boolean>;
}

/**
 * WebSocket connection interface needed by protocols
 */
export interface WebSocketConnection {
  /**
   * Send a message to the server
   */
  send(type: string, payload: Record<string, unknown>): boolean;
  
  /**
   * Send binary data to the server
   */
  sendBinary(data: ArrayBuffer | Blob): boolean;
  
  /**
   * Check if the connection is active
   */
  isConnected(): boolean;
}

/**
 * Registry that manages protocols and routes messages to appropriate handlers
 */
export class ProtocolRegistry {
  private protocols: Protocol[] = [];
  private messageHandlers: Map<string, Protocol[]> = new Map();
  private connection: WebSocketConnection;
  
  /**
   * Create a new protocol registry
   * 
   * @param connection The WebSocket connection to use
   */
  constructor(connection: WebSocketConnection) {
    this.connection = connection;
  }
  
  /**
   * Register a protocol with the registry
   * 
   * @param protocol The protocol to register
   */
  registerProtocol(protocol: Protocol): void {
    // Add to protocols list
    this.protocols.push(protocol);
    
    // Register message handlers
    for (const messageType of protocol.getHandledMessageTypes()) {
      if (!this.messageHandlers.has(messageType)) {
        this.messageHandlers.set(messageType, []);
      }
      
      this.messageHandlers.get(messageType)?.push(protocol);
    }
    
    console.log(`Registered protocol: ${protocol.name}`);
  }
  
  /**
   * Initialize all registered protocols
   */
  async initialize(): Promise<void> {
    console.log("Initializing all protocols");
    
    for (const protocol of this.protocols) {
      try {
        await protocol.initialize();
      } catch (error) {
        console.error(`Error initializing protocol ${protocol.name}:`, error);
      }
    }
  }
  
  /**
   * Shutdown all registered protocols
   */
  async shutdown(): Promise<void> {
    console.log("Shutting down all protocols");
    
    for (const protocol of this.protocols) {
      try {
        await protocol.shutdown();
      } catch (error) {
        console.error(`Error shutting down protocol ${protocol.name}:`, error);
      }
    }
  }
  
  /**
   * Handle a message by routing it to the appropriate protocol(s)
   * 
   * @param messageType The message type
   * @param payload The message payload
   * @returns True if at least one protocol handled the message, false otherwise
   */
  async handleMessage(messageType: string, payload: Record<string, unknown>): Promise<boolean> {
    // Find protocols that handle this message type
    const handlers = this.messageHandlers.get(messageType) || [];
    
    if (handlers.length === 0) {
      console.warn(`No handlers found for message type: ${messageType}`);
      return false;
    }
    
    // Route the message to each handler
    let handled = false;
    
    for (const protocol of handlers) {
      try {
        const success = await protocol.handleMessage({messageType, payload});
        handled = handled || success;
      } catch (error) {
        console.error(`Error in protocol ${protocol.name} handling message ${messageType}:`, error);
      }
    }
    
    return handled;
  }
  
  /**
   * Handle binary data by routing it to protocols that support it
   * 
   * @param data Binary data
   * @returns True if at least one protocol handled the data, false otherwise
   */
  async handleBinaryData(data: ArrayBuffer | Blob): Promise<boolean> {
    let handled = false;
    
    for (const protocol of this.protocols) {
      if (protocol.handleBinaryData) {
        try {
          const success = await protocol.handleBinaryData(data);
          handled = handled || success;
        } catch (error) {
          console.error(`Error in protocol ${protocol.name} handling binary data:`, error);
        }
      }
    }
    
    return handled;
  }
  
  /**
   * Get the connection used by this registry
   */
  getConnection(): WebSocketConnection {
    return this.connection;
  }
} 