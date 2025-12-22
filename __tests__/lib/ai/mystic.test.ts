import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mysticAgent } from '@/lib/server/ai/agents/mystic'
import type { AnalystResponse } from '@/lib/server/ai/agents/analyst'
import type { DealerResponse } from '@/lib/server/ai/agents/dealer'
import { db } from '@/lib/server/db'

// Mock database
vi.mock('@/lib/server/db', () => ({
  db: {
    card: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('mysticAgent Database Integration', () => {
  const mockAnalystResponse: AnalystResponse = {
    mood: 'neutral',
    topic: 'general',
    period: 'present',
    context: 'General question seeking guidance',
    card_count_recommendation: 3
  }

  const mockDealerResponse: DealerResponse = {
    success: true,
    selectedCards: [0, 15, 69], // Include Minor Arcana card (69)
    reasoning: 'Cards selected based on question context'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Database Metadata Integration', () => {
    it('should query database for card metadata including Thai names', async () => {
      const mockCardMetadata = [
        {
          cardId: 0,
          name: 'The Fool',
          nameTh: 'คนโง่เผลอ',
          arcana: 'Major',
          keywords: ['beginning', 'innovation', 'spontaneity'],
          meaningUp: 'New beginnings',
          meaningRev: 'Foolish risks'
        },
        {
          cardId: 15,
          name: 'The Devil',
          nameTh: 'ไพ่ซาตาน',
          arcana: 'Major',
          keywords: ['bondage', 'materialism', 'addiction'],
          meaningUp: 'Restrictions',
          meaningRev: 'Breaking free'
        },
        {
          cardId: 69,
          name: 'Six of Swords',
          nameTh: 'ไพ่ดาบหกใบ',
          arcana: 'Minor',
          keywords: ['transition', 'journey', 'recovery'],
          meaningUp: 'Smooth transition',
          meaningRev: 'Difficult journey'
        }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCardMetadata as any)

      const result = await mysticAgent(
        'Should I change my career?',
        mockAnalystResponse,
        mockDealerResponse.selectedCards!
      )

      expect(db.card.findMany).toHaveBeenCalledWith({
        where: {
          cardId: {
            in: [0, 15, 69]
          }
        },
        select: {
          cardId: true,
          name: true,
          nameTh: true,
          arcana: true,
          keywords: true,
          meaningUp: true,
          meaningRev: true,
          imageUrl: true
        }
      })

      expect(result.success).toBe(true)
      expect(result.reading.cards_reading).toHaveLength(3)
    })

    it('should use Thai names from database instead of hardcoded CARD_NAMES', async () => {
      const mockCardMetadata = [
        {
          cardId: 0,
          name: 'The Fool',
          nameTh: 'คนโง่เผลอ',
          arcana: 'Major',
          keywords: ['beginning'],
          meaningUp: 'New beginning',
          meaningRev: 'Recklessness',
          imageUrl: 'cards/major/0.jpg'
        },
        {
          cardId: 1,
          name: 'The Magician',
          nameTh: 'นักมายากล',
          arcana: 'Major',
          keywords: ['manifestation'],
          meaningUp: 'Power to manifest',
          meaningRev: 'Manipulation',
          imageUrl: 'cards/major/1.jpg'
        },
        {
          cardId: 2,
          name: 'The High Priestess',
          nameTh: 'นางพรหมจารี',
          arcana: 'Major',
          keywords: ['intuition'],
          meaningUp: 'Intuition',
          meaningRev: 'Secrets',
          imageUrl: 'cards/major/2.jpg'
        }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCardMetadata as any)

      const result = await mysticAgent(
        'Will I find true love?',
        mockAnalystResponse,
        [0, 1, 2]
      )

      expect(result.success).toBe(true)
      expect(result.reading.cards_reading).toHaveLength(3)

      // Verify Thai names from database are used
      const thaiNames = result.reading.cards_reading.map(card => card.name_th)
      expect(thaiNames).toContain('คนโง่เผลอ')
      expect(thaiNames).toContain('นักมายากล')
      expect(thaiNames).toContain('นางพรหมจารี')
    })

    it('should handle Minor Arcana cards from database', async () => {
      const mockCardMetadata = [
        {
          cardId: 45,
          name: 'Seven of Cups',
          nameTh: 'ไพ่ถ้วยเจ็ดใบ',
          arcana: 'Minor',
          keywords: ['choices', 'illusions'],
          meaningUp: 'Many choices',
          meaningRev: 'Illusions',
          imageUrl: 'cards/cups/45.jpg'
        },
        {
          cardId: 56,
          name: 'Knight of Wands',
          nameTh: 'ไพ่อัศวินไม้เท้า',
          arcana: 'Minor',
          keywords: ['action', 'adventure'],
          meaningUp: 'Dynamic action',
          meaningRev: 'Impulsiveness',
          imageUrl: 'cards/wands/56.jpg'
        },
        {
          cardId: 67,
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
        'How can I improve my finances?',
        mockAnalystResponse,
        [45, 56, 67]
      )

      expect(result.success).toBe(true)

      // Verify Minor Arcana cards are properly handled
      const minorArcanaCards = result.reading.cards_reading.filter(
        card => card.arcana === 'Minor'
      )
      expect(minorArcanaCards).toHaveLength(3)

      // Verify Thai names for Minor Arcana
      const thaiNames = result.reading.cards_reading.map(card => card.name_th)
      expect(thaiNames).toContain('ไพ่ถ้วยเจ็ดใบ')
      expect(thaiNames).toContain('ไพ่อัศวินไม้เท้า')
      expect(thaiNames).toContain('ไพ่เหรียญสี่ใบ')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.card.findMany).mockRejectedValue(new Error('Database connection failed'))

      const result = await mysticAgent(
        'Test question',
        mockAnalystResponse,
        [0, 1, 2]
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to generate reading: Database connection failed')
    })

    it('should handle missing card metadata gracefully', async () => {
      vi.mocked(db.card.findMany).mockResolvedValue([])

      const result = await mysticAgent(
        'Test question',
        mockAnalystResponse,
        [0, 1, 2]
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card metadata not found in database')
    })
  })

  describe('Complete Reading Structure', () => {
    it('should generate complete Thai reading with database metadata', async () => {
      const mockCardMetadata = [
        {
          cardId: 0,
          name: 'The Fool',
          nameTh: 'คนโง่เผลอ',
          arcana: 'Major',
          keywords: ['beginning', 'new start'],
          meaningUp: 'New beginning',
          meaningRev: 'Foolish risk',
          imageUrl: 'cards/major/0.jpg'
        },
        {
          cardId: 15,
          name: 'The Devil',
          nameTh: 'ไพ่ซาตาน',
          arcana: 'Major',
          keywords: ['bondage', 'restriction'],
          meaningUp: 'Restrictions',
          meaningRev: 'Breaking free',
          imageUrl: 'cards/major/15.jpg'
        },
        {
          cardId: 21,
          name: 'The World',
          nameTh: 'ไพ่โลก',
          arcana: 'Major',
          keywords: ['completion', 'success'],
          meaningUp: 'Completion',
          meaningRev: 'Incompletion',
          imageUrl: 'cards/major/21.jpg'
        }
      ]

      vi.mocked(db.card.findMany).mockResolvedValue(mockCardMetadata as any)

      const result = await mysticAgent(
        'Will I succeed in my business?',
        mockAnalystResponse,
        [0, 15, 21]
      )

      expect(result.success).toBe(true)
      expect(result.reading).toBeDefined()

      const { reading } = result
      expect(reading.header).toBeDefined()
      expect(reading.reading).toBeDefined()
      expect(reading.disclaimer).toBeDefined()
      expect(reading.suggestions).toBeDefined()
      expect(reading.cards_reading).toHaveLength(3)
      expect(reading.final_summary).toBeDefined()
      expect(reading.next_questions).toBeDefined()

      // Verify card structure includes database metadata
      reading.cards_reading.forEach(card => {
        expect(card).toHaveProperty('name_en')
        expect(card).toHaveProperty('name_th')
        expect(card).toHaveProperty('arcana')
        expect(card).toHaveProperty('keywords')
        expect(card).toHaveProperty('interpretation')
        expect(card).toHaveProperty('position')
        expect(card).toHaveProperty('image')
      })
    })
  })
})