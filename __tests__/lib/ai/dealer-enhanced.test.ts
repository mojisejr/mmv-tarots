// Enhanced Dealer Agent Tests (3-Agent Pipeline)
// Phase 1: RED - Failing tests for enhanced Dealer with Guardian context

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dealerAgent } from '@/lib/ai/agents/dealer'
import type { GuardianResponse } from '@/lib/ai/agents/guardian'

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn()
}))

const { generateText } = vi.mocked(await import('ai'))

describe('Enhanced Dealer Agent (3-Agent Pipeline)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Enhanced Context-Aware Card Selection', () => {
    it('should select cards based on Guardian mood and topic analysis', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'hopeful',
        topic: 'career',
        period: 'near_future',
        context: 'Career change question seeking guidance'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [1, 7, 16],
          reasoning: 'The Magician for new skills, The Chariot for career progress, The Tower for transformative change',
          theme: 'transformation',
          confidence: 0.85
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('Should I change my career?', guardianContext)

      expect(result.selectedCards).toEqual([1, 7, 16])
      expect(result.theme).toBe('transformation')
      expect(result.confidence).toBe(0.85)
      expect(result.reasoning).toContain('The Magician')

      expect(generateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        system: expect.stringContaining('Enhanced Dealer Agent'),
        prompt: expect.stringContaining('career') && expect.stringContaining('hopeful') && expect.stringContaining('near_future'),
        temperature: 0.7
      })
    })

    it('should adapt card selection for love questions', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'confused',
        topic: 'love',
        period: 'present',
        context: 'Relationship uncertainty'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [6, 14, 17],
          reasoning: 'The Lovers for relationships, Temperance for balance, The Star for hope',
          theme: 'emotional_balance',
          confidence: 0.78
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('Will I find true love?', guardianContext)

      expect(result.selectedCards).toEqual([6, 14, 17])
      expect(result.theme).toBe('emotional_balance')
      expect(result.reasoning).toContain('The Lovers')
    })

    it('should consider time period in card selection', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'concerned',
        topic: 'health',
        period: 'distant_future',
        context: 'Long-term health planning'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [8, 12, 21],
          reasoning: 'Strength for endurance, Death for transformation, The World for completion',
          theme: 'healing_journey',
          confidence: 0.82
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('How can I improve my long-term health?', guardianContext)

      expect(result.selectedCards).toEqual([8, 12, 21])
      expect(result.theme).toBe('healing_journey')
      expect(result.confidence).toBe(0.82)
    })
  })

  describe('Card Uniqueness and Validation', () => {
    it('should ensure selected cards are unique', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General guidance'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [0, 3, 9],
          reasoning: 'Three distinct cards for comprehensive reading',
          theme: 'general_guidance',
          confidence: 0.75
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('What should I know?', guardianContext)

      const uniqueCards = [...new Set(result.selectedCards)]
      expect(uniqueCards).toHaveLength(3)
      expect(result.selectedCards).toEqual([0, 3, 9])
    })

    it('should validate card numbers are within valid range (0-21)', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'curious',
        topic: 'general',
        period: 'near_future',
        context: 'Future guidance'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [5, 11, 20],
          reasoning: 'Hierophant for tradition, Justice for balance, Judgement for clarity',
          theme: 'spiritual_guidance',
          confidence: 0.80
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('What spiritual guidance do I need?', guardianContext)

      result.selectedCards.forEach(card => {
        expect(card).toBeGreaterThanOrEqual(0)
        expect(card).toBeLessThanOrEqual(21)
      })
    })
  })

  describe('Enhanced Confidence Scoring', () => {
    it('should provide confidence score based on context clarity', async () => {
      const clearContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'ambitious',
        topic: 'career',
        period: 'near_future',
        context: 'Clear career advancement goal with specific timeframe'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [1, 7, 10],
          reasoning: 'Very clear context enables precise card selection',
          theme: 'career_success',
          confidence: 0.92
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('How can I get promoted within 6 months?', clearContext)

      expect(result.confidence).toBeGreaterThan(0.90)
      expect(result.theme).toBe('career_success')
    })

    it('should have lower confidence for ambiguous questions', async () => {
      const ambiguousContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'confused',
        topic: 'general',
        period: 'present',
        context: 'Vague question unclear intentions'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [2, 4, 18],
          reasoning: 'Ambiguous context requires general card selection',
          theme: 'general_clarity',
          confidence: 0.65
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('What should I do?', ambiguousContext)

      expect(result.confidence).toBeLessThan(0.70)
      expect(result.theme).toBe('general_clarity')
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle API failures with fallback card selection', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General question'
      }

      generateText.mockRejectedValue(new Error('API Error'))

      const result = await dealerAgent('Test question', guardianContext)

      // Should provide fallback without crashing
      expect(result.selectedCards).toHaveLength(3)
      expect(result.theme).toBe('general_guidance')
      expect(result.confidence).toBe(0.5)

      // Ensure fallback cards are unique and valid
      const uniqueCards = [...new Set(result.selectedCards)]
      expect(uniqueCards).toHaveLength(3)
      result.selectedCards.forEach(card => {
        expect(card).toBeGreaterThanOrEqual(0)
        expect(card).toBeLessThanOrEqual(21)
      })
    })

    it('should handle malformed JSON responses', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General question'
      }

      generateText.mockResolvedValue({
        text: 'invalid json response'
      })

      const result = await dealerAgent('Test question', guardianContext)

      // Should provide fallback response
      expect(result.selectedCards).toHaveLength(3)
      expect(result.theme).toBe('general_guidance')
    })

    it('should handle missing response fields', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General question'
      }

      generateText.mockResolvedValue({
        text: JSON.stringify({
          selectedCards: [1, 2, 3]
          // Missing theme, confidence, reasoning
        })
      })

      const result = await dealerAgent('Test question', guardianContext)

      // Should provide fallback cards (random, so just check length and validity)
      expect(result.selectedCards).toHaveLength(3)
      result.selectedCards.forEach(card => {
        expect(card).toBeGreaterThanOrEqual(0)
        expect(card).toBeLessThanOrEqual(21)
      })
      expect(result.theme).toBe('general_guidance')
      expect(result.confidence).toBe(0.5)
      expect(result.reasoning).toBe('Standard card selection for general guidance')
    })
  })

  describe('Response Structure Validation', () => {
    it('should validate complete response structure', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'curious',
        topic: 'general',
        period: 'near_future',
        context: 'Curiosity about future'
      }

      const mockResponse = {
        text: JSON.stringify({
          selectedCards: [0, 7, 13],
          reasoning: 'Complete response with all required fields',
          theme: 'curiosity_exploration',
          confidence: 0.77
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await dealerAgent('What adventures await me?', guardianContext)

      // Validate structure
      expect(Array.isArray(result.selectedCards)).toBe(true)
      expect(result.selectedCards).toHaveLength(3)
      expect(typeof result.reasoning).toBe('string')
      expect(typeof result.theme).toBe('string')
      expect(typeof result.confidence).toBe('number')

      // Validate confidence range
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })
})