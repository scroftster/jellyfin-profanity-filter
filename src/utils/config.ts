/**
 * Configuration loader for Jellyfin Profanity Filter plugin
 * Handles loading and managing plugin configuration
 */

import { logger } from './logger';

export interface PluginConfig {
  enabled: boolean;
  processingMode: 'realtime' | 'batch';
  confidenceThreshold: number;
  actionOnProfanity: 'mute' | 'skip' | 'both' | 'notify';
  whisperModelPath: string;
  llmModelPath: string;
  audioBufferSizeMs: number;
  transcriptionChunkSizeMs: number;
}

export interface ConfigOptions {
  enabled?: boolean;
  processingMode?: 'realtime' | 'batch';
  confidenceThreshold?: number;
  actionOnProfanity?: 'mute' | 'skip' | 'both' | 'notify';
  whisperModelPath?: string;
  llmModelPath?: string;
  audioBufferSizeMs?: number;
  transcriptionChunkSizeMs?: number;
}

export interface DefaultConfig {
  enabled: boolean;
  processingMode: 'realtime';
  confidenceThreshold: number;
  actionOnProfanity: 'notify';
  whisperModelPath: string;
  llmModelPath: string;
  audioBufferSizeMs: number;
  transcriptionChunkSizeMs: number;
}

const DEFAULT_CONFIG: DefaultConfig = {
  enabled: false,
  processingMode: 'realtime',
  confidenceThreshold: 0.7,
  actionOnProfanity: 'notify',
  whisperModelPath: './models/whisper-cpp-ggml-q5_1.bin',
  llmModelPath: './models/phi-2-gguf-q4_k_m.gguf',
  audioBufferSizeMs: 1000,
  transcriptionChunkSizeMs: 1000
};

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: PluginConfig;
  private readonly configPath: string;

  private constructor(configPath: string = './config/plugin-config.json') {
    this.configPath = configPath;
    this.config = { ...DEFAULT_CONFIG };
  }

  public static getInstance(configPath?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader(configPath);
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from file or initialize with defaults
   */
  public async load(): Promise<PluginConfig> {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.configPath)) {
        const rawData = fs.readFileSync(this.configPath, 'utf-8');
        const loadedConfig: Partial<PluginConfig> = JSON.parse(rawData);
        this.config = { ...DEFAULT_CONFIG, ...loadedConfig };
        logger.info('Configuration loaded from file', { path: this.configPath });
      } else {
        logger.info('No configuration file found, using defaults');
      }
    } catch (error) {
      logger.error('Failed to load configuration', { error: String(error) });
    }

    return this.config;
  }

  /**
   * Save current configuration to file
   */
  public async save(): Promise<void> {
    try {
      const fs = require('fs');
      const configDir = 'config';
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2)
      );
      logger.info('Configuration saved', { path: this.configPath });
    } catch (error) {
      logger.error('Failed to save configuration', { error: String(error) });
    }
  }

  /**
   * Update a specific configuration value
   */
  public update<K extends keyof PluginConfig>(
    key: K,
    value: PluginConfig[K]
  ): void {
    this.config[key] = value;
  }

  /**
   * Get current configuration value
   */
  public get<K extends keyof PluginConfig>(key: K): PluginConfig[K] {
    return this.config[key];
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Check if plugin is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the action to take when profanity is detected
   */
  public getActionOnProfanity(): 'mute' | 'skip' | 'both' | 'notify' {
    return this.config.actionOnProfanity;
  }

  /**
   * Get the confidence threshold for filtering
   */
  public getConfidenceThreshold(): number {
    return this.config.confidenceThreshold;
  }

  /**
   * Get the full configuration object
   */
  public getConfig(): PluginConfig {
    return this.config;
  }

  /**
   * Get a configuration value by key
   */
  public get<K extends keyof PluginConfig>(key: K): PluginConfig[K] {
    return this.config[key];
  }
}

export const configLoader = ConfigLoader.getInstance();
