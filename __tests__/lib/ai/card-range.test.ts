import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dealerAgent } from '@/lib/server/ai/agents/dealer'
import { mysticAgent } from '@/lib/server/ai/agents/mystic'
import type { AnalystResponse } from '@/lib/server/ai/agents/analyst'
import { db } from '@/lib/server/db'

// Mock database
vi.mock('@/lib/server/db', () => ({
  db: {
    card: {
      findMany: vi.fn()
    }
  }
}))

describe('78-Card Range Integration Tests', () => {
  const mockAnalystResponse: AnalystResponse = {
    mood: 'neutral',
    topic: 'general',
    period: 'present',
    context: 'General question seeking guidance',
    card_count_recommendation: 5
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Full Deck Access Validation', () => {
    it('should allow access to all Major Arcana (0-21)', async () => {
      // Create mock data for Major Arcana only
      const majorArcanaCards = Array.from({ length: 22 }, (_, i) => ({
        cardId: i,
        name: `Major Arcana ${i}`,
        arcana: 'Major',
        nameTh: `ไพ่ใหญ่ ${i}`,
        keywords: [`keyword${i}`],
        meaningUp: `Up meaning ${i}`,
        meaningRev: `Rev meaning ${i}`,
        imageUrl: `cards/major/${i}.jpg`
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(majorArcanaCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(5)

      // All selected cards should be Major Arcana
      result.selectedCards?.forEach(cardId => {
        expect(cardId).toBeGreaterThanOrEqual(0)
        expect(cardId).toBeLessThanOrEqual(21)
      })
    })

    it('should allow access to Minor Arcana (22-77)', async () => {
      // Create mock data for Minor Arcana only
      const minorArcanaCards = Array.from({ length: 56 }, (_, i) => {
        const cardId = i + 22
        return {
          cardId,
          name: `Minor Arcana ${cardId}`,
          arcana: 'Minor',
          nameTh: `ไพ่เล็ก ${cardId}`,
          keywords: [`keyword${cardId}`],
          meaningUp: `Up meaning ${cardId}`,
          meaningRev: `Rev meaning ${cardId}`,
          imageUrl: `cards/minor/${cardId}.jpg`
        }
      })

      vi.mocked(db.card.findMany).mockResolvedValue(minorArcanaCards as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(5)

      // All selected cards should be Minor Arcana
      result.selectedCards?.forEach(cardId => {
        expect(cardId).toBeGreaterThanOrEqual(22)
        expect(cardId).toBeLessThanOrEqual(77)
      })
    })

    it('should allow access to complete 78-card deck', async () => {
      // Create mock data for complete tarot deck
      const completeDeck = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor',
        nameTh: `ไพ่ ${i}`,
        keywords: [`keyword${i}`],
        meaningUp: `Up meaning ${i}`,
        meaningRev: `Rev meaning ${i}`,
        imageUrl: `cards/${i < 22 ? 'major' : 'minor'}/${i}.jpg`
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(completeDeck as any)

      const result = await dealerAgent('Test question', mockAnalystResponse)

      expect(result.success).toBe(true)
      expect(result.selectedCards).toHaveLength(5)

      // Cards should span the full 0-77 range
      result.selectedCards?.forEach(cardId => {
        expect(cardId).toBeGreaterThanOrEqual(0)
        expect(cardId).toBeLessThanOrEqual(77)
      })

      // Verify we're not limited to the old 22-card range
      const hasMinorArcana = result.selectedCards!.some(cardId => cardId >= 22)
      expect(hasMinorArcana).toBe(true)
    })

    it('should provide mixed Major and Minor Arcana readings', async () => {
      // Create mock data for complete deck
      const completeDeck = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor',
        nameTh: `ไพ่ ${i}`,
        keywords: [`keyword${i}`],
        meaningUp: `Up meaning ${i}`,
        meaningRev: `Rev meaning ${i}`,
        imageUrl: `cards/${i < 22 ? 'major' : 'minor'}/${i}.jpg`
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(completeDeck as any)

      // Test multiple iterations to get varied results
      const selections: number[][] = []

      for (let i = 0; i < 10; i++) {
        const result = await dealerAgent(`Test question ${i}`, mockAnalystResponse)
        expect(result.success).toBe(true)
        selections.push(result.selectedCards!)
      }

      // At least some selections should include Minor Arcana
      const hasMinorArcanaInAnySelection = selections.some(selectedCards =>
        selectedCards.some(cardId => cardId >= 22)
      )
      expect(hasMinorArcanaInAnySelection).toBe(true)
    })
  })

  describe('Integration with Mystic Agent', () => {
    it('should generate readings with Minor Arcana cards', async () => {
      const mockCardMetadata = [
        {
          cardId: 45, // Minor Arcana
          name: 'Seven of Cups',
          nameTh: 'ไพ่ถ้วยเจ็ดใบ',
          arcana: 'Minor',
          keywords: ['choices', 'illusions'],
          meaningUp: 'Many choices',
          meaningRev: 'Illusions',
          imageUrl: 'cards/cups/45.jpg'
        },
        {
          cardId: 56, // Minor Arcana
          name: 'Knight of Wands',
          nameTh: 'ไพ่อัศวินไม้เท้า',
          arcana: 'Minor',
          keywords: ['action', 'adventure'],
          meaningUp: 'Dynamic action',
          meaningRev: 'Impulsiveness',
          imageUrl: 'cards/wands/56.jpg'
        },
        {
          cardId: 67, // Minor Arcana
          name: 'Four of Pentacles',
          nameTh: 'ไพ่เหรียญสี่ใบ',
          arcana: 'Minor',
          keywords: ['security', 'stability'],
          meaningUp: 'Security',
          meaningRev: 'Stinginess',
          imageUrl: 'cards/pentacles/67.jpg'
        }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCardMetadata as any)

      const result = await mysticAgent(
        'What choices should I make?',
        mockAnalystResponse,
        [45, 56, 67]
      )

      expect(result.success).toBe(true)
      expect(result.reading.cards_reading).toHaveLength(3)

      // All cards should be Minor Arcana
      const minorArcanaCount = result.reading.cards_reading.filter(
        card => card.arcana === 'Minor'
      ).length
      expect(minorArcanaCount).toBe(3)

      // Should use Thai names from database
      const thaiNames = result.reading.cards_reading.map(card => card.name_th)
      expect(thaiNames).toContain('ไพ่ถ้วยเจ็ดใบ')
      expect(thaiNames).toContain('ไพ่อัศวินไม้เท้า')
      expect(thaiNames).toContain('ไพ่เหรียญสี่ใบ')
    })

    it('should handle mixed Major and Minor Arcana readings', async () => {
      const mockCardMetadata = [
        {
          cardId: 0, // Major Arcana
          name: 'The Fool',
          nameTh: 'คนโง่เผลอ',
          arcana: 'Major',
          keywords: ['beginning'],
          meaningUp: 'New beginning',
          meaningRev: 'Foolish risk',
          imageUrl: 'cards/major/0.jpg'
        },
        {
          cardId: 45, // Minor Arcana
          name: 'Seven of Cups',
          nameTh: 'ไพ่ถ้วยเจ็ดใบ',
          arcana: 'Minor',
          keywords: ['choices'],
          meaningUp: 'Many choices',
          meaningRev: 'Illusions',
          imageUrl: 'cards/cups/45.jpg'
        },
        {
          cardId: 69, // Minor Arcana
          name: 'Six of Swords',
          nameTh: 'ไพ่ดาบหกใบ',
          arcana: 'Minor',
          keywords: ['transition'],
          meaningUp: 'Transition',
          meaningRev: 'Difficult transition',
          imageUrl: 'cards/swords/69.jpg'
        }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCardMetadata as any)

      const result = await mysticAgent(
        'Should I start a new journey?',
        mockAnalystResponse,
        [0, 45, 69]
      )

      expect(result.success).toBe(true)
      expect(result.reading.cards_reading).toHaveLength(3)

      const cards = result.reading.cards_reading
      const majorArcana = cards.filter(card => card.arcana === 'Major')
      const minorArcana = cards.filter(card => card.arcana === 'Minor')

      expect(majorArcana).toHaveLength(1)
      expect(minorArcana).toHaveLength(2)
    })
  })

  describe('Range Validation', () => {
    it('should validate card IDs are within 0-77 range', async () => {
      // Mock database with complete deck
      const completeDeck = Array.from({ length: 78 }, (_, i) => ({
        cardId: i,
        name: `Card ${i}`,
        arcana: i < 22 ? 'Major' : 'Minor'
      }))

      vi.mocked(db.card.findMany).mockResolvedValue(completeDeck as any)

      // Run multiple tests to validate range
      for (let i = 0; i < 20; i++) {
        const result = await dealerAgent(`Test ${i}`, mockAnalystResponse)
        expect(result.success).toBe(true)

        result.selectedCards?.forEach(cardId => {
          expect(cardId).toBeGreaterThanOrEqual(0)
          expect(cardId).toBeLessThanOrEqual(77)
        })
      }
    })

    it('should not be limited to the old 22-card range', async () => {
      // Create a deck that specifically tests we can access Minor Arcana
      const deckWithMinorArcana = [
        // Include some Major Arcana
        { cardId: 0, name: 'The Fool', arcana: 'Major' },
        { cardId: 1, name: 'The Magician', arcana: 'Major' },
        { cardId: 2, name: 'The High Priestess', arcana: 'Major' },
        // Include Minor Arcana cards
        { cardId: 45, name: 'Seven of Cups', arcana: 'Minor' },
        { cardId: 56, name: 'Knight of Wands', arcana: 'Minor' },
        { cardId: 67, name: 'Four of Pentacles', arcana: 'Minor' },
        { cardId: 69, name: 'Six of Swords', arcana: 'Minor' },
        { cardId: 77, name: 'King of Pentacles', arcana: 'Minor' }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(deckWithMinorArcana as any)

      // Run multiple iterations
      let hasMinorArcana = false
      let maxCardId = 0

      for (let i = 0; i < 50; i++) {
        const result = await dealerAgent(`Test ${i}`, mockAnalystResponse)
        expect(result.success).toBe(true)

        result.selectedCards?.forEach(cardId => {
          if (cardId >= 22) hasMinorArcana = true
          if (cardId > maxCardId) maxCardId = cardId
        })
      }

      expect(hasMinorArcana).toBe(true)
      expect(maxCardId).toBeGreaterThan(21)
    })
  })
})