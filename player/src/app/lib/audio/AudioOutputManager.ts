export interface AudioOutputManagerProps {
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
  playbackRate?: number; // Default is 1.0 (normal speed)
}

export default class AudioOutputManager {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private audioChunks: (Blob | ArrayBuffer)[] = [];
  private activeSource: AudioBufferSourceNode | null = null;
  private playbackRate: number;

  private onStart: () => Promise<void>;
  private onEnd: () => Promise<void>;

  constructor(props: AudioOutputManagerProps) {
    this.onStart = props.onStart;
    this.onEnd = props.onEnd;
    
    // Initialize playback rate (default to 1.0 if not provided)
    this.playbackRate = props.playbackRate || 1;
    console.log(`AudioOutputManager initialized with playback rate: ${this.playbackRate}`);

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass({
      latencyHint: 'interactive',
    });

    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  /**
   * Set the playback rate. Values less than 1.0 will slow down playback,
   * values greater than 1.0 will speed up playback.
   * @param rate The playback rate (0.5 = half speed, 2.0 = double speed)
   */
  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.1, rate); // Prevent extremely slow rates
    
    // Apply to currently playing source if exists
    if (this.activeSource) {
      this.activeSource.playbackRate.value = this.playbackRate;
    }
    
    console.log(`Playback rate set to ${this.playbackRate}`);
  }

  /**
   * Call `start()` to begin streaming. 
   * This will resume the AudioContext (if user gestures have allowed it) and run onStart().
   */
  public async start(): Promise<void> {
    // Resume context in case it's suspended (common in browsers).
    await this.audioContext.resume();
    await this.onStart();
    this.audioChunks = []; // Reset chunks
  }

  /**
   * Enqueue an audio chunk. It will be stored for later decoding when the stream ends.
   */
  public async enqueueAudio(data: Blob | ArrayBuffer): Promise<void> {
    // Just store the chunk for later processing
    this.audioChunks.push(data);
    console.log(`Chunk added to queue. Total chunks: ${this.audioChunks.length}`);
  }

  /**
   * Set volume (0 to 1 range).
   */
  public setVolume(level: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, level));
  }

  /**
   * Call when streaming is finished.
   */
  public async end(): Promise<void> {
    // Let the consumer know streaming is ended.
    await this.onEnd();
  }
  
  /**
   * Call when streaming is ended and all chunks are received.
   * This will combine all chunks, decode them, and play the audio.
   */
  public async setStreamEnded(): Promise<void> {
    const startTime = performance.now();
    console.log('Stream ended. Processing all chunks together...');
    
    // Check if we have any chunks to process
    if (this.audioChunks.length === 0) {
      console.log('No audio chunks to process');
      await this.onEnd();
      return;
    }
    
    try {
      // Combine all chunks and decode
      const combinedBuffer = await this.combineAndDecodeChunks();
      const decodeTime = performance.now();
      console.log(`Time to combine and decode: ${(decodeTime - startTime).toFixed(2)}ms`);
      
      if (combinedBuffer) {
        // Play the combined audio
        await this.playDecodedAudio(combinedBuffer);
        const totalTime = performance.now();
        console.log(`Total processing and playback time: ${(totalTime - startTime).toFixed(2)}ms`);
      } else {
        console.error('Failed to decode combined audio chunks');
        await this.onEnd();
      }
    } catch (error) {
      console.error('Error processing audio chunks:', error);
      await this.onEnd();
    }
  }
  
  /**
   * Combines all stored audio chunks and decodes them as a single audio buffer.
   */
  private async combineAndDecodeChunks(): Promise<AudioBuffer | null> {
    try {
      const combineStartTime = performance.now();
      console.log(`Combining ${this.audioChunks.length} chunks...`);
      
      // Convert all chunks to ArrayBuffers
      const buffers: ArrayBuffer[] = [];
      for (const chunk of this.audioChunks) {
        if (chunk instanceof Blob) {
          buffers.push(await chunk.arrayBuffer());
        } else {
          buffers.push(chunk);
        }
      }
      
      // Calculate total size
      const totalSize = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
      console.log(`Total combined size: ${totalSize} bytes`);
      
      // Create a new buffer to hold all the data
      const combinedBuffer = new Uint8Array(totalSize);
      
      // Copy all buffers into the combined buffer
      let offset = 0;
      for (const buffer of buffers) {
        combinedBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }
      
      const combineEndTime = performance.now();
      console.log(`Time to combine chunks: ${(combineEndTime - combineStartTime).toFixed(2)}ms`);
      
      // Decode the combined buffer
      console.log('Decoding combined audio data...');
      
      try {
        const decodeStartTime = performance.now();
        
        // Check if first chunk has Ogg header
        const firstBytes = new Uint8Array(combinedBuffer.buffer.slice(0, 4));
        const isOggHeader = 
          firstBytes[0] === 0x4F && // 'O'
          firstBytes[1] === 0x67 && // 'g'
          firstBytes[2] === 0x67 && // 'g'
          firstBytes[3] === 0x53;   // 'S'
        
        console.log(`Has valid Ogg header: ${isOggHeader ? 'Yes' : 'No'}`);
        
        // Create properly typed blob for better decoding
        const properBlob = new Blob([combinedBuffer], { 
          type: isOggHeader ? 'audio/ogg; codecs=vorbis' : 'audio/mpeg' 
        });
        
        // Get array buffer from the properly typed blob
        const typedArrayBuffer = await properBlob.arrayBuffer();
        
        // Decode the audio data
        const audioBuffer = await this.audioContext.decodeAudioData(typedArrayBuffer);
        
        const decodeEndTime = performance.now();
        console.log(`Time to decode audio: ${(decodeEndTime - decodeStartTime).toFixed(2)}ms`);
        console.log(`Successfully decoded audio: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
        
        return audioBuffer;
      } catch (decodeError) {
        console.error('Error decoding combined audio:', decodeError);
        return null;
      }
    } catch (error) {
      console.error('Error combining audio chunks:', error);
      return null;
    }
  }
  
  /**
   * Plays the decoded audio buffer and waits for it to complete before calling onEnd.
   */
  private playDecodedAudio(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise<void>((resolve) => {
      // Create a buffer source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Set playback rate
      source.playbackRate.value = this.playbackRate;
      
      // Connect to gain node
      source.connect(this.gainNode);
      
      // Track playback time
      const playbackStartTime = performance.now();
      
      // Set up onended callback
      source.onended = async () => {
        const playbackEndTime = performance.now();
        const playbackDuration = (playbackEndTime - playbackStartTime) / 1000; // convert to seconds
        console.log(`Audio playback completed in ${playbackDuration.toFixed(2)}s (audio duration: ${audioBuffer.duration.toFixed(2)}s at rate ${this.playbackRate})`);
        this.isPlaying = false;
        this.activeSource = null;
        await this.onEnd();
        resolve();
      };
      
      // Start playback
      this.isPlaying = true;
      this.activeSource = source;
      source.start(0);
      
      // Calculate expected duration based on playback rate
      const expectedDuration = audioBuffer.duration / this.playbackRate;
      console.log(`Started playing combined audio (${audioBuffer.duration.toFixed(2)}s) at rate ${this.playbackRate} (expected duration: ${expectedDuration.toFixed(2)}s)`);
    });
  }
  
  /**
   * Stop any currently playing audio.
   */
  public stop(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource = null;
      } catch (e) {
        // Ignore errors if already stopped
      }
    }
    this.isPlaying = false;
  }
}