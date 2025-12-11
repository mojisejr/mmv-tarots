// Phase 4: Mock Data Generation Tests
// RED Phase - These tests should FAIL initially

import { describe, it, expect } from 'vitest'
import {
  generateMockTarotReading,
  generatePartialReading,
  generateErrorScenarios,
  getRandomTarotCards
} from '../../lib/mock-data'

describe('Mock Tarot Data Generator', () => {
  describe('generateMockTarotReading', () => {
    it('should generate complete reading with all required fields', () => {
      const reading = generateMockTarotReading({
        question: 'Should I change my career?',
        numCards: 3
      })

      expect(reading).toHaveProperty('header')
      expect(reading).toHaveProperty('cards_reading')
      expect(reading).toHaveProperty('reading')
      expect(reading).toHaveProperty('suggestions')
      expect(reading).toHaveProperty('next_questions')
      expect(reading).toHaveProperty('final_summary')
      expect(reading).toHaveProperty('disclaimer')
    })

    it('should generate correct number of cards', () => {
      const reading3 = generateMockTarotReading({ question: 'Test', numCards: 3 })
      const reading4 = generateMockTarotReading({ question: 'Test', numCards: 4 })
      const reading5 = generateMockTarotReading({ question: 'Test', numCards: 5 })

      expect(reading3.cards_reading).toHaveLength(3)
      expect(reading4.cards_reading).toHaveLength(4)
      expect(reading5.cards_reading).toHaveLength(5)
    })

    it('should generate realistic card interpretations', () => {
      const reading = generateMockTarotReading({
        question: 'Will I find love this year?',
        numCards: 3
      })

      reading.cards_reading.forEach((card, index) => {
        expect(card).toHaveProperty('position')
        expect(card).toHaveProperty('name_en')
        expect(card).toHaveProperty('name_th')
        expect(card).toHaveProperty('image')
        expect(card).toHaveProperty('keywords')
        expect(card).toHaveProperty('interpretation')

        expect(card.keywords).toBeInstanceOf(Array)
        expect(card.interpretation).toBeTypeOf('string')
        expect(card.interpretation.length).toBeGreaterThan(20)
      })
    })

    it('should generate contextual responses based on question type', () => {
      const careerReading = generateMockTarotReading({
        question: 'Should I change my job?',
        numCards: 3
      })

      const loveReading = generateMockTarotReading({
        question: 'Will I find my soulmate?',
        numCards: 3
      })

      // Headers should be different based on question type
      expect(careerReading.header).toContain('อาชีพ')
      expect(loveReading.header).toContain('รัก')

      // Main reading should be contextual
      expect(careerReading.reading).toContain('อาชีพ')
      expect(loveReading.reading).toContain('รัก')
    })

    it('should generate Thai language responses', () => {
      const reading = generateMockTarotReading({
        question: 'อนาคตของฉันจะเป็นอย่างไร?',
        numCards: 3
      })

      expect(reading.header).toMatch(/[\u0E00-\u0E7F]/) // Thai characters
      expect(reading.reading).toMatch(/[\u0E00-\u0E7F]/)
      expect(reading.suggestions.some(s => s.match(/[\u0E00-\u0E7F]/))).toBe(true)
    })
  })

  describe('generatePartialReading', () => {
    it('should generate partial reading for incomplete job', () => {
      const partial = generatePartialReading({
        status: 'PROCESSING',
        step: 'ANALYSIS_COMPLETE'
      })

      expect(partial.status).toBe('PROCESSING')
      expect(partial.step).toBe('ANALYSIS_COMPLETE')
      expect(partial.cards_selected).toBeDefined()
      expect(partial.reading).toBeUndefined()
    })

    it('should generate PENDING status without cards', () => {
      const partial = generatePartialReading({
        status: 'PENDING',
        step: 'GATEKEEPER_ANALYSIS'
      })

      expect(partial.status).toBe('PENDING')
      expect(partial.step).toBe('GATEKEEPER_ANALYSIS')
      expect(partial.cards_selected).toBeUndefined()
    })

    it('should generate failed status with error', () => {
      const partial = generatePartialReading({
        status: 'FAILED',
        step: 'AI_SERVICE_ERROR'
      })

      expect(partial.status).toBe('FAILED')
      expect(partial.step).toBe('AI_SERVICE_ERROR')
      expect(partial.error).toBeDefined()
    })
  })

  describe('generateErrorScenarios', () => {
    it('should generate various error scenarios', () => {
      const errorScenarios = generateErrorScenarios()

      expect(errorScenarios).toHaveProperty('INVALID_QUESTION')
      expect(errorScenarios).toHaveProperty('CARDS_NOT_FOUND')
      expect(errorScenarios).toHaveProperty('AI_SERVICE_ERROR')
      expect(errorScenarios).toHaveProperty('NETWORK_ERROR')
      expect(errorScenarios).toHaveProperty('TIMEOUT_ERROR')
    })

    it('should have proper error messages in Thai', () => {
      const errors = generateErrorScenarios()

      Object.values(errors).forEach(error => {
        expect(error.error).toMatch(/[\u0E00-\u0E7F]/) // Thai characters
        expect(error.error.length).toBeGreaterThan(10)
      })
    })
  })

  describe('getRandomTarotCards', () => {
    it('should return requested number of unique cards', () => {
      const cards3 = getRandomTarotCards(3)
      const cards5 = getRandomTarotCards(5)

      expect(cards3).toHaveLength(3)
      expect(cards5).toHaveLength(5)

      // Check for uniqueness
      const cardIds3 = cards3.map(c => c.id)
      const cardIds5 = cards5.map(c => c.id)

      expect(new Set(cardIds3)).toHaveLength(3)
      expect(new Set(cardIds5)).toHaveLength(5)
    })

    it('should have all required card properties', () => {
      const cards = getRandomTarotCards(1)
      const card = cards[0]

      expect(card).toHaveProperty('id')
      expect(card).toHaveProperty('name')
      expect(card).toHaveProperty('displayName')
      expect(card).toHaveProperty('arcana')
      expect(card).toHaveProperty('keywords')
      expect(card).toHaveProperty('imageUrl')

      expect(typeof card.id).toBe('number')
      expect(typeof card.name).toBe('string')
      expect(typeof card.displayName).toBe('string')
      expect(['Major', 'Minor']).toContain(card.arcana)
      expect(Array.isArray(card.keywords)).toBe(true)
      expect(typeof card.imageUrl).toBe('string')
    })

    it('should use real tarot card IDs (0-77)', () => {
      const cards = getRandomTarotCards(10)

      cards.forEach(card => {
        expect(card.id).toBeGreaterThanOrEqual(0)
        expect(card.id).toBeLessThanOrEqual(77)
      })
    })
  })
})