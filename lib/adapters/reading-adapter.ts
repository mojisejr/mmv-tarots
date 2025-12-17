import type { ReadingResult } from '@/types/reading'

/**
 * AI Agent wrapper format
 */
interface AIWrapperResponse {
  reading: ReadingResult
  success: boolean
}

/**
 * Type guard to check if data has AI Agent wrapper structure
 *
 * @param data - Unknown data to check
 * @returns true if data matches AIWrapperResponse interface
 */
function isAIWrapperResponse(data: unknown): data is AIWrapperResponse {
  if (!data || typeof data !== 'object') {
    return false
  }

  const wrapper = data as Record<string, unknown>
  return (
    'reading' in wrapper &&
    'success' in wrapper &&
    typeof wrapper.success === 'boolean'
  )
}

/**
 * Check if data has valid ReadingResult structure
 *
 * @param data - Unknown data to check
 * @returns true if data is a valid ReadingResult with meaningful content
 */
function isValidReadingResult(data: unknown): data is ReadingResult {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Check for empty object
  if (Object.keys(data).length === 0) {
    return false
  }

  const reading = data as Record<string, unknown>

  // At least one field should have meaningful data
  const hasValidHeader = typeof reading.header === 'string' && reading.header.length > 0
  const hasValidReading = typeof reading.reading === 'string' && reading.reading.length > 0
  const hasValidCards = Array.isArray(reading.cards_reading) && reading.cards_reading.length > 0
  const hasValidSuggestions = Array.isArray(reading.suggestions) && reading.suggestions.length > 0
  const hasValidQuestions = Array.isArray(reading.next_questions) && reading.next_questions.length > 0
  const hasValidSummary = typeof reading.final_summary === 'string' && reading.final_summary.length > 0
  const hasValidDisclaimer = typeof reading.disclaimer === 'string' && reading.disclaimer.length > 0

  return hasValidHeader || hasValidReading || hasValidCards ||
         hasValidSuggestions || hasValidQuestions || hasValidSummary || hasValidDisclaimer
}

/**
 * Adapt reading data from AI Agent wrapper format to direct ReadingResult format
 *
 * This adapter handles data transformation between AI Agent output format
 * and the expected ReadingResult interface used by the API.
 *
 * **Input Format (AI Agent):**
 * ```typescript
 * {
 *   reading: {
 *     header?: string,
 *     cards_reading?: CardReading[],
 *     reading?: string,
 *     suggestions?: string[],
 *     next_questions?: string[],
 *     final_summary?: string,
 *     disclaimer?: string
 *   },
 *   success: boolean
 * }
 * ```
 *
 * **Output Format (ReadingResult):**
 * ```typescript
 * {
 *   header?: string,
 *   cards_reading?: CardReading[],
 *   reading?: string,
 *   suggestions?: string[],
 *   next_questions?: string[],
 *   final_summary?: string,
 *   disclaimer?: string
 * }
 * ```
 *
 * @param data - Raw data from AI Agent response or database (finalReading field)
 * @returns ReadingResult if valid and successful, null otherwise
 *
 * @example
 * ```typescript
 * const aiData = {
 *   reading: { header: "Your Reading", reading: "..."},
 *   success: true
 * }
 * const result = adaptReadingData(aiData)
 * // result: { header: "Your Reading", reading: "..." }
 * ```
 */
export function adaptReadingData(data: unknown): ReadingResult | null {
  // Handle null/undefined
  if (!data || typeof data !== 'object') {
    return null
  }

  // If already in ReadingResult format, validate and return as-is
  if (!isAIWrapperResponse(data)) {
    if (isValidReadingResult(data)) {
      return data
    }
    return null
  }

  // Extract from AI Agent wrapper
  const { reading, success } = data

  // Must have success flag
  if (!success) {
    return null
  }

  // Validate reading data
  if (!isValidReadingResult(reading)) {
    return null
  }

  // Return the reading data directly
  return reading
}