/**
 * Jellyfin Profanity Filter Plugin - Main Entry Point
 *
 * This plugin filters profanity from recorded media playback using:
 * - Whisper.cpp for real-time audio-to-text transcription
 * - Local LLM (Phi-2 or TinyLlama) for profanity detection
 * - Integration with Jellyfin's existing API endpoints
 */

import { FilterEngine } from './core/filterEngine';
import { WordMatcher, FilterWord, WordMatch } from './core/wordMatcher';
import { ActionHandler, MuteRequest, SkipRequest, FilterStatusResponse } from './core/actionHandler';
import { AudioProcessor, AudioChunk, AudioBuffer, TranscodeHookRequest } from './stt/audioProcessor';
import { WhisperService, TranscriptionResult, WhisperSegment, WhisperConfig } from './stt/whisperService';
import { logger, LogLevel } from './utils/logger';
import { configLoader, PluginConfig, ConfigOptions } from './utils/config';
import { ProfanityClassifier } from './llm/profanityClassifier';

// Export all core modules
export { FilterEngine };
export { WordMatcher, FilterWord, WordMatch };
export { ActionHandler, MuteRequest, SkipRequest, FilterStatusResponse };
export { AudioProcessor, AudioChunk, AudioBuffer, TranscodeHookRequest };
export { WhisperService, TranscriptionResult, WhisperSegment, WhisperConfig };
export { logger, LogLevel };
export { configLoader, PluginConfig, ConfigOptions };

/**
 * Initialize the plugin with all services
 */
export async function initializePlugin(): Promise<void> {
  logger.info('Initializing Jellyfin Profanity Filter Plugin');

  // Initialize configuration
  await configLoader.load();

  // Initialize core filter engine
  await filterEngine.initialize();

  // Initialize word matcher
  await wordMatcher.initialize();

  // Initialize action handler
  await actionHandler.initialize();

  // Initialize audio processor
  await audioProcessor.initialize();

  // Initialize whisper service
  await whisperService.initialize();

  // Initialize profanity classifier (Phi-2)
  await profilerClassifier.initialize();

  logger.info('Jellyfin Profanity Filter Plugin initialized successfully');
}

/**
 * Get the main filter engine instance
 */
export const filterEngine = new FilterEngine();

/**
 * Get the word matcher instance
 */
export const wordMatcher = new WordMatcher();

/**
 * Get the action handler instance
 */
export const actionHandler = new ActionHandler();

/**
 * Get the audio processor instance
 */
export const audioProcessor = new AudioProcessor();

/**
 * Get the whisper service instance
 */
export const whisperService = new WhisperService();

/**
 * Get the profanity classifier instance
 */
export const profilerClassifier = new ProfanityClassifier({
  modelPath: './models/phi-2-gguf-q4_k_m.gguf',
  modelType: 'phi-2' as const,
  fallbackToBinary: true
});
