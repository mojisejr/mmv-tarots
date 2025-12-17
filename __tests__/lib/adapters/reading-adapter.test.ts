import { describe, it, expect } from 'vitest'
import type { ReadingResult } from '@/types/reading'
import { adaptReadingData } from '@/lib/adapters/reading-adapter'

describe('adaptReadingData', () => {
  // Test Case 1: AI Agent wrapper format → valid ReadingResult
  it('should extract reading data from AI Agent wrapper format', () => {
    const aiWrapperData = {
      reading: {
        header: 'The Path Forward',
        cards_reading: [
          {
            position: 1,
            name_th: 'ไพ่มัจจุราช',
            name_en: 'The Magician',
            arcana: 'Major Arcana',
            keywords: ['action', 'power', 'creativity'],
            interpretation: 'You have the power to manifest your desires',
            image: '/cards/magician.jpg'
          }
        ],
        reading: 'Your journey reveals...',
        suggestions: ['Meditate daily', 'Trust your intuition'],
        next_questions: ['What is blocking your progress?'],
        final_summary: 'The path is clear for transformation',
        disclaimer: 'This reading is for entertainment purposes'
      },
      success: true
    }

    const result = adaptReadingData(aiWrapperData)

    expect(result).toEqual({
      header: 'The Path Forward',
      cards_reading: [
        {
          position: 1,
          name_th: 'ไพ่มัจจุราช',
          name_en: 'The Magician',
          arcana: 'Major Arcana',
          keywords: ['action', 'power', 'creativity'],
          interpretation: 'You have the power to manifest your desires',
          image: '/cards/magician.jpg'
        }
      ],
      reading: 'Your journey reveals...',
      suggestions: ['Meditate daily', 'Trust your intuition'],
      next_questions: ['What is blocking your progress?'],
      final_summary: 'The path is clear for transformation',
      disclaimer: 'This reading is for entertainment purposes'
    })
  })

  // Test Case 2: Nested wrapper.success → extract reading data
  it('should validate success flag before extracting data', () => {
    const aiWrapperData = {
      reading: {
        header: 'Success Reading'
      },
      success: false
    }

    const result = adaptReadingData(aiWrapperData)
    expect(result).toBeNull()
  })

  // Test Case 3: Invalid data → return null
  it('should return null for invalid data structures', () => {
    const invalidData = {
      notReading: {},
      success: true
    }

    const result = adaptReadingData(invalidData)
    expect(result).toBeNull()
  })

  // Test Case 4: Empty/missing reading → return null
  it('should return null for empty or missing reading data', () => {
    const emptyReadingData = {
      reading: {},
      success: true
    }

    const result = adaptReadingData(emptyReadingData)
    expect(result).toBeNull()
  })

  // Test Case 5: Already valid data → return as-is
  it('should return data as-is if already in ReadingResult format', () => {
    const validReadingData: ReadingResult = {
      header: 'Already Valid',
      reading: 'This reading is already valid'
    }

    const result = adaptReadingData(validReadingData)
    expect(result).toEqual(validReadingData)
  })

  // Test Case 6: Null/undefined input
  it('should handle null and undefined inputs gracefully', () => {
    expect(adaptReadingData(null)).toBeNull()
    expect(adaptReadingData(undefined)).toBeNull()
    expect(adaptReadingData({})).toBeNull()
  })

  // Test Case 7: Partial data with some missing fields
  it('should extract only available fields from partial data', () => {
    const partialData = {
      reading: {
        header: 'Partial Reading',
        // cards_reading is missing
        reading: 'Some reading text',
        // suggestions is missing
        next_questions: ['A question']
        // final_summary and disclaimer are missing
      },
      success: true
    }

    const result = adaptReadingData(partialData)
    expect(result).toEqual({
      header: 'Partial Reading',
      reading: 'Some reading text',
      next_questions: ['A question']
    })
  })
})