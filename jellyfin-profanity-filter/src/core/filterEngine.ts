/**
 * Filter Engine - Main filtering logic for Jellyfin Profanity Filter plugin
 * Coordinates word matching, LLM classification, and action execution
 */

import { WordMatcher } from './wordMatcher';
import { ActionHandler } from './actionHandler';
import { configLoader } from '../utils/config';
import { logger } from '../utils/logger';

export interface ProfanityCheckResult {
  text: string;
  timestamp: number;
  isProfane: boolean;
  confidence: number;
  matchedWords: string[];
  actionTaken?: 'mute' | 'skip' | 'both' | 'notify';
}

export interface FilterConfig {
  enabled: boolean;
  confidenceThreshold: number;
  actionOnProfanity: 'mute' | 'skip' | 'both' | 'notify';
}

export class FilterEngine {
  private wordMatcher: WordMatcher;
  private actionHandler: ActionHandler;
  private filterConfig: FilterConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.wordMatcher = new WordMatcher();
    this.actionHandler = new ActionHandler();
    this.filterConfig = {
      enabled: configLoader.isEnabled(),
      confidenceThreshold: configLoader.getConfidenceThreshold(),
      actionOnProfanity: configLoader.getActionOnProfanity()
    };
  }

  /**
   * Initialize the filter engine with configuration
   */
  public async initialize(): Promise<void> {
    await this.wordMatcher.initialize();
    await this.actionHandler.initialize();
    this.filterConfig.enabled = configLoader.isEnabled();
    this.filterConfig.confidenceThreshold = configLoader.getConfidenceThreshold();
    this.filterConfig.actionOnProfanity = configLoader.getActionOnProfanity();
    this.isInitialized = true;
    logger.info('Filter engine initialized');
  }

  /**
   * Check text for profanity and determine action
   */
  public async check(text: string, timestamp?: number): Promise<ProfanityCheckResult> {
    if (!this.filterConfig.enabled) {
      return {
        text,
        timestamp: timestamp || Date.now(),
        isProfane: false,
        confidence: 0,
        matchedWords: []
      };
    }

    // Check against word list first (fast path)
    const wordMatches = this.wordMatcher.match(text);
    
    if (wordMatches.length > 0) {
      logger.debug('Word match detected', { text: text.substring(0, 50), matches: wordMatches });
      
      // Determine action based on configuration
      const action = this.filterConfig.actionOnProfanity;
      
      return {
        text,
        timestamp: timestamp || Date.now(),
        isProfane: true,
        confidence: 1.0, // Word match has maximum confidence
        matchedWords: wordMatches.map(w => w.word),
        actionTaken: action
      };
    }

    // If no direct word match, optionally use LLM for context-aware detection
    if (this.filterConfig.actionOnProfanity === 'notify' || 
        this.filterConfig.confidenceThreshold < 1.0) {
      
      // For now, return clean since no word matched
      // In Phase 2, we'll integrate LLM here for context-aware detection
      logger.debug('No profanity detected in text');
      return {
        text,
        timestamp: timestamp || Date.now(),
        isProfane: false,
        confidence: 0,
        matchedWords: []
      };
    }

    return {
      text,
      timestamp: timestamp || Date.now(),
      isProfane: false,
      confidence: 0,
      matchedWords: []
    };
  }

  /**
   * Check if filter is enabled
   */
  public isEnabled(): boolean {
    return this.filterConfig.enabled;
  }

  /**
   * Get current filter configuration
   */
  public getConfig(): FilterConfig {
    return { ...this.filterConfig };
  }

  /**
   * Update filter configuration
   */
  public async updateConfig(config: Partial<FilterConfig>): Promise<void> {
    if (config.enabled !== undefined) {
      this.filterConfig.enabled = config.enabled;
    }
    if (config.confidenceThreshold !== undefined) {
      this.filterConfig.confidenceThreshold = config.confidenceThreshold;
    }
    if (config.actionOnProfanity !== undefined) {
      this.filterConfig.actionOnProfanity = config.actionOnProfanity;
    }
    
    // Persist changes
    await configLoader.save();
    logger.info('Filter configuration updated', { config: this.filterConfig });
  }

  /**
   * Get matched words for a text segment
   */
  public getMatchedWords(text: string): string[] {
    const matches = this.wordMatcher.match(text);
    return matches.map(m => m.word);
  }

  /**
   * Reset the filter engine (useful for reinitialization)
   */
  public async reset(): Promise<void> {
    await this.wordMatcher.reset();
    await this.actionHandler.reset();
    this.isInitialized = false;
    logger.info('Filter engine reset');
  }
}

export const filterEngine = new FilterEngine();
