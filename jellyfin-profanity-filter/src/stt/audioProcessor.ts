/**
 * Audio Processor - Handles audio stream capture and buffering for STT
 * Integrates with Jellyfin's live transcoding hook to capture audio chunks
 */

import { logger } from '../utils/logger';
import { configLoader, PluginConfig } from '../utils/config';

export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
  sampleRate: number;
  channels: number;
}

export interface AudioBuffer {
  chunks: AudioChunk[];
  totalDurationMs: number;
  sampleRate: number;
  channels: number;
}

export interface TranscodeHookRequest {
  mediaSourceId: string;
  itemId: string;
  audioStreamIndex: number;
  transcodingUrl: string;
  startTime: number;
  currentTime: number;
}

export class AudioProcessor {
  private isInitialized: boolean = false;
  private audioBuffer: AudioChunk[] = [];
  private bufferSizeMs: number;
  private sampleRate: number;
  private channels: number;
  private chunkSizeBytes: number;
  private activeSession: TranscodeHookRequest | null = null;

  constructor() {
    this.bufferSizeMs = configLoader.get('audioBufferSizeMs');
    this.sampleRate = 48000; // Standard audio sample rate
    this.channels = 2; // Stereo
    this.chunkSizeBytes = Math.floor(
      (this.bufferSizeMs / 1000) * this.sampleRate * this.channels * 4 // 4 bytes per float32
    );
  }

  /**
   * Initialize the audio processor
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const config = configLoader.get('audioBufferSizeMs');
    this.bufferSizeMs = config;
    this.chunkSizeBytes = Math.floor(
      (this.bufferSizeMs / 1000) * this.sampleRate * this.channels * 4
    );

    this.isInitialized = true;
    logger.info('Audio processor initialized', { bufferSizeMs: this.bufferSizeMs });
  }

  /**
   * Start a new audio capture session
   */
  public startSession(request: TranscodeHookRequest): void {
    this.activeSession = request;
    this.audioBuffer = [];
    logger.info('Audio capture session started', { mediaSourceId: request.mediaSourceId });
  }

  /**
   * End the current audio capture session
   */
  public endSession(): AudioBuffer | null {
    if (!this.activeSession) {
      return null;
    }

    const buffer: AudioBuffer = {
      chunks: [...this.audioBuffer],
      totalDurationMs: this.bufferSizeMs,
      sampleRate: this.sampleRate,
      channels: this.channels
    };

    this.activeSession = null;
    this.audioBuffer = [];
    
    logger.info('Audio capture session ended', { chunkCount: buffer.chunks.length });
    return buffer;
  }

  /**
   * Add audio data to the buffer
   */
  public addChunk(chunk: AudioChunk): void {
    if (!this.isInitialized) {
      throw new Error('AudioProcessor not initialized. Call initialize() first.');
    }

    this.audioBuffer.push(chunk);
    
    // Check if buffer is full and process it
    if (this.audioBuffer.length >= 10) { // Process every 10 chunks (~100ms at 48kHz)
      const completedBuffer = this.flushBuffer();
      if (completedBuffer && this.activeSession) {
        logger.debug('Audio buffer flushed for processing', { 
          chunkCount: completedBuffer.chunks.length,
          durationMs: completedBuffer.totalDurationMs 
        });
      }
    }
  }

  /**
   * Flush the current audio buffer and return it
   */
  public flushBuffer(): AudioBuffer | null {
    if (this.audioBuffer.length === 0) {
      return null;
    }

    const buffer: AudioBuffer = {
      chunks: [...this.audioBuffer],
      totalDurationMs: this.bufferSizeMs,
      sampleRate: this.sampleRate,
      channels: this.channels
    };

    this.audioBuffer = [];
    return buffer;
  }

  /**
   * Get the current audio buffer size in milliseconds
   */
  public getBufferDurationMs(): number {
    if (this.audioBuffer.length === 0) {
      return 0;
    }
    
    // Estimate duration based on chunk count
    const estimatedChunks = Math.floor(this.audioBuffer.length / 10);
    return estimatedChunks * this.bufferSizeMs;
  }

  /**
   * Clear the audio buffer
   */
  public clearBuffer(): void {
    this.audioBuffer = [];
    logger.debug('Audio buffer cleared');
  }

  /**
   * Get active session info
   */
  public getSessionInfo(): TranscodeHookRequest | null {
    return this.activeSession;
  }

  /**
   * Reset the audio processor
   */
  public async reset(): Promise<void> {
    this.isInitialized = false;
    this.audioBuffer = [];
    this.activeSession = null;
    logger.info('Audio processor reset');
  }
}

export const audioProcessor = new AudioProcessor();
