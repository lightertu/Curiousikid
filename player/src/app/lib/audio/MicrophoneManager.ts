export default class MicrophoneManager {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Callbacks
  private onAudioDataCallback: ((data: ArrayBuffer) => void) | null = null;
  private onVolumeCallback: ((volume: number) => void) | null = null;
  
  // Configuration
  private bufferSize = 4096;
  private sampleRate = 44100;
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext(): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create analyser for volume detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    } catch (error) {
      console.error('Audio Context could not be created:', error);
    }
  }
  
  public async start(): Promise<boolean> {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (!this.audioContext) {
      return false;
    }
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Connect to analyser
      if (this.analyser) {
        this.source.connect(this.analyser);
      }
      
      // Create processor node for audio data
      this.processor = this.audioContext.createScriptProcessor(
        this.bufferSize, 
        1, // mono input
        1  // mono output
      );
      
      this.processor.onaudioprocess = this.handleAudioProcess.bind(this);
      
      // Connect processor
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Start volume metering
      if (this.onVolumeCallback) {
        this.startVolumeMetering();
      }
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }
  
  private handleAudioProcess(event: AudioProcessingEvent): void {
    if (!this.onAudioDataCallback) return;
    
    const inputBuffer = event.inputBuffer;
    const audioData = inputBuffer.getChannelData(0);
    
    // Convert to ArrayBuffer for transmission
    const dataBuffer = new Float32Array(audioData);
    this.onAudioDataCallback(dataBuffer.buffer);
  }
  
  private startVolumeMetering(): void {
    if (!this.analyser || !this.onVolumeCallback) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const updateVolume = () => {
      if (!this.analyser || !this.onVolumeCallback) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate volume (simple average)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const volume = average / 256; // Normalize to 0-1
      
      // Call the callback
      this.onVolumeCallback(volume);
      
      // Schedule next update
      requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  }
  
  public stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
  
  public onAudioData(callback: (data: ArrayBuffer) => void): void {
    this.onAudioDataCallback = callback;
  }
  
  public onVolume(callback: (volume: number) => void): void {
    this.onVolumeCallback = callback;
    
    if (this.analyser) {
      this.startVolumeMetering();
    }
  }
  
  public isActive(): boolean {
    return this.stream !== null && this.source !== null;
  }
} 