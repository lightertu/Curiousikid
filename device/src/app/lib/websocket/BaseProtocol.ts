import { Protocol, WebSocketConnection } from './Protocol';

/**
 * Base implementation of the Protocol interface with common functionality.
 * Specific protocols should extend this class.
 */
export abstract class BaseProtocol implements Protocol {
  readonly name: string;
  protected connection: WebSocketConnection;
  private messageTypes: string[];
  
  /**
   * Create a new protocol with the given name
   * 
   * @param name Protocol name
   * @param connection WebSocket connection to use
   * @param messageTypes List of message types this protocol handles
   */
  constructor(name: string, connection: WebSocketConnection, messageTypes: string[]) {
    this.name = name;
    this.connection = connection;
    this.messageTypes = messageTypes;
  }
  
  /**
   * Get all message types this protocol handles
   */
  getHandledMessageTypes(): string[] {
    return this.messageTypes;
  }
  
  /**
   * Initialize the protocol
   */
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} protocol`);
  }
  
  /**
   * Clean up when shutting down
   */
  async shutdown(): Promise<void> {
    console.log(`Shutting down ${this.name} protocol`);
  }
  
  /**
   * Handle a message of a specific type.
   * The default implementation looks for a method named handle[MessageType].
   * 
   * @param messageType Message type
   * @param payload Message payload
   */
  async handleMessage(messageType: string, payload: Record<string, unknown>): Promise<boolean> {
    // Convert message type to a method name (e.g., STORY_LIST -> handleStoryList)
    const methodName = this.getHandlerMethodName(messageType);
    
    // Check if the method exists on this class
    if (typeof (this as any)[methodName] === 'function') {
      try {
        // Call the handler method
        await (this as any)[methodName](payload);
        return true;
      } catch (error) {
        console.error(`Error in ${this.name} protocol handling ${messageType}:`, error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Send a message through the WebSocket connection
   * 
   * @param type Message type
   * @param payload Message payload
   * @returns True if the message was sent, false otherwise
   */
  protected send(type: string, payload: Record<string, unknown>): boolean {
    return this.connection.send(type, payload);
  }
  
  /**
   * Send binary data through the WebSocket connection
   * 
   * @param data Binary data
   * @returns True if the data was sent, false otherwise
   */
  protected sendBinary(data: ArrayBuffer | Blob): boolean {
    return this.connection.sendBinary(data);
  }
  
  /**
   * Convert a message type to a handler method name
   * 
   * @param messageType Message type (e.g., STORY_LIST)
   * @returns Method name (e.g., handleStoryList)
   */
  private getHandlerMethodName(messageType: string): string {
    // Convert UPPER_SNAKE_CASE to camelCase
    const camelCase = messageType.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    
    // Add 'handle' prefix
    return `handle${camelCase.charAt(0).toUpperCase() + camelCase.slice(1)}`;
  }
} 