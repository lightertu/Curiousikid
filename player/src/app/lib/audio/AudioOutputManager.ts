export enum AudioSourceType {
  WEBSOCKET_STREAM = 'websocket_stream',
  FILE = 'file'
}

interface AudioOutputManagerProps {
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
}

export default class AudioOutputManager {
  private audioContext: AudioContext;
  private gainNode: GainNode | null = null;
  private adioElement: HTMLAudioElement | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isStreamingActive = false;
  private onStart: () => Promise<void>;
  private onEnd: () => Promise<void>;
  private nextStartTime = 0;
  private processingChunk = false;
  
  constructor(props: AudioOutputManagerProps) {
    this.onStart = props.onStart;
    this.onEnd = props.onEnd;
    
    // Initialize Web Audio API
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({
      latencyHint: 'interactive' // Optimize for lower latency
    });
    
    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }
  
  public async start(): Promise<void> {
    await this.onStart();
    this.isStreamingActive = true;
    this.nextStartTime = 0; // Reset timing
    
    // Pre-buffer a few chunks before starting playback
    const PREBUFFER_COUNT = 2; // Start with 2 chunks buffered
    
    while (this.isStreamingActive || this.audioQueue.length > 0) {
      const shouldStartPlaying = this.nextStartTime === 0 && this.audioQueue.length >= PREBUFFER_COUNT;
      
      if (shouldStartPlaying || (this.nextStartTime > 0 && !this.processingChunk)) {
        await this.playNextChunk();
      } else {
        // Use shorter poll time for better responsiveness
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    console.log('Streaming ended');
    await this.onEnd();
  }
  
  public async enqueueAudio(data: Blob | ArrayBuffer): Promise<void> {
    // Convert to ArrayBuffer if needed
    let arrayBuffer: ArrayBuffer;
    if (data instanceof Blob) {
      arrayBuffer = await data.arrayBuffer();
    } else {
      arrayBuffer = data;
    }
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioQueue.push(audioBuffer);
  }
  
  private async playNextChunk(): Promise<void> {
    if (this.processingChunk || this.audioQueue.length === 0) return;
    
    try {
      this.processingChunk = true;
      const audioBuffer = this.audioQueue.shift()!;
      
      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!);
      
      // Calculate start time for gapless playback
      const startTime = this.nextStartTime > 0 ? 
        this.nextStartTime : 
        this.audioContext.currentTime;
      
      // Schedule playback and update next start time
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      
      // Create a promise that resolves when this chunk finishes
      const completionPromise = new Promise<void>(resolve => {
        const timeUntilEnd = (audioBuffer.duration * 1000);
        setTimeout(() => resolve(), timeUntilEnd);
      });
      
      // Wait for this chunk to complete
      await completionPromise;
      
    } catch (error) {
      console.error('Error playing chunk:', error);
    } finally {
      this.processingChunk = false;
    }
  }
  
  public setVolume(level: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, level));
    }
  }
  
  public setStreamEnded(): void {
    this.isStreamingActive = false;
  }
} 