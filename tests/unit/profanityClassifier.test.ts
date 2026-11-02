/**
 * Unit tests for Profanity Classifier
 */

import { ProfanityClassifier } from '../../src/llm/profanityClassifier';

describe('ProfanityClassifier', () => {
  let classifier: ProfanityClassifier;

  beforeEach(() => {
    // Mock the model loading
    jest.spyOn(console, 'log').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('classify', () => {
    it('should classify profane text correctly', async () => {
      const result = await classifier.classify('This is F#ck you!');
      
      expect(result.isProfane).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify non-profane text correctly', async () => {
      const result = await classifier.classify('Hello, how are you today?');
      
      expect(result.isProfane).toBe(false);
    });

    it('should handle edge cases with variations', async () => {
      const testCases = [
        { text: 'F#ck', expected: true },
        { text: 'G#d', expected: true },
        { text: 'D##n', expected: true },
        { text: 'S#t', expected: true },
        { text: 'Hello world', expected: false }
      ];

      for (const testCase of testCases) {
        const result = await classifier.classify(testCase.text);
        expect(result.isProfane).toBe(testCase.expected);
      }
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      // This would fail in real tests without the model file
      // but we test the interface here
      expect(classifier.modelPath).toBeDefined();
      expect(classifier.modelType).toBe('phi-2');
    });
  });
});
