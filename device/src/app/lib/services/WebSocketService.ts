import WebSocketManager from '../websocket/WebSocketManager';
import { MessageType } from '../websocket/MessageTypes';
import { StoryProtocol } from '../websocket/protocols/StoryProtocol';
import useGlobalState from '../../GlobalState';
import { DeviceState, StoryMetadata } from '../../GlobalState';

// Define an interface for story interaction payload
interface StoryInteractionPayload {
  interaction_id: string;
  interaction_type: string;
  text: string;
  timeout: number;
}

export default class WebSocketService {
  private static instance: WebSocketService;
  public readonly wsManager: WebSocketManager;
  public readonly storyProtocol: StoryProtocol;
  public readonly serverUrl: string;
  private readonly globalState: DeviceState;

  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.wsManager = new WebSocketManager(serverUrl);
    
    // Get protocol instances from the WebSocketManager
    this.storyProtocol = this.wsManager.getStoryProtocol();
    
    this.globalState = useGlobalState.getState();
    
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
    
    // Send handshake - retained for compatibility
    this.wsManager.send(MessageType.HANDSHAKE, {
      client: 'web-player',
      version: '1.0.0',
      capabilities: ['audio-streaming', 'voice-input', 'playback-control']
    });
    
    // Request initial story list
    this.storyProtocol.getStoryList({
      payload: { userId: "test-user" },
      type: MessageType.GET_STORY_LIST
    });
    
    // Update global state if it has a connection status property
    // For now, commenting out as it depends on the actual GlobalState interface
    // const globalState = useGlobalState.getState();
    // if (globalState.setIsConnected) {
    //   globalState.setIsConnected(true);
    // }
  }
  
  private handleDisconnected(): void {
    console.log('Disconnected from WebSocket server');
    
    // Update global state if it has a connection status property
    const globalState = useGlobalState.getState();
    globalState.setIsWebSocketConnected(false);
    
    // Update global state if it has a connection status property
    // For now, commenting out as it depends on the actual GlobalState interface
    // const globalState = useGlobalState.getState();
    // if (globalState.setIsConnected) {
    //   globalState.setIsConnected(false);
    // }
  }
  
  // Story protocol handlers
  
  private handleStoriesReceived(stories: StoryMetadata[]): void {
    console.log('Stories received:', stories);
    
    const globalState = useGlobalState.getState();
    // Convert Story objects to Track objects expected by GlobalState
    const tracks: StoryMetadata[] = stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      artist: story.artist,
      thumbnailUrl: story.thumbnailUrl,
      audioUrl: story.audioUrl,
      duration: story.duration,
      currentTime: 0
    }));
    
    globalState.setStories(tracks);
  }
  
  private handleStorySelected(story: StoryMetadata): void {
    console.log('Story selected:', story);
    
    const globalState = useGlobalState.getState();
    // Convert Story to CurrentTrack format expected by GlobalState
    globalState.setCurrentStory({
      id: story.id,
      title: story.title,
      description: story.description,
      artist: story.artist,
      thumbnailUrl: story.thumbnailUrl,
      audioUrl: story.audioUrl,
      duration: story.duration,
      currentTime: 0
    });
  }
  
  private handleStoryStarted(story: StoryMetadata): void {
    console.log('Story started:', story);
    
    const globalState = useGlobalState.getState();
    globalState.setIsPlaying(true);
  }
  
  private handleStoryPaused(story: StoryMetadata): void {
    console.log('Story paused:', story);
    
    const globalState = useGlobalState.getState();
    globalState.setIsPlaying(false);
  }
  
  private handleStoryResumed(story: StoryMetadata): void {
    console.log('Story resumed:', story);
    
    const globalState = useGlobalState.getState();
    globalState.setIsPlaying(true);
  }
  
  private handleStoryInteraction(payload: StoryInteractionPayload): void {
    console.log('Story interaction:', payload);
    
    const globalState = useGlobalState.getState();
    globalState.setIsPlaying(false);
    
    // If GlobalState has a way to handle interactions, use it
    // For now, just logging it
    console.log('Interaction received:', {
      id: payload.interaction_id,
      type: payload.interaction_type,
      text: payload.text,
      timeout: payload.timeout
    });
  }
  
  public connect(): void {
    this.wsManager.connect();
  }
  
  public disconnect(): void {
    this.wsManager.disconnect();
  }
} 