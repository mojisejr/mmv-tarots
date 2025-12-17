import { vi, describe, it, expect } from 'vitest';
import { mapReadingData } from '@/lib/reading-utils';

describe('mapReadingData - Empty Objects', () => {
  it('should return null for empty object {}', () => {
    const result = mapReadingData({} as any);
    expect(result).toBeNull();
  });

  it('should return null for object with only null/undefined values', () => {
    const result = mapReadingData({
      header: null,
      cards_reading: null,
      reading: undefined,
      suggestions: null,
      next_questions: undefined,
      final_summary: null,
      disclaimer: undefined
    } as any);
    expect(result).toBeNull();
  });

  it('should return null for object with empty strings', () => {
    const result = mapReadingData({
      header: '',
      cards_reading: null,
      reading: '',
      suggestions: [],
      next_questions: [],
      final_summary: '',
      disclaimer: ''
    } as any);
    // Should return null because no meaningful data exists
    expect(result).toBeNull();
  });

  it('should return valid mapped data for object with at least one valid field', () => {
    const result = mapReadingData({
      header: 'Test Header',
      cards_reading: null,
      reading: '',
      suggestions: [],
      next_questions: [],
      final_summary: '',
      disclaimer: ''
    } as any);
    // Should not return null because header is valid
    expect(result).toEqual({
      header: 'Test Header',
      cards: [],
      reading: '',
      suggestions: [],
      nextQuestions: [],
      finalSummary: '',
      disclaimer: ''
    });
  });
});