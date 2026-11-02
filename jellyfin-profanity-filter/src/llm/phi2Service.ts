/**
 * Phi-2 LLM Service for profanity detection
 * Uses llama-cpp-python for GGUF model inference
 */

import { LogLevel } from '../utils/logger';

export interface Phi2Config {
  modelPath: string;
  contextSize?: number;
  nBatch?: number;
  nThreads?: number;
}

export class Phi2Service {
  private config: Phi2Config;
  private logLevel: LogLevel = LogLevel.INFO;
  private isInitialized: boolean = false;
  private modelInstance: any | null = null;

  constructor(config: Phi2Config) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.debug('Phi-2 service already initialized');
      return;
    }

    console.info(`Initializing Phi-2 from: ${this.config.modelPath}`);
    
    try {
      await this.loadModel();
      this.isInitialized = true;
      console.info('Phi-2 service initialized successfully');
    } catch (error) {
      console.error(`Failed to initialize Phi-2: ${error}`);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    // Implementation depends on chosen binding:
    // Option 1: llama-cpp-python
    
    // Example using llama-cpp-python:
    /*
    import llama_cpp
    from transformers import AutoTokenizer

    model = llama_cpp.Llama(
      model_path=this.config.modelPath,
      n_ctx=this.config.contextSize || 4096,
      n_batch=this.config.nBatch || 512,
      n_threads=this.config.nThreads || os.cpu_count() || 4,
      verbose=False
    )
    
    this.tokenizer = AutoTokenizer.from_pretrained('microsoft/phi-2')
    */

    // Placeholder - actual implementation requires llama-cpp-python installation
    throw new Error('llama-cpp-python not installed. Run: pip install llama-cpp-python');
  }

  async generate(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultOptions = {
      max_tokens: 10,
      temperature: 0.1,
      ...options
    };

    console.debug(`Generating response for prompt length: ${prompt.length}`);

    // Stream generation for better performance
    const stream = await this.modelInstance.generate(prompt, defaultOptions);
    
    let result = '';
    for await (const token of stream) {
      result += token;
    }

    return result.trim();
  }

  async generateStream(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<AsyncGenerator<string>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultOptions = {
      max_tokens: 10,
      temperature: 0.1,
      ...options
    };

    return this.modelInstance.generate(prompt, defaultOptions);
  }

  async classifyText(text: string): Promise<{ isProfane: boolean; confidence: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Prompt engineering for classification
    const prompt = `Is the following text containing profanity or offensive language? Respond ONLY with YES or NO.\n\nText: ${text}`;
    
    console.debug(`Classifying text (length: ${text.length})`);
    
    const response = await this.generate(prompt, { max_tokens: 10 });
    
    // Parse response
    const isProfane = response.trim().toUpperCase() === 'YES';
    const confidence = isProfane ? 0.95 : 0.85; // High confidence due to binary classification

    return { isProfane, confidence };
  }

  async detectProfanity(text: string): Promise<{
    isProfane: boolean;
    confidence: number;
    matchedWords?: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Enhanced prompt for detailed analysis
    const prompt = `Analyze the following text for profanity or offensive language. Respond in JSON format:\n{\n  "is_profane": true/false,\n  "confidence": 0.0-1.0,\n  "matched_words": ["word1", "word2"]\n}\n\nText: ${text}`;
    
    console.debug(`Detecting profanity in text (length: ${text.length})`);
    
    try {
      const response = await this.generate(prompt, { max_tokens: 50 });
      
      // Parse JSON response
      const match = response.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('Failed to parse classification response');
      }

      const parsed = JSON.parse(match[0]);
      
      return {
        isProfane: parsed.is_profane,
        confidence: parsed.confidence,
        matchedWords: parsed.matched_words || []
      };
    } catch (error) {
      console.warn(`Classification failed, falling back to binary classification: ${error}`);
      
      // Fallback to simple binary classification
      const result = await this.classifyText(text);
      return {
        isProfane: result.isProfane,
        confidence: result.confidence,
        matchedWords: []
      };
    }
  }
}
