/**
 * Type definitions for Tarot card system
 */

export interface TarotCard {
  position: number;
  id: string;
  name_en: string;
  name_th: string;
  image_url?: string;
  keywords: string[];
  orientation: 'upright' | 'reversed';
  interpretation: string;
}

export interface TarotCardData {
  id: number;
  name: string;
  displayName: string;
  arcana: string;
  shortMeaning: string;
  longMeaning: string;
  longMeaningRaw: string;
  keywords: string[];
  imageUrl: string;
}

export interface TarotReading {
  job_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  data?: {
    header: string;
    reading_metadata: {
      mood: string;
      topic: string;
      dominant_element: string;
    };
    cards_reading: TarotCard[];
    reading: string;
    suggestions: string[];
    next_questions: string[];
    final_summary: string;
    disclaimer: string;
  };
}

export type ArcanaType = 'Major Arcana' | 'Wands' | 'Cups' | 'Pentacles' | 'Swords';

export interface CardValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'EMPTY_ID' | 'DUPLICATE_ID' | 'MISSING_ID' | 'INVALID_RANGE';
    cardName?: string;
    cardId?: number;
    message: string;
  }>;
  missingIds: number[];
  duplicateIds: number[];
}