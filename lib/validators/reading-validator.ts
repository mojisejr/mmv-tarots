import type { ReadingResult } from '@/types/reading';

/**
 * Validate if data has the structure of a valid reading result
 */
export function isValidReading(data: unknown): data is ReadingResult {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for empty object
  if (Object.keys(data).length === 0) {
    return false;
  }

  const reading = data as Record<string, unknown>;

  // At least one field should have meaningful data
  const hasValidHeader = typeof reading.header === 'string' && reading.header.length > 0;
  const hasValidReading = typeof reading.reading === 'string' && reading.reading.length > 0;
  const hasValidCards = Array.isArray(reading.cards_reading) && reading.cards_reading.length > 0;
  const hasValidSuggestions = Array.isArray(reading.suggestions) && reading.suggestions.length > 0;
  const hasValidQuestions = Array.isArray(reading.next_questions) && reading.next_questions.length > 0;
  const hasValidSummary = typeof reading.final_summary === 'string' && reading.final_summary.length > 0;
  const hasValidDisclaimer = typeof reading.disclaimer === 'string' && reading.disclaimer.length > 0;

  return hasValidHeader || hasValidReading || hasValidCards ||
         hasValidSuggestions || hasValidQuestions || hasValidSummary || hasValidDisclaimer;
}

/**
 * Sanitize reading data by removing invalid fields
 */
export function sanitizeReading(data: unknown): ReadingResult | null {
  if (!isValidReading(data)) {
    return null;
  }

  const reading = data as Record<string, unknown>;
  const result: ReadingResult = {};

  // Only include valid fields
  if (typeof reading.header === 'string') {
    result.header = reading.header;
  }

  if (Array.isArray(reading.cards_reading)) {
    result.cards_reading = reading.cards_reading;
  }

  if (typeof reading.reading === 'string') {
    result.reading = reading.reading;
  }

  if (Array.isArray(reading.suggestions)) {
    result.suggestions = reading.suggestions;
  }

  if (Array.isArray(reading.next_questions)) {
    result.next_questions = reading.next_questions;
  }

  if (typeof reading.final_summary === 'string') {
    result.final_summary = reading.final_summary;
  }

  if (typeof reading.disclaimer === 'string') {
    result.disclaimer = reading.disclaimer;
  }

  return result;
}