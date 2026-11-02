/**
 * Profanity Classifier using Phi-2 LLM
 * Provides text classification for profanity detection with optimization
 */

import { Phi2Service, Phi2Config } from './phi2Service';
import { ModelOptimizer, OptimizationConfig } from '../optimization/modelOptimization';

export interface ClassificationResult {
  isProfane: boolean;
  confidence: number;
  matchedWords?: string[];
}

export interface ClassifierConfig extends Phi2Config {
  modelType: 'phi-2' | 'tinyllama';
  fallbackToBinary: boolean;
}

export class ProfanityClassifier {
  private phi2Service: Phi2Service | null = null;
  private config: ClassifierConfig;
  private isInitialized: boolean = false;
  private optimizer: ModelOptimizer | null = null;

  constructor(config: ClassifierConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.debug('Profanity classifier already initialized');
      return;
    }

    const modelConfig: Phi2Config = {
      modelPath: this.config.modelPath,
      contextSize: this.config.contextSize || 4096,
      nBatch: this.config.nBatch || 512,
      nThreads: this.config.nThreads || 4 // Default to 4 threads
    };

    console.info(`Initializing ${this.config.modelType} from: ${modelConfig.modelPath}`);
    
    try {
      const service = new Phi2Service(modelConfig);
      await service.initialize();
      this.phi2Service = service;
      this.isInitialized = true;
      
      // Initialize optimizer with default config
      this.optimizer = new ModelOptimizer({
        batchSize: 4,
        maxInferenceTime: 100,
        fallbackThreshold: 2.0
      });
      
      console.info(`${this.config.modelType} classifier initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize ${this.config.modelType}: ${error}`);
      throw error;
    }
  }

  async classify(text: string): Promise<ClassificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.phi2Service) {
      throw new Error('Classifier not initialized');
    }

    return this.phi2Service.detectProfanity(text);
  }

  async classifyStream(textChunks: string[]): Promise<ClassificationResult> {
    // Concatenate chunks for classification
    const fullText = textChunks.join(' ');
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.phi2Service) {
      throw new Error('Classifier not initialized');
    }

    return this.phi2Service.detectProfanity(fullText);
  }

  async classifyWithThreshold(text: string, threshold: number = 0.5): Promise<{
    isProfane: boolean;
    confidence: number;
    matchedWords?: string[];
  }> {
    const result = await this.classify(text);
    
    return {
      isProfane: result.confidence >= threshold,
      confidence: result.confidence,
      matchedWords: result.matchedWords
    };
  }

  /**
   * Optimized classification with timing constraints and batching
   */
  async classifyOptimized(text: string): Promise<ClassificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.phi2Service || !this.optimizer) {
      throw new Error('Classifier not initialized');
    }

    return this.optimizer.optimizeInference(text, this.phi2Service);
  }

  async getSupportedModels(): Promise<string[]> {
    return ['phi-2', 'tinyllama'];
  }

  async getModelInfo(modelType: string): Promise<{ name: string; sizeMb: number; description: string }> {
    const models: Record<string, { name: string; sizeMb: number; description: string }> = {
      'phi-2': {
        name: 'Phi-2',
        sizeMb: 2048, // ~2GB compressed
        description: 'Microsoft Phi-2, 2.7B parameters, excellent for text classification'
      },
      'tinyllama': {
        name: 'TinyLlama',
        sizeMb: 1300, // ~1.3GB compressed
        description: 'TinyLlama 1.3B, smaller and faster alternative to Phi-2'
      }
    };

    return models[modelType] || {
      name: modelType,
      sizeMb: 0,
      description: 'Unknown model type'
    };
  }

  /**
   * Get current optimization metrics
   */
  getOptimizerMetrics(): any {
    if (!this.optimizer) {
      return null;
    }
    return this.optimizer.getMetrics();
  }

  /**
   * Reset optimizer state (useful for re-initialization)
   */
  resetOptimizer(): void {
    if (this.optimizer) {
      this.optimizer.reset();
    }
  }
}
