import { describe, it, expect } from 'vitest';
import { mapReadingData } from '@/lib/client/reading-utils';
import type { ReadingResult } from '@/types/reading';

describe('mapReadingData', () => {
  const validReadingResult: ReadingResult = {
    header: 'ทดสอบการทำนาย',
    cards_reading: [
      {
        position: 0,
        name_th: 'คนเกิด',
        name_en: 'The Fool',
        arcana: 'Major Arcana',
        keywords: ['จุดเริ่มต้น', 'ความเชื่อมั่น', 'ความบริสุทธิ์'],
        interpretation: 'เป็นการเริ่มต้นการเดินทางใหม่',
        image: 'url'
      }
    ],
    reading: 'คำทำนายหลัก',
    suggestions: ['ข้อเสนอแนะที่ 1'],
    next_questions: ['คำถามต่อไป'],
    final_summary: 'สรุปผล',
    disclaimer: 'ข้อจำกัดความรับผิดชอบ'
  };

  it('should map valid reading data correctly', () => {
    const result = mapReadingData(validReadingResult);

    expect(result).toEqual({
      header: 'ทดสอบการทำนาย',
      cards: [
        {
          ...validReadingResult.cards_reading[0],
          positionName: 'อดีต',
          arcanaColor: '#FFD700'
        }
      ],
      reading: 'คำทำนายหลัก',
      suggestions: ['ข้อเสนอแนะที่ 1'],
      nextQuestions: ['คำถามต่อไป'],
      finalSummary: 'สรุปผล',
      disclaimer: 'ข้อจำกัดความรับผิดชอบ'
    });
  });

  it('should handle missing optional fields', () => {
    const minimalReading: Partial<ReadingResult> = {
      cards_reading: [validReadingResult.cards_reading[0]]
    };

    const result = mapReadingData(minimalReading as ReadingResult);

    expect(result?.header).toBe('');
    expect(result?.reading).toBe('');
    expect(result?.suggestions).toEqual([]);
    expect(result?.nextQuestions).toEqual([]);
    expect(result?.finalSummary).toBe('');
    expect(result?.disclaimer).toBe('');
  });

  it('should return null for null input', () => {
    const result = mapReadingData(null as any);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = mapReadingData(undefined as any);
    expect(result).toBeNull();
  });

  // Edge case: cards_reading as JSON string
  it('should handle cards_reading as JSON string', () => {
    const readingWithStringCards: ReadingResult = {
      ...validReadingResult,
      cards_reading: JSON.stringify([validReadingResult.cards_reading[0]]) as any
    };

    const result = mapReadingData(readingWithStringCards);
    expect(result?.cards).toHaveLength(1);
    expect(result?.cards[0].name_th).toBe('คนเกิด');
  });

  // Edge case: cards_reading as plain string (not JSON)
  it('should handle cards_reading as plain string (not JSON)', () => {
    const readingWithPlainTextCards: ReadingResult = {
      ...validReadingResult,
      cards_reading: 'not a valid json' as any
    };

    const result = mapReadingData(readingWithPlainTextCards);
    expect(result?.cards).toEqual([]);
  });

  // Edge case: invalid object structure
  it('should handle invalid object structure', () => {
    const invalidReading = {
      header: { invalid: 'object' } as any,
      cards_reading: 'string' as any,
      reading: { invalid: 'object' } as any,
      suggestions: 'not an array' as any,
      next_questions: null,
      final_summary: undefined,
      disclaimer: 123 as any
    };

    const result = mapReadingData(invalidReading as any);

    // Should return null since no valid data found
    expect(result).toBeNull();
  });

  // Edge case: fields with wrong types
  it('should handle fields with wrong types gracefully', () => {
    const wrongTypeReading = {
      header: null,
      cards_reading: [
        { ...validReadingResult.cards_reading[0], position: 'not a number' as any }
      ],
      reading: undefined,
      suggestions: null,
      next_questions: undefined,
      final_summary: null,
      disclaimer: null
    };

    const result = mapReadingData(wrongTypeReading as any);

    // Should return null since no valid data found (cards have invalid position)
    expect(result).toBeNull();
  });

  it('should handle empty cards_reading array', () => {
    const readingWithEmptyCards: ReadingResult = {
      ...validReadingResult,
      cards_reading: []
    };

    const result = mapReadingData(readingWithEmptyCards);
    expect(result?.cards).toEqual([]);
  });

  it('should handle arcana colors correctly', () => {
    const readingWithDifferentArcana: ReadingResult = {
      ...validReadingResult,
      cards_reading: [
        { ...validReadingResult.cards_reading[0], arcana: 'wands' },
        { ...validReadingResult.cards_reading[0], arcana: 'cups' },
        { ...validReadingResult.cards_reading[0], arcana: 'swords' },
        { ...validReadingResult.cards_reading[0], arcana: 'pentacles' },
        { ...validReadingResult.cards_reading[0], arcana: 'unknown arcana' }
      ]
    };

    const result = mapReadingData(readingWithDifferentArcana);

    expect(result?.cards[0].arcanaColor).toBe('#FF6B35'); // Orange/Red
    expect(result?.cards[1].arcanaColor).toBe('#4A90E2'); // Blue
    expect(result?.cards[2].arcanaColor).toBe('#95A5A6'); // Silver/Gray
    expect(result?.cards[3].arcanaColor).toBe('#27AE60'); // Green
    expect(result?.cards[4].arcanaColor).toBe('#FFFFFF'); // White (default)
  });

  it('should handle position names correctly', () => {
    const readingWithDifferentPositions: ReadingResult = {
      ...validReadingResult,
      cards_reading: [
        { ...validReadingResult.cards_reading[0], position: 0 },
        { ...validReadingResult.cards_reading[0], position: 1 },
        { ...validReadingResult.cards_reading[0], position: 2 },
        { ...validReadingResult.cards_reading[0], position: 99 }
      ]
    };

    const result = mapReadingData(readingWithDifferentPositions);

    expect(result?.cards[0].positionName).toBe('อดีต');
    expect(result?.cards[1].positionName).toBe('ปัจจุบัน');
    expect(result?.cards[2].positionName).toBe('อนาคต');
    expect(result?.cards[3].positionName).toBe('อดีต'); // Default for unknown position
  });

  it('should return null for completely invalid input', () => {
    expect(mapReadingData('string' as any)).toBeNull();
    expect(mapReadingData(123 as any)).toBeNull();
    expect(mapReadingData(true as any)).toBeNull();
  });
});