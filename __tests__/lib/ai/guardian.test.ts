// Guardian Agent Tests (3-Agent Pipeline)
// Phase 1: RED - Failing tests for combined Gatekeeper+Analyst functionality

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { guardianAgent } from '@/lib/server/ai/agents/guardian'

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn()
}))

const { generateText } = vi.mocked(await import('ai'))

describe('Guardian Agent (Combined Gatekeeper + Analyst)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Question Validation (Gatekeeper functionality)', () => {
    it('should approve valid tarot questions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'hopeful',
          topic: 'career',
          period: 'near_future',
          context: 'Career change question seeking guidance'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('Should I change my career this year?')

      expect(result.approved).toBe(true)
      expect(result.mood).toBe('hopeful')
      expect(result.topic).toBe('career')
      expect(result.period).toBe('near_future')
      expect(result.context).toContain('Career change')
      expect(generateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        system: expect.stringContaining('Guardian Agent'),
        prompt: expect.stringContaining('Should I change my career this year?'),
        temperature: 0.4
      })
    })

    it('should reject inappropriate questions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: false,
          reason: 'Question involves harmful content',
          mood: 'concerned',
          topic: 'harmful',
          period: 'present',
          context: 'Inappropriate question detected'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('How can I harm someone?')

      expect(result.approved).toBe(false)
      expect(result.reason).toBe('Question involves harmful content')
      expect(result.mood).toBe('concerned')
      expect(result.topic).toBe('harmful')
    })

    it('should handle Thai questions properly', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'confused',
          topic: 'love',
          period: 'present',
          context: 'คำถามภาษาไทยเกี่ยวกับเรื่องความรัก'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('ฉันจะเจอรักแท้ไหม')

      expect(result.approved).toBe(true)
      expect(result.mood).toBe('confused')
      expect(result.topic).toBe('love')
      expect(result.context).toContain('คำถามภาษาไทย')
    })
  })

  describe('Context Analysis (Analyst functionality)', () => {
    it('should analyze career questions with proper context', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'ambitious',
          topic: 'career',
          period: 'near_future',
          context: 'Career progression question with ambitious tone'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('What career opportunities should I pursue?')

      expect(result.mood).toBe('ambitious')
      expect(result.topic).toBe('career')
      expect(result.period).toBe('near_future')
      expect(result.context).toContain('Career progression')
    })

    it('should analyze love questions with emotional context', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'hopeful',
          topic: 'love',
          period: 'present',
          context: 'Relationship question seeking guidance'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('Will I find my soulmate?')

      expect(result.mood).toBe('hopeful')
      expect(result.topic).toBe('love')
      expect(result.period).toBe('present')
      expect(result.context).toContain('Relationship')
    })

    it('should analyze health questions with concerned tone', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'concerned',
          topic: 'health',
          period: 'present',
          context: 'Health concern seeking guidance'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('How can I improve my well-being?')

      expect(result.mood).toBe('concerned')
      expect(result.topic).toBe('health')
      expect(result.period).toBe('present')
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should provide fallback for API failures', async () => {
      generateText.mockRejectedValue(new Error('API Error'))

      const result = await guardianAgent('Test question')

      // Should not crash and provide safe defaults
      expect(result.approved).toBe(true) // Fallback approval
      expect(result.mood).toBe('neutral')
      expect(result.topic).toBe('general')
      expect(result.period).toBe('present')
      expect(result.context).toBe('General question seeking guidance')
    })

    it('should handle malformed JSON responses', async () => {
      generateText.mockResolvedValue({
        text: 'invalid json response'
      })

      const result = await guardianAgent('Test question')

      // Should provide fallback response
      expect(result.approved).toBe(true)
      expect(result.mood).toBe('neutral')
    })

    it('should handle missing required fields in response', async () => {
      generateText.mockResolvedValue({
        text: JSON.stringify({
          approved: true,
          reason: null
          // Missing other fields
        })
      })

      const result = await guardianAgent('Test question')

      // Should provide defaults for missing fields
      expect(result.mood).toBe('neutral')
      expect(result.topic).toBe('general')
      expect(result.period).toBe('present')
      expect(result.context).toBe('General question seeking guidance')
    })
  })

  describe('Response Structure Validation', () => {
    it('should validate complete response structure', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'curious',
          topic: 'general',
          period: 'near_future',
          context: 'General guidance question'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('What does the future hold?')

      // Validate all required fields exist and have correct types
      expect(typeof result.approved).toBe('boolean')
      expect(result.reason === null || typeof result.reason === 'string').toBe(true)
      expect(typeof result.mood).toBe('string')
      expect(typeof result.topic).toBe('string')
      expect(typeof result.period).toBe('string')
      expect(typeof result.context).toBe('string')

      // Validate mood enum values
      expect(['hopeful', 'confused', 'concerned', 'ambitious', 'neutral', 'curious']).toContain(result.mood)

      // Validate topic enum values
      expect(['love', 'career', 'health', 'general', 'harmful']).toContain(result.topic)

      // Validate period enum values
      expect(['past', 'present', 'near_future', 'distant_future']).toContain(result.period)
    })

    it('should handle empty or null reason field properly', async () => {
      const mockResponse = {
        text: JSON.stringify({
          approved: true,
          reason: null,
          mood: 'neutral',
          topic: 'general',
          period: 'present',
          context: 'Simple question'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await guardianAgent('Simple question')

      expect(result.approved).toBe(true)
      expect(result.reason).toBe(null)
    })
  })
})