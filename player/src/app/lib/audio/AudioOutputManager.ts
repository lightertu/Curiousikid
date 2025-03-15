export enum AudioSourceType {
  WEBSOCKET_STREAM = 'websocket_stream',
  FILE = 'file'
}

interface AudioChunk {
  data: Blob | ArrayBuffer;
  timestamp: number;
}

export default class AudioOutputManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioQueue: AudioChunk[] = [];
  private isPlaying = false;
  private sourceType: AudioSourceType = AudioSourceType.FILE;
  
  // Callbacks
  private onPlayStart: (() => void) | null = null;
  private onPlayEnd: (() => void) | null = null;
  
  constructor() {
    this.initAudioContext();
    this.createAudioElement();
  }
  
  private initAudioContext(): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }
  
  private createAudioElement(): void {
    this.audioElement = new Audio();
    this.audioElement.autoplay = true;
    
    this.audioElement.addEventListener('ended', this.handleAudioEnded.bind(this));
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayStart) this.onPlayStart();
    });
    
    if (this.audioContext) {
      const source = this.audioContext.createMediaElementSource(this.audioElement);
      source.connect(this.gainNode!);
    }
  }
  
  public enqueueAudio(data: Blob | ArrayBuffer): void {
    this.audioQueue.push({
      data,
      timestamp: Date.now()
    });
    
    if (!this.isPlaying && this.sourceType === AudioSourceType.WEBSOCKET_STREAM) {
      this.playNextChunk();
    }
  }
  
  private playNextChunk(): void {
    if (this.audioQueue.length === 0 || !this.audioElement) return;
    
    const chunk = this.audioQueue.shift()!;
    const objectUrl = URL.createObjectURL(
      chunk.data instanceof Blob ? chunk.data : new Blob([chunk.data], { type: 'audio/mpeg' })
    );
    
    this.audioElement.src = objectUrl;
    this.audioElement.play().catch(err => {
      console.error('Error playing audio:', err);
      
      // Try to autoplay by user interaction workaround
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
    });
    
    // Clean up the URL object after playback starts
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
  }
  
  private handleAudioEnded(): void {
    this.isPlaying = false;
    
    if (this.sourceType === AudioSourceType.WEBSOCKET_STREAM) {
      if (this.audioQueue.length > 0) {
        this.playNextChunk();
      } else if (this.onPlayEnd) {
        this.onPlayEnd();
      }
    } else if (this.onPlayEnd) {
      this.onPlayEnd();
    }
  }
  
  public playFile(url: string): void {
    if (!this.audioElement) return;
    
    this.sourceType = AudioSourceType.FILE;
    this.audioQueue = [];
    this.audioElement.src = url;
    this.audioElement.play().catch(console.error);
  }
  
  public switchToStreamMode(): void {
    this.sourceType = AudioSourceType.WEBSOCKET_STREAM;
    this.audioQueue = [];
  }
  
  public setVolume(level: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, level));
    }
  }
  
  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
    
    this.audioQueue = [];
  }
  
  public isActive(): boolean {
    return this.isPlaying;
  }
  
  public onStart(callback: () => void): void {
    this.onPlayStart = callback;
  }
  
  public onEnd(callback: () => void): void {
    this.onPlayEnd = callback;
  }
} 