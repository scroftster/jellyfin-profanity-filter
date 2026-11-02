/**
 * Word Matcher - Pattern matching engine for profanity detection
 * Supports exact matches, case variations, and character substitution patterns
 */

import { logger } from '../utils/logger';
import { configLoader } from '../utils/config';

export interface FilterWord {
  id: string;
  word: string;
  pattern?: string;
  category: 'slang' | 'explicit' | 'mild' | 'severe';
  enabled: boolean;
  confidenceWeight: number;
}

export interface WordMatch {
  word: string;
  pattern: string;
  startIndex: number;
  endIndex: number;
  category: FilterWord['category'];
}

export class WordMatcher {
  private words: FilterWord[] = [];
  private isInitialized: boolean = false;
  private readonly defaultWords: FilterWord[] = [
    {
      id: '1',
      word: 'fuck',
      category: 'severe',
      enabled: true,
      confidenceWeight: 1.0
    },
    {
      id: '2',
      word: 'shit',
      category: 'mild',
      enabled: true,
      confidenceWeight: 0.8
    },
    {
      id: '3',
      word: 'damn',
      category: 'mild',
      enabled: true,
      confidenceWeight: 0.6
    },
    {
      id: '4',
      word: 'hell',
      category: 'mild',
      enabled: true,
      confidenceWeight: 0.5
    }
  ];

  /**
   * Initialize the word matcher with default or custom word list
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load from file if exists, otherwise use defaults
    try {
      const configPath = './config/word-list.json';
      
      let wordList: FilterWord[] = [...this.defaultWords];
      
      try {
        const fs = require('fs');
        if (fs.existsSync(configPath)) {
          const rawData = fs.readFileSync(configPath, 'utf-8');
          const loadedWords: FilterWord[] = JSON.parse(rawData);
          wordList = loadedWords;
          logger.info('Word list loaded from file', { count: wordList.length });
        } else {
          logger.info('No word list file found, using defaults');
        }
      } catch (fileError) {
        logger.warn('Could not load word list from file, using defaults', { error: String(fileError) });
      }
      
      this.words = wordList;
      this.isInitialized = true;
      logger.info('Word matcher initialized', { wordCount: this.words.length });
    } catch (error) {
      logger.error('Failed to initialize word matcher, using defaults', { error: String(error) });
      this.words = [...this.defaultWords];
      this.isInitialized = true;
    }
  }

  /**
   * Add a new word to the filter list
   */
  public async addWord(word: string, category: FilterWord['category'] = 'mild'): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const id = `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWord: FilterWord = {
      id,
      word: word.toLowerCase(),
      category,
      enabled: true,
      confidenceWeight: this.getCategoryWeight(category)
    };

    this.words.push(newWord);
    logger.info('Word added to filter list', { word, id });
  }

  /**
   * Remove a word from the filter list
   */
  public async removeWord(wordId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.words = this.words.filter(w => w.id !== wordId);
    logger.info('Word removed from filter list', { id: wordId });
  }

  /**
   * Update a word's configuration
   */
  public async updateWord(wordId: string, updates: Partial<FilterWord>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const index = this.words.findIndex(w => w.id === wordId);
    if (index !== -1) {
      this.words[index] = { ...this.words[index], ...updates };
      logger.info('Word updated', { id: wordId, updates });
    }
  }

  /**
   * Enable or disable a word
   */
  public async toggleWord(wordId: string, enabled: boolean): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const index = this.words.findIndex(w => w.id === wordId);
    if (index !== -1) {
      this.words[index].enabled = enabled;
      logger.info('Word toggled', { id: wordId, enabled });
    }
  }

  /**
   * Match profanity in text using pattern matching
   */
  public match(text: string): WordMatch[] {
    if (!this.isInitialized) {
      throw new Error('WordMatcher not initialized. Call initialize() first.');
    }

    const matches: WordMatch[] = [];
    const lowerText = text.toLowerCase();

    for (const word of this.words) {
      // Exact match
      const exactIndex = lowerText.indexOf(word.word);
      if (exactIndex !== -1) {
        matches.push({
          word: word.word,
          pattern: word.word,
          startIndex: exactIndex,
          endIndex: exactIndex + word.word.length,
          category: word.category
        });
        continue;
      }

      // Case-insensitive variations (e.g., F#ck, FuCk)
      const variationPattern = this.buildVariationPattern(word.word);
      const variationMatches = this.findPatternMatches(lowerText, variationPattern);
      
      for (const match of variationMatches) {
        matches.push({
          word: word.word,
          pattern: match.pattern,
          startIndex: match.index,
          endIndex: match.index + match.length,
          category: word.category
        });
      }
    }

    // Remove overlapping matches (keep the longest/first)
    return this.deduplicateMatches(matches);
  }

  /**
   * Build pattern for case variations
   */
  private buildVariationPattern(word: string): RegExp {
    // Convert each character to a case-insensitive pattern
    const pattern = word.split('').map(char => {
      if (/[a-z]/i.test(char)) {
        return `[${char.toUpperCase()}${char.toLowerCase()}]`;
      }
      return char;
    }).join('');

    return new RegExp(pattern, 'g');
  }

  /**
   * Find all pattern matches in text
   */
  private findPatternMatches(text: string, pattern: RegExp): Array<{ index: number; length: number; pattern: string }> {
    const matches: Array<{ index: number; length: number; pattern: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        pattern: match[0]
      });
    }

    return matches;
  }

  /**
   * Remove overlapping matches, keeping the longest one
   */
  private deduplicateMatches(matches: WordMatch[]): WordMatch[] {
    const sorted = [...matches].sort((a, b) => b.endIndex - a.endIndex);
    const result: WordMatch[] = [];

    for (const match of sorted) {
      if (!result.some(r => r.startIndex < match.endIndex && r.endIndex > match.startIndex)) {
        result.push(match);
      }
    }

    return result;
  }

  /**
   * Get category weight for confidence calculation
   */
  private getCategoryWeight(category: FilterWord['category']): number {
    const weights: Record<FilterWord['category'], number> = {
      severe: 1.0,
      explicit: 0.8,
      mild: 0.5,
      slang: 0.3
    };
    return weights[category] || 0.5;
  }

  /**
   * Get all enabled words
   */
  public getWords(): FilterWord[] {
    return this.words.filter(w => w.enabled);
  }

  /**
   * Reset the word matcher
   */
  public async reset(): Promise<void> {
    this.words = [];
    this.isInitialized = false;
    logger.info('Word matcher reset');
  }
}
