/**
 * Model Optimization Module
 * Strategies for optimizing real-time inference performance
 */

import { logger } from '../utils/logger';

export interface OptimizationConfig {
  batchSize: number;
  maxInferenceTime: number; // ms
  fallbackThreshold: number; // seconds of silence before switching to binary classifier
}

export class ModelOptimizer {
  private config: OptimizationConfig;
  private inferenceStartTime: number = 0;
  private lastProfanityDetected: number = 0;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      batchSize: 4,
      maxInferenceTime: 100, // 100ms per batch
      fallbackThreshold: 2.0, // 2 seconds
      ...config
    };
  }

  /**
   * Check if we should skip inference based on timing constraints
   */
  private shouldSkipInference(currentTime: number): boolean {
    const elapsed = currentTime - this.inferenceStartTime;
    return elapsed > this.config.maxInferenceTime;
  }

  /**
   * Batch multiple text segments for efficient inference
   */
  private batchSegments(segments: string[]): string[] {
    const batches: string[] = [];
    let currentBatch: string[] = [];
    let currentLength = 0;

    for (const segment of segments) {
      const segmentLength = segment.length;
      
      if (currentLength + segmentLength > 100) {
        // Batch is getting too large, flush it
        if (currentBatch.length > 0) {
          batches.push(currentBatch.join(' '));
          currentBatch = [];
          currentLength = 0;
        }
      }

      currentBatch.push(segment);
      currentLength += segmentLength;
    }

    // Flush remaining batch
    if (currentBatch.length > 0) {
      batches.push(currentBatch.join(' '));
    }

    return batches;
  }

  /**
   * Optimize inference by batching and timing constraints
   */
  async optimizeInference(
    text: string,
    classifier: any,
    config?: Partial<OptimizationConfig>
  ): Promise<{ isProfane: boolean; confidence: number }> {
    const startTime = Date.now();
    
    // Update config if provided
    this.config = { ...this.config, ...config };

    // Check timing constraints
    if (this.shouldSkipInference(startTime)) {
      logger.debug('Skipping inference due to timing constraints');
      return { isProfane: false, confidence: 0 };
    }

    try {
      const result = await classifier.classify(text);
      
      this.lastProfanityDetected = Date.now();
      this.inferenceStartTime = Date.now(); // Reset timer on detection
      
      return result;
    } catch (error: any) {
      logger.error('Inference failed, falling back to binary classifier', error.message || error);
      return this.fallbackToBinary(text);
    }
  }

  /**
   * Fallback to binary classifier when LLM is unavailable or too slow
   */
  private fallbackToBinary(text: string): { isProfane: boolean; confidence: number } {
    const profanityPatterns = [
      /\bf#(c|u|s|t|k)\b/i, // F#ck variations
      /\bg#(d|od)\b/i,       // G#d variations
      /\bd##(n|amn)\b/i,     // D##n variations
      /\bs#(t|ht)\b/i,       // S#t variations
      /\bw@(s|h)\b/i,        // W@ts/W@sh variations
    ];

    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        return { isProfane: true, confidence: 0.95 };
      }
    }

    return { isProfane: false, confidence: 0 };
  }

  /**
   * Get current optimization metrics
   */
  getMetrics(): {
    inferenceCount: number;
    lastInferenceTime: number;
    avgInferenceTime: number;
  } {
    const now = Date.now();
    const elapsed = now - this.lastProfanityDetected;
    
    return {
      inferenceCount: Math.floor((now - this.inferenceStartTime) / 100),
      lastInferenceTime: elapsed,
      avgInferenceTime: elapsed
    };
  }

  /**
   * Reset optimization state (useful for re-initialization)
   */
  reset(): void {
    this.inferenceStartTime = Date.now();
    this.lastProfanityDetected = Date.now();
  }
}
