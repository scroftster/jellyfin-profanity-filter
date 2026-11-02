/**
 * Unit tests for WordMatcher module
 */

import { WordMatcher, FilterWord, WordMatch } from '../../src/core/wordMatcher';

describe('WordMatcher', () => {
  let matcher: WordMatcher;

  beforeEach(async () => {
    matcher = new WordMatcher();
    await matcher.initialize();
  });

  describe('match()', () => {
    it('should find exact matches', async () => {
      const text = 'This is a test with the word fuck in it';
      const matches = matcher.match(text);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].word).toBe('fuck');
    });

    it('should find case-insensitive variations', async () => {
      const text = 'This is a test with the word FuCk in it';
      const matches = matcher.match(text);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].word).toBe('fuck');
    });

    it('should handle multiple matches', async () => {
      const text = 'This is fuck shit and damn words';
      const matches = matcher.match(text);
      
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it('should not match clean text', async () => {
      const text = 'This is a clean sentence without any profanity';
      const matches = matcher.match(text);
      
      expect(matches.length).toBe(0);
    });

    it('should handle overlapping matches correctly', async () => {
      const text = 'fuck fuck';
      const matches = matcher.match(text);
      
      // Should find both occurrences but not overlap incorrectly
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('addWord()', () => {
    it('should add a new word to the filter list', async () => {
      await matcher.addWord('testword', 'mild');
      
      const words = matcher.getWords();
      expect(words.some(w => w.word === 'testword')).toBe(true);
    });

    it('should use default category when not specified', async () => {
      await matcher.addWord('newword');
      
      const words = matcher.getWords();
      const newWord = words.find(w => w.word === 'newword');
      expect(newWord?.category).toBe('mild');
    });
  });

  describe('removeWord()', () => {
    it('should remove a word from the filter list', async () => {
      await matcher.addWord('removeme', 'mild');
      await matcher.removeWord('word_0'); // Remove by ID
      
      const words = matcher.getWords();
      expect(words.some(w => w.word === 'removeme')).toBe(false);
    });
  });

  describe('toggleWord()', () => {
    it('should toggle a word on/off', async () => {
      await matcher.addWord('toggletest', 'mild');
      
      // Get the ID of the newly added word
      const words = matcher.getWords();
      const toggledWord = words.find(w => w.word === 'toggletest');
      
      if (toggledWord) {
        await matcher.toggleWord(toggledWord.id, false);
        
        const updatedWords = matcher.getWords();
        expect(updatedWords.some(w => w.word === 'toggletest')).toBe(false);
      }
    });
  });

  describe('getWords()', () => {
    it('should return only enabled words', async () => {
      await matcher.addWord('enabledword', 'mild');
      
      const words = matcher.getWords();
      expect(words.some(w => w.word === 'enabledword')).toBe(true);
    });
  });

  describe('reset()', () => {
    it('should reset the word matcher', async () => {
      await matcher.addWord('testword', 'mild');
      
      await matcher.reset();
      
      const words = matcher.getWords();
      expect(words.length).toBe(0);
    });
  });
});
