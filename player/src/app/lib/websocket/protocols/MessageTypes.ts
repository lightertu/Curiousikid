// Define message types for type-safety
export enum MessageType {
  // Connection Management
  HANDSHAKE = 'HANDSHAKE',
  HANDSHAKE_RESPONSE = 'HANDSHAKE_RESPONSE',
  CONNECTION_KEEP_ALIVE = 'CONNECTION_KEEP_ALIVE',
  
  // Playback Control
  PLAYBACK_CONTROL = 'PLAYBACK_CONTROL',
  PLAYBACK_STATE = 'PLAYBACK_STATE',
  UPDATE_TRACK_CONTEXT = 'UPDATE_TRACK_CONTEXT',
  
  // Voice Communication
  VOICE_STREAM_START = 'VOICE_STREAM_START',
  VOICE_STREAM_END = 'VOICE_STREAM_END',
  VOICE_DATA = 'VOICE_DATA',
  
  // Application State
  STATE_UPDATE = 'STATE_UPDATE',
  STATE_SYNC_REQUEST = 'STATE_SYNC_REQUEST',
  STATE_SYNC_RESPONSE = 'STATE_SYNC_RESPONSE',
  
  // Notifications/UI
  NOTIFICATION = 'NOTIFICATION',
  ERROR = 'ERROR',

  // AI Voice Streaming
  AI_VOICE_STREAMING_START = 'AI_VOICE_STREAMING_START',
  AI_VOICE_STREAMING_END = 'AI_VOICE_STREAMING_END',
}

// Protocol Payload Types
export interface HandshakePayload {
  client: string;
  version: string;
  capabilities: string[];
}

export interface HandshakeResponsePayload {
  sessionId: string;
  features: string[];
  serverTime: number;
}

export interface PlaybackControlPayload {
  action: 'play' | 'pause' | 'seek' | 'next' | 'previous';
  trackId?: string;
  position?: number;
}

export interface PlaybackStatePayload {
  isPlaying: boolean;
  currentTrack?: {
    id: string;
    position: number;
    duration: number;
  };
}

export interface UpdateTrackContextPayload {
  trackId: string;
  duration: number;
  currentTime: number;
}

export interface VoiceStreamStartPayload {
  format: string;
  sampleRate: number;
  channels: number;
}

export interface StateUpdatePayload {
  path: string;
  value: any;
}

export interface NotificationPayload {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  duration?: number;
}

export interface AIVoiceStreamingStartPayload {
  trackId: string;
  duration: number;
  currentTime: number;
}

export interface AIVoiceStreamingEndPayload {
  trackId: string;
  duration: number;
  currentTime: number;
}

// Combine all message types with their payloads
export type ProtocolMessage<T extends MessageType> = 
  T extends MessageType.HANDSHAKE ? { type: T; payload: HandshakePayload } :
  T extends MessageType.HANDSHAKE_RESPONSE ? { type: T; payload: HandshakeResponsePayload } :
  T extends MessageType.PLAYBACK_CONTROL ? { type: T; payload: PlaybackControlPayload } :
  T extends MessageType.PLAYBACK_STATE ? { type: T; payload: PlaybackStatePayload } :
  T extends MessageType.UPDATE_TRACK_CONTEXT ? { type: T; payload: UpdateTrackContextPayload } :
  T extends MessageType.AI_VOICE_STREAMING_START ? { type: T; payload: AIVoiceStreamingStartPayload } :
  T extends MessageType.AI_VOICE_STREAMING_END ? { type: T; payload: AIVoiceStreamingEndPayload } :
  T extends MessageType.VOICE_STREAM_START ? { type: T; payload: VoiceStreamStartPayload } :
  T extends MessageType.NOTIFICATION ? { type: T; payload: NotificationPayload } :
  { type: T; payload: any }; 

// Client message types (used when sending)
export type ClientMessage = 
  | ProtocolMessage<MessageType.HANDSHAKE>
  | ProtocolMessage<MessageType.PLAYBACK_CONTROL>
  | ProtocolMessage<MessageType.UPDATE_TRACK_CONTEXT>
  | ProtocolMessage<MessageType.AI_VOICE_STREAMING_START>
  | ProtocolMessage<MessageType.AI_VOICE_STREAMING_END>
  | ProtocolMessage<MessageType.VOICE_STREAM_START>;

// Server message types (used when receiving)
export type ServerMessage = 
  | ProtocolMessage<MessageType.HANDSHAKE_RESPONSE>
  | ProtocolMessage<MessageType.STATE_UPDATE>
  | ProtocolMessage<MessageType.PLAYBACK_STATE>
  | ProtocolMessage<MessageType.NOTIFICATION>
  | ProtocolMessage<MessageType.ERROR>;
