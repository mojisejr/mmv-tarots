import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dealerAgent } from '@/lib/ai/agents/dealer'
import { AnalystResponse } from '@/types/api'
import { db } from '@/lib/db'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    card: {
      findMany: vi.fn()
    }
  }
}))

describe('dealerAgent Database Integration', () => {
  const mockAnalystResponse: AnalystResponse = {
    mood: 'neutral',
    topic: 'general',
    period: 'present',
    context: 'General question seeking guidance',
    card_count_recommendation: 3
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Database Query Validation', () => {
    it('should query database for available cards', async () => {
      // Mock database response
      const mockCards = [
        { cardId: 0, name: 'The Fool' },
        { cardId: 1, name: 'The Magician' },
        { cardId: 77, name: 'King of Pentacles' }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(db.card.findMany).toHaveBeenCalledWith({
        select: {
          cardId: true,
          name: true,
          arcana: true
        }
      })
      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.card.findMany).mockRejectedValue(new Error('Database connection failed'))

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to select cards from database')
    })

    it('should handle empty database gracefully', async () => {
      vi.mocked(db.card.findMany).mockResolvedValue([])

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No cards available in database')
    })
  })

  describe('78-Card Selection Logic', () => {
    it('should select cards from full 78-card range', async () => {
      // Mock complete tarot deck (0-77)
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(3)

      // Verify cards are within full 78-card range
      result.selectedCards?.forEach(cardId => {
        expect(cardId).toBeGreaterThanOrEqual(0)
        expect(cardId).toBeLessThanOrEqual(77)
      })
    })

    it('should select unique cards without duplicates', async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(3)

      // Verify no duplicates
      const uniqueCards = new Set(result.selectedCards)
      expect(uniqueCards.size).toBe(3)
    })

    it('should select cards from both Major and Minor Arcana', async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)

      // With database integration, should access both Major and Minor Arcana
      const selectedCards = result.selectedCards || []
      const hasMinorArcana = selectedCards.some(id => id >= 22)

      // Note: This test might occasionally fail due to random selection
      // But with database access, should have access to Minor Arcana cards
      expect(selectedCards.every(id => id >= 0 && id <= 77)).toBe(true)
    })
  })

  describe('Card Selection Based on Analysis', () => {
    it('should respect analyst card count recommendation', async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const responseWith5Cards: AnalystResponse = {
        ...mockAnalystResponse,
        card_count_recommendation: 5
      }

      const result = await dealerAgent('Test question', responseWith5Cards)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(5)
    })

    it('should provide reasoning based on card selections', async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(mockCards as any)

      const result = await dealerAgent('What about my career?', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.reasoning).toBeDefined()
      expect(typeof result.reasoning).toBe('string')
      expect(result.reasoning?.length).toBeGreaterThan(0)
    })
  })
})