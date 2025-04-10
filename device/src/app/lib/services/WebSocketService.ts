import WebSocketManager from '../websocket/WebSocketManager';
import { MessageType } from '../websocket/MessageTypes';
import { StoryProtocol } from '../websocket/protocols/StoryProtocol';
import { ChatCharacterProtocol } from '../websocket/protocols/ChatCharacterProtocol';
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType } from '@/app/DeviceStateMachine';

export default class WebSocketService {
  private static instance: WebSocketService;
  public readonly wsManager: WebSocketManager;
  public readonly storyProtocol: StoryProtocol;
  public readonly chatCharacterProtocol: ChatCharacterProtocol;
  public readonly serverUrl: string;

  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.wsManager = new WebSocketManager(serverUrl);

    // Get protocol instances from the WebSocketManager
    this.storyProtocol = this.wsManager.getStoryProtocol();
    this.chatCharacterProtocol = this.wsManager.getChatCharacterProtocol();

    this.setupEventHandlers();
  }

  public static getInstance(serverUrl?: string): WebSocketService {
    if (!WebSocketService.instance) {
      if (!serverUrl) {
        throw new Error('Server URL is required for initial instantiation');
      }
      WebSocketService.instance = new WebSocketService(serverUrl);
    }

    return WebSocketService.instance;
  }

  private setupEventHandlers(): void {
    // Initialize WebSocketManager
    this.wsManager.initialize().catch(error => {
      console.error("Error initializing WebSocketManager:", error);
    });

    // Handle connection events using EventEmitter (still available in new architecture)
    this.wsManager.on('connected', this.handleConnected.bind(this));
    this.wsManager.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleConnected(): void {
    console.log('Connected to WebSocket server');
    const { userId } = DEVICE_STATE_MACHINE_ACTOR.getSnapshot().context;

    // Send handshake - retained for compatibility
    this.wsManager.send(MessageType.HANDSHAKE, {
      client: 'web-player',
      version: '1.0.0',
      capabilities: ['audio-streaming', 'voice-input', 'playback-control']
    });
    
    // Request initial story list
    this.storyProtocol.getStoryList({
      payload: { userId: userId },
      type: MessageType.GET_STORY_LIST
    });

    // Request initial story list
    this.chatCharacterProtocol.getChatCharacterList({
      payload: { userId: userId },
      type: MessageType.GET_CHAT_CHARACTER_LIST
    });

  }

  private handleDisconnected(): void {
    console.log('Disconnected from WebSocket server');
    DEVICE_STATE_MACHINE_ACTOR.send({
      type: DeviceEventType.SET_IS_WEBSOCKET_CONNECTED,
      payload: {
        isWebSocketConnected: false
      }
    });
  }

  public connect(): void {
    this.wsManager.connect();
  }

  public disconnect(): void {
    this.wsManager.disconnect();
  }
} 