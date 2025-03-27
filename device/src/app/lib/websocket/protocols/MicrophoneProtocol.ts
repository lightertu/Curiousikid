import { BaseProtocol } from '../BaseProtocol';
import { MessageType } from '../MessageTypes';
import { WebSocketConnection } from '../Protocol';

export interface SpeechResultPayload {
  text: string;
  confidence: number;
  is_final: boolean;
}

/**
 * Protocol for handling microphone input and speech recognition
 */
export class MicrophoneProtocol extends BaseProtocol {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private stream: MediaStream | null = null;
  
  // Callbacks for external components
  private onSpeechResult?: (text: string, isFinal: boolean) => void;
  private onRecordingStarted?: () => void;
  private onRecordingStopped?: () => void;
  
  constructor(connection: WebSocketConnection) {
    super(
      'microphone',
      connection,
      [
        MessageType.MIC_START,
        MessageType.MIC_STOP,
        MessageType.SPEECH_RESULT
      ]
    );
  }
  
  /**
   * Shut down the protocol and release resources
   */
  async shutdown(): Promise<void> {
    await super.shutdown();
    this.stopRecording();
  }
  
  /**
   * Handle binary data (audio chunks)
   */
  async handleBinaryData(data: ArrayBuffer | Blob): Promise<boolean> {
    // For microphone protocol, we won't receive binary data from the server
    // This is more applicable for protocols that receive audio/video from the server
    return false;
  }
  
  /**
   * Start recording from the microphone
   */
  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      return true;
    }
    
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          // Send the audio chunk to the server
          this.sendBinary(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(100); // Capture in 100ms chunks
      this.isRecording = true;
      
      // Notify the server that recording has started
      this.send(MessageType.MIC_START, {});
      
      // Trigger callback
      if (this.onRecordingStarted) {
        this.onRecordingStarted();
      }
      
      return true;
    } catch (error) {
      console.error('Error starting microphone recording:', error);
      return false;
    }
  }
  
  /**
   * Stop recording from the microphone
   */
  stopRecording(): boolean {
    if (!this.isRecording || !this.mediaRecorder) {
      return false;
    }
    
    try {
      // Stop the media recorder
      this.mediaRecorder.stop();
      
      // Stop all audio tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      this.isRecording = false;
      
      // Notify the server that recording has stopped
      this.send(MessageType.MIC_STOP, {});
      
      // Trigger callback
      if (this.onRecordingStopped) {
        this.onRecordingStopped();
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping microphone recording:', error);
      return false;
    }
  }
  
  /**
   * Toggle recording state
   */
  toggleRecording(): Promise<boolean> {
    return this.isRecording ? this.stopRecording() : this.startRecording();
  }
  
  /**
   * Handle speech recognition results from the server
   */
  protected async handleSpeechResult(payload: SpeechResultPayload): Promise<void> {
    const { text, is_final } = payload;
    
    if (this.onSpeechResult) {
      this.onSpeechResult(text, is_final);
    }
    
    // If this is a final result, stop recording
    if (is_final && this.isRecording) {
      this.stopRecording();
    }
  }
  
  // Setter methods for callbacks
  
  setOnSpeechResult(callback: (text: string, isFinal: boolean) => void): void {
    this.onSpeechResult = callback;
  }
  
  setOnRecordingStarted(callback: () => void): void {
    this.onRecordingStarted = callback;
  }
  
  setOnRecordingStopped(callback: () => void): void {
    this.onRecordingStopped = callback;
  }
  
  // Getter for state
  
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
} 