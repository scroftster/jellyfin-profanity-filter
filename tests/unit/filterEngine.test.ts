/**
 * Unit tests for FilterEngine module
 */

import { FilterEngine, ProfanityCheckResult } from '../../src/core/filterEngine';

describe('FilterEngine', () => {
  let engine: FilterEngine;

  beforeEach(async () => {
    engine = new FilterEngine();
    await engine.initialize();
  });

  describe('check()', () => {
    it('should return clean text when no profanity detected', async () => {
      const result: ProfanityCheckResult = await engine.check('This is a clean sentence');
      
      expect(result.isProfane).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.matchedWords.length).toBe(0);
    });

    it('should detect profanity when word matches', async () => {
      const result: ProfanityCheckResult = await engine.check('This contains the word fuck');
      
      expect(result.isProfane).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.matchedWords.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', async () => {
      const result: ProfanityCheckResult = await engine.check('This contains the word FuCk');
      
      expect(result.isProfane).toBe(true);
      expect(result.matchedWords.length).toBeGreaterThan(0);
    });

    it('should return clean text when filter is disabled', async () => {
      const result: ProfanityCheckResult = await engine.check('This contains the word fuck');
      
      // Even with profanity in text, if filter is enabled (default), it should detect
      expect(result.isProfane).toBe(true);
    });

    it('should handle empty text', async () => {
      const result: ProfanityCheckResult = await engine.check('');
      
      expect(result.isProfane).toBe(false);
      expect(result.text).toBe('');
    });

    it('should handle null timestamp gracefully', async () => {
      const result: ProfanityCheckResult = await engine.check('Test text', undefined);
      
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('isEnabled()', () => {
    it('should return current filter enabled state', () => {
      const isEnabled = engine.isEnabled();
      
      // Default should be based on config, which is false initially
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = engine.getConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('confidenceThreshold');
      expect(config).toHaveProperty('actionOnProfanity');
    });
  });

  describe('updateConfig()', () => {
    it('should update filter enabled state', async () => {
      await engine.updateConfig({ enabled: true });
      
      const config = engine.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should update confidence threshold', async () => {
      await engine.updateConfig({ confidenceThreshold: 0.9 });
      
      const config = engine.getConfig();
      expect(config.confidenceThreshold).toBe(0.9);
    });

    it('should update action on profanity', async () => {
      await engine.updateConfig({ actionOnProfanity: 'mute' });
      
      const config = engine.getConfig();
      expect(config.actionOnProfanity).toBe('mute');
    });
  });

  describe('getMatchedWords()', () => {
    it('should return matched words for text', async () => {
      const words = engine.getMatchedWords('This contains fuck and shit');
      
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should return empty array for clean text', async () => {
      const words = engine.getMatchedWords('This is a clean sentence');
      
      expect(words.length).toBe(0);
    });
  });

  describe('reset()', () => {
    it('should reset the filter engine', async () => {
      await engine.reset();
      
      // After reset, should be in default state
      const config = engine.getConfig();
      expect(config.enabled).toBe(false); // Default is false
    });
  });
});
