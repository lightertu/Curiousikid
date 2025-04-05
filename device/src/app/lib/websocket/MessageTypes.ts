/**
 * Message types for WebSocket communication.
 * These should match exactly with the backend message types.
 */

export interface Message {
  type: MessageType
  payload: any
}


export enum MessageType {
  // System messages
  SYSTEM = "SYSTEM",
  ERROR = "ERROR",
  HANDSHAKE = "HANDSHAKE",

  // Authentication messages
  AUTH_REQUEST = "AUTH_REQUEST",
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH_FAILURE = "AUTH_FAILURE",

  // Story messages
  GET_STORY_LIST = "GET_STORY_LIST",
  SEND_STORY_LIST = "SEND_STORY_LIST",
  STORY_SELECTED = "STORY_SELECTED",
  STORY_STARTED = "STORY_STARTED",
  STORY_PAUSED = "STORY_PAUSED",
  SET_STORY_PROGRESS = "SET_STORY_PROGRESS",
  SET_QUESTION_POINT = "SET_QUESTION_POINT",
  ACK_SET_QUESTION_POINT = "ACK_SET_QUESTION_POINT",
  CLEAR_QUESTION_POINT = "CLEAR_QUESTION_POINT",
  STORY_TRACK_END = "STORY_TRACK_END",

  // Microphone messages
  MIC_START = "MIC_START",
  MIC_STOP = "MIC_STOP",
  MIC_DATA = "MIC_DATA",
  SPEECH_RESULT = "SPEECH_RESULT"
}

/**
 * Standard message format for WebSocket communication
 */
export interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * Error message format
 */
export interface ErrorMessage {
  message: string;
  code: string;
  details?: any;
} 