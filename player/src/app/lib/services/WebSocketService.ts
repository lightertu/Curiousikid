import WebSocketManager from '../websocket/WebSocketManager';
import { 
  MessageType, 
  HandshakeResponsePayload, 
  PlaybackControlPayload,
  StateUpdatePayload,
  NotificationPayload,
  UpdateTrackContextPayload
} from '../websocket/protocols/MessageTypes';
import MicrophoneManager from '../audio/MicrophoneManager';
import AudioOutputManager from '../audio/AudioOutputManager';
import useGlobalState from '../../GlobalState';

export default class WebSocketService {
  private static instance: WebSocketService;
  private wsManager: WebSocketManager;
  private micManager: MicrophoneManager;
  private audioManager: AudioOutputManager;
  private serverUrl: string;
  private isVoiceStreaming = false;
  
  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.wsManager = new WebSocketManager(serverUrl);
    this.micManager = new MicrophoneManager();
    this.audioManager = new AudioOutputManager();
    
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
    // Handle connection events
    this.wsManager.on('connected', this.handleConnected.bind(this));
    this.wsManager.on('disconnected', this.handleDisconnected.bind(this));
    
    // Handle protocol messages
    this.wsManager.onMessage(MessageType.HANDSHAKE_RESPONSE, this.handleHandshakeResponse.bind(this));
    this.wsManager.onMessage(MessageType.PLAYBACK_CONTROL, this.handlePlaybackControl.bind(this));
    this.wsManager.onMessage(MessageType.STATE_UPDATE, this.handleStateUpdate.bind(this));
    this.wsManager.onMessage(MessageType.NOTIFICATION, this.handleNotification.bind(this));
    
    // Handle binary audio data
    this.wsManager.onBinary(this.handleIncomingAudio.bind(this));
    
    // Set up audio output callbacks
    this.audioManager.onStart(() => {
      const globalState = useGlobalState.getState();
      globalState.setIsAIVoiceStreaming(true);
    });
    
    this.audioManager.onEnd(() => {
      const globalState = useGlobalState.getState();
      globalState.setIsAIVoiceStreaming(false);
    });
    
    // Set up microphone audio data handler
    this.micManager.onAudioData(this.handleOutgoingAudio.bind(this));
  }
  
  private handleConnected(): void {
    console.log('Connected to WebSocket server');
    
    // Send handshake
    this.wsManager.send(MessageType.HANDSHAKE, {
      client: 'web-player',
      version: '1.0.0',
      capabilities: ['audio-streaming', 'voice-input', 'playback-control']
    });
    
    // Sync initial state
    this.wsManager.send(MessageType.STATE_SYNC_REQUEST, {
      clientTime: Date.now()
    });
  }
  
  private handleDisconnected(): void {
    console.log('Disconnected from WebSocket server');
    // Clean up voice streaming if active
    if (this.isVoiceStreaming) {
      this.stopVoiceStreaming();
    }
  }
  
  private handleHandshakeResponse(payload: HandshakeResponsePayload): void {
    console.log('Handshake response received:', payload);
    
    // Store session ID if needed for future requests
    const sessionId = payload.sessionId;
    console.log(`Session established: ${sessionId}`);
    
    // Check supported features from server
    if (payload.features.includes('voice-streaming')) {
      console.log('Server supports voice streaming');
    }
    
    // Calculate time offset with server if needed
    const serverTime = payload.serverTime;
    const clientTime = Date.now();
    const offset = serverTime - clientTime;
    console.log(`Time offset with server: ${offset}ms`);
  }
  
  private handlePlaybackControl(payload: PlaybackControlPayload): void {
    const globalState = useGlobalState.getState();
    const { action, trackId, position } = payload;
    
    switch (action) {
      case 'play':
        globalState.setIsPlaying(true);
        break;
      case 'pause':
        globalState.setIsPlaying(false);
        break;
      case 'seek':
        if (position !== undefined) {
          const currentTrack = { ...globalState.currentTrack, currentTime: position };
          globalState.setCurrentTrack(currentTrack);
        }
        break;
      case 'next':
      case 'previous':
        // Handle track switching
        if (trackId) {
          const track = globalState.tracks.find(t => t.id === trackId);
          if (track) {
            const currentTrack = { 
              ...track, 
              currentTime: 0,
              duration: globalState.currentTrack.duration
            };
            globalState.setCurrentTrack(currentTrack);
            globalState.setIsPlaying(true);
          }
        }
        break;
    }
  }
  
  private handleStateUpdate(payload: StateUpdatePayload): void {
    const globalState = useGlobalState.getState();
    const { path, value } = payload;
    
    // Handle different state update paths
    switch (path) {
      case 'isPlaying':
        globalState.setIsPlaying(value);
        break;
      case 'currentTrack':
        globalState.setCurrentTrack(value);
        break;
      case 'tracks':
        globalState.setTracks(value);
        break;
      // Add more state paths as needed
    }
  }
  
  private handleNotification(payload: NotificationPayload): void {
    console.log(`Notification: ${payload.type} - ${payload.message}`);
    // Here you could integrate with a notification system
  }
  
  private handleIncomingAudio(data: ArrayBuffer | Blob): void {
    // Process and queue incoming audio for playback
    this.audioManager.switchToStreamMode();
    this.audioManager.enqueueAudio(data);
  }
  
  private handleOutgoingAudio(data: ArrayBuffer): void {
    // Send microphone audio data to server
    if (this.isVoiceStreaming) {
      this.wsManager.sendBinary(data);
    }
  }
  
  public connect(): void {
    this.wsManager.connect();
  }
  
  public disconnect(): void {
    this.wsManager.disconnect();
    this.stopVoiceStreaming();
  }
  
  public startVoiceStreaming(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      if (this.isVoiceStreaming) {
        resolve(true);
        return;
      }
      
      const started = await this.micManager.start();
      if (!started) {
        resolve(false);
        return;
      }
      
      this.isVoiceStreaming = true;
      
      // Notify server that we're starting voice stream
      this.wsManager.send(MessageType.VOICE_STREAM_START, {
        format: 'float32',
        sampleRate: 44100,
        channels: 1
      });
      
      const globalState = useGlobalState.getState();
      globalState.setIsChatActive(true);
      
      resolve(true);
    });
  }
  
  public stopVoiceStreaming(): void {
    if (!this.isVoiceStreaming) return;
    
    this.micManager.stop();
    this.isVoiceStreaming = false;
    
    // Notify server that we're ending voice stream
    this.wsManager.send(MessageType.VOICE_STREAM_END, {
      timestamp: Date.now()
    });
    
    const globalState = useGlobalState.getState();
    globalState.setIsChatActive(false);
  }
  
  public isConnected(): boolean {
    return this.wsManager.isConnected();
  }
  
  public sendPlaybackState(): void {
    const globalState = useGlobalState.getState();
    const { isPlaying, currentTrack } = globalState;
    
    if (!currentTrack) return;
    
    this.wsManager.send(MessageType.PLAYBACK_STATE, {
      isPlaying,
      currentTrack: {
        id: currentTrack.id,
        position: currentTrack.currentTime || 0,
        duration: currentTrack.duration || 0
      }
    });
  }
  
  public sendTrackContextUpdate(trackId: string, duration: number, currentTime: number): void {
    if (!this.wsManager.isConnected()) {
      console.warn('Cannot send track context update: WebSocket not connected');
      return;
    }
    
    this.wsManager.send(MessageType.UPDATE_TRACK_CONTEXT, {
      trackId,
      duration,
      currentTime
    });
    
    console.log('Sent track context update:', { trackId, duration, currentTime });
  }
} 