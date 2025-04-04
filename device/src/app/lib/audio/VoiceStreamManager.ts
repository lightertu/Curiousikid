import WebSocketManager from '../websocket/WebSocketManager';

export class VoiceStreamManager {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocketManager;
  private chunkSize = 16384; // 16KB chunks

  constructor(websocket: WebSocketManager) {
    this.websocket = websocket;
  }

  async startStreaming() {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,          // Mono audio
          sampleRate: 44100,        // Standard sample rate
          echoCancellation: true,   // Reduce echo
          noiseSuppression: true    // Reduce background noise
        }
      });

      // Create MediaRecorder with appropriate settings
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Handle data chunks as they come in
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send the audio chunk to the server
          this.websocket.sendBinary(event.data);
        }
      };

      // Notify server that we're starting voice stream
      this.websocket.send('VOICE_STREAM_START', {
        format: 'audio/webm;codecs=opus',
        sampleRate: 44100,
        channels: 1
      });

      // Start recording in chunks
      this.mediaRecorder.start(100); // Create chunks every 100ms
    } catch (error) {
      console.error('Failed to start voice streaming:', error);
      throw error;
    }
  }

  stopStreaming() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Notify server that we're stopping voice stream
    this.websocket.send('VOICE_STREAM_END', {});
  }
} 