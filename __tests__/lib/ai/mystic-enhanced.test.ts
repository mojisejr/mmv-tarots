// Enhanced Mystic Agent Tests (3-Agent Pipeline)
// Phase 1: RED - Failing tests for enhanced Mystic with Guardian context

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mysticAgent } from '@/lib/server/ai/agents/mystic'
import type { GuardianResponse } from '@/lib/server/ai/agents/guardian'

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn()
}))

const { generateText } = vi.mocked(await import('ai'))

describe('Enhanced Mystic Agent (3-Agent Pipeline)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Enhanced Context-Aware Reading Generation', () => {
    it('should generate readings based on Guardian mood and topic analysis', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'hopeful',
        topic: 'career',
        period: 'near_future',
        context: 'Career change question seeking guidance'
      }

      const selectedCards = [1, 7, 16]

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีครับ มาดูไพ่เรื่องอาชีพกันครับ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ไพ่เมจิชเจียนบ่งบอกถึงทักษะใหม่ๆ ที่คุณต้องพัฒนา'
            },
            {
              position: 2,
              interpretation: 'ไพ่รถม้าบ่งบอกถึงความก้าวหน้าในอาชีพ'
            },
            {
              position: 3,
              interpretation: 'ไพ่หอคอยบ่งบอกถึงการเปลี่ยนแปลงครั้งใหญ่'
            }
          ],
          reading: 'จากการดูไพ่ทั้ง 3 ใบ พบว่าคุณมีโอกาสดีในการเปลี่ยนอาชีพ ไพ่เมจิชเจียนบอกว่าคุณมีพรสวรรค์ใหม่ๆ ที่จะพัฒนา ส่วนไพ่รถม้าชี้ว่าคุณจะประสบความสำเร็จ และไพ่หอคอยบอกว่าการเปลี่ยนแปลงนี้จะทำให้ชีวิตคุณดีขึ้น',
          suggestions: ['พัฒนาทักษะใหม่', 'กล้าเสี่ยงโอกาส', 'วางแผนอย่างระมัดระวัง'],
          next_questions: ['ทักษะใดที่คุณถนัดที่สุด?', 'โอกาสที่ดีที่สุดคืออะไร?'],
          final_summary: 'การเปลี่ยนอาชีพในช่วงนี้เป็นทางที่ถูกต้อง โชคช่วยพร้อมเสมอ',
          disclaimer: 'การทำนายนี้เพื่อความบันเทิงเท่านั้น ควรใช้วิจารณญาณในการตัดสินใจ'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('Should I change my career?', guardianContext, selectedCards)

      expect(result.header).toContain('อาชีพ')
      expect(result.reading).toContain('เปลี่ยนอาชีพ')
      expect(result.suggestions).toContain('พัฒนาทักษะใหม่')
      expect(result.cards_reading).toHaveLength(3)

      expect(generateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        system: expect.stringContaining('Enhanced Mystic Agent'),
        prompt: expect.stringContaining('career') && expect.stringContaining('hopeful') && expect.stringContaining('near_future'),
        temperature: 0.8
      })
    })

    it('should adapt reading tone based on mood', async () => {
      const concernedContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'concerned',
        topic: 'health',
        period: 'present',
        context: 'Health concern seeking guidance'
      }

      const selectedCards = [8, 14, 17]

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีค่ะ มาดูไพ่เรื่องสุขภาพกันนะคะ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ไพ่ความแข็งแกร่งบ่งบอกถึงความทนทาน'
            },
            {
              position: 2,
              interpretation: 'ไพ่ความพอประมาณบ่งบอกถึงการดูแลสมดุล'
            },
            {
              position: 3,
              interpretation: 'ไพ่ดวงดาวบ่งบอกถึงความหวัง'
            }
          ],
          reading: 'จากไพ่ทั้ง 3 ใบ พบว่าสุขภาพของคุณจะดีขึ้น ไพ่ความแข็งแกร่งบอกว่าร่างกายมีความทนทาน ไพ่ความพอประมาณชี้ว่าต้องดูแลด้านอาหารการนอน และไพ่ดวงดาวบอกว่าจะมีความหวังในการรักษา',
          suggestions: ['ดูแลสุขภาพให้สมดุล', 'พักผ่อนให้เพียงพอ', 'ปรึกษาแพทย์เป็นประจำ'],
          next_questions: ['ด้านสุขภาพใดที่ต้องให้ความสำคัญที่สุด?', 'วิธีการดูแลตัวเองที่เหมาะสม?'],
          final_summary: 'การดูแลสุขภาพต้องทำอย่างต่อเนื่องและสม่ำเสมอ',
          disclaimer: 'ข้อมูลนี้ไม่ใช่คำแนะนำทางการแพทย์ ควรปรึกษาแพทย์ผู้เชี่ยวชาญ'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('How can I improve my health?', concernedContext, selectedCards)

      expect(result.header).toContain('สุขภาพ')
      expect(result.suggestions).toContain('ดูแลสุขภาพให้สมดุล')
      expect(result.disclaimer).toContain('ไม่ใช่คำแนะนำทางการแพทย์')
    })

    it('should adjust reading style for different time periods', async () => {
      const futureContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'ambitious',
        topic: 'love',
        period: 'distant_future',
        context: 'Long-term relationship planning'
      }

      const selectedCards = [6, 15, 20]

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีค่ะ มาดูไพ่รักระยะยาวกันค่ะ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ไพ่คู่รักบ่งบอกถึงการพบรักแท้'
            },
            {
              position: 2,
              interpretation: 'ไพ่ซาตานบ่งบอกถึงการตัดสินใจที่ยากลำบาก'
            },
            {
              position: 3,
              interpretation: 'ไพ่การพิพากษาบ่งบอกถึงการเลือกที่ถูกต้อง'
            }
          ],
          reading: 'จากการดูไพ่ทั้ง 3 ใบ พบว่าในระยะยาวคุณจะพบรักแท้ที่เหมาะสม ไพ่คู่รักบอกว่าจะมีคนเข้ามาในชีวิต ไพ่ซาตานบ่งบอกถึงการตัดสินใจระหว่างความรักเก่าและใหม่ และไพ่การพิพากษาบอกว่าการตัดสินใจของคุณจะเป็นประโยชน์ในอนาคต',
          suggestions: ['เปิดใจรับความรักใหม่', 'เรียนรู้จากอดีต', 'เชื่อมั่นในการตัดสินใจ'],
          next_questions: ['คุณสมบัติที่สำคัญในคู่ชีวิตคืออะไร?', 'บทเรียนจากความรักที่ผ่านมาคืออะไร?'],
          final_summary: 'รักแท้ที่ดีที่สุดจะมาถึงเมื่อเวลาที่เหมาะสม',
          disclaimer: 'ความรักต้องการเวลาและความเข้าใจร่วมกัน'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('Will I find lasting love?', futureContext, selectedCards)

      expect(result.reading).toContain('ระยะยาว')
      expect(result.suggestions).toContain('เปิดใจรับความรักใหม่')
      expect(result.next_questions).toContain('คุณสมบัติที่สำคัญในคู่ชีวิต')
    })
  })

  describe('Enhanced Card Integration', () => {
    it('should properly integrate all 3 cards into reading narrative', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'curious',
        topic: 'general',
        period: 'near_future',
        context: 'General future guidance'
      }

      const selectedCards = [0, 11, 21] // Fool, Justice, World

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีครับ มาดูไพ่อนาคตกันครับ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ไพ่คนโง่เผลอบ่งบอกถึงการเริ่มต้นใหม่'
            },
            {
              position: 2,
              interpretation: 'ไพ่ความยุติธรรมบ่งบอกถึงการตัดสินใจที่ถูกต้อง'
            },
            {
              position: 3,
              interpretation: 'ไพ่โลกบ่งบอกถึงความสำเร็จ'
            }
          ],
          reading: 'ไพ่ทั้ง 3 ใบบอกว่าคุณกำลังจะเริ่มต้นการเดินทางใหม่ (ไพ่คนโง่เผลอ) การตัดสินใจของคุณจะเป็นไปอย่างถูกต้อง (ไพ่ความยุติธรรม) และในที่สุดคุณจะประสบความสำเร็จ (ไพ่โลก)',
          suggestions: ['กล้าเริ่มต้นใหม่', 'ตัดสินใจด้วยเหตุผล', 'ไว้วางใจในกระบวนการ'],
          next_questions: ['สิ่งใดที่คุณอยากเริ่มต้น?', 'การตัดสินใจที่สำคัญคืออะไร?'],
          final_summary: 'การเดินทางใหม่จะนำไปสู่ความสำเร็จอย่างแน่นอน',
          disclaimer: 'โปรดใช้วิจารณญาณในการตัดสินใจทุกครั้ง'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('What new adventures await me?', guardianContext, selectedCards)

      expect(result.cards_reading[0].interpretation).toContain('การเริ่มต้นใหม่')
      expect(result.cards_reading[1].interpretation).toContain('การตัดสินใจ')
      expect(result.cards_reading[2].interpretation).toContain('ความสำเร็จ')
      expect(result.reading).toContain('ไพ่คนโง่เผลอ')
      expect(result.reading).toContain('ไพ่ความยุติธรรม')
      expect(result.reading).toContain('ไพ่โลก')
    })
  })

  describe('Cultural Adaptation and Thai Language', () => {
    it('should handle Thai questions with culturally appropriate responses', async () => {
      const thaiContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'confused',
        topic: 'love',
        period: 'present',
        context: 'คำถามภาษาไทยเกี่ยวกับรัก'
      }

      const selectedCards = [2, 6, 19] // High Priestess, Lovers, Sun

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีค่ะ มาดูไพ่รักภาษาไทยกันเถอะค่ะ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ไพ่นางพรหมจารีบ่งบอกถึงสติปัญญาในความรัก'
            },
            {
              position: 2,
              interpretation: 'ไพ่คู่รักบ่งบอกถึงความสัมพันธ์ที่ดี'
            },
            {
              position: 3,
              interpretation: 'ไพ่พระอาทิตย์บ่งบอกถึงความสุขในความรัก'
            }
          ],
          reading: 'จากการดูไพ่ทั้ง 3 ใบ พบว่าเรื่องรักของคุณจะดีขึ้น ไพ่นางพรหมจารีบอกว่าต้องใช้สติในความสัมพันธ์ ไพ่คู่รักชี้ว่าจะพบคนที่เหมาะสม และไพ่พระอาทิตย์บอกว่าความรักนี้จะนำความสุขมาให้',
          suggestions: ['ใช้สติในความสัมพันธ์', 'เปิดใจรับคนใหม่', 'เชื่อมั่นในความรัก'],
          next_questions: ['สิ่งที่สำคัญในความรักคืออะไร?', 'คนที่เหมาะสมคือคนแบบไหน?'],
          final_summary: 'ความรักที่ดีจะมาถึงเมื่อคุณพร้อม',
          disclaimer: 'ความรักต้องอาศัยความเข้าใจและเวลา'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('ฉันจะเจอรักแท้เมื่อไหร่คะ', thaiContext, selectedCards)

      expect(result.header).toContain('ภาษาไทย')
      expect(result.reading).toContain('ไพ่นางพรหมจารี')
      expect(result.suggestions).toContain('ใช้สติในความสัมพันธ์')
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle API failures with enhanced fallback', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General question'
      }

      const selectedCards = [1, 5, 9]

      generateText.mockRejectedValue(new Error('API Error'))

      const result = await mysticAgent('Test question', guardianContext, selectedCards)

      // Enhanced fallback with proper structure
      expect(result.header).toBe('สวัสดีค่ะ มาดูไพ่กัน')
      expect(result.cards_reading).toHaveLength(3)
      expect(result.reading).toBe('จากการสละไพ่ทั้ง 3 ใบ พบว่าอนาคตของคุณมีโอกาสดีๆ เข้ามา')
      expect(result.suggestions).toEqual(['มั่นใจในตัวเอง', 'เปิดใจรับสิ่งใหม่'])
      expect(result.next_questions).toEqual(['สิ่งที่คุณต้องการคืออะไร?'])
      expect(result.final_summary).toBe('อนาคตสดใสรออยู่ข้างหน้า')
      expect(result.disclaimer).toBe('โปรดใช้วิจารณญาณในการตัดสินใจ')
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

      const selectedCards = [0, 2, 4]

      generateText.mockResolvedValue({
        text: 'invalid json response'
      })

      const result = await mysticAgent('Test question', guardianContext, selectedCards)

      // Should provide fallback response
      expect(result.header).toBe('สวัสดีค่ะ มาดูไพ่กัน')
      expect(result.cards_reading).toHaveLength(3)
    })

    it('should handle missing required fields in response', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'General question'
      }

      const selectedCards = [3, 6, 9]

      generateText.mockResolvedValue({
        text: JSON.stringify({
          header: 'สวัสดีค่ะ',
          reading: 'Basic reading'
          // Missing other required fields
        })
      })

      const result = await mysticAgent('Test question', guardianContext, selectedCards)

      // Should provide defaults for missing fields
      expect(result.header).toBe('สวัสดีค่ะ')
      expect(result.cards_reading).toHaveLength(3)
      expect(result.suggestions).toEqual(['มั่นใจในตัวเอง', 'เปิดใจรับสิ่งใหม่'])
      expect(result.disclaimer).toBe('โปรดใช้วิจารณญาณในการตัดสินใจ')
    })
  })

  describe('Enhanced Response Structure Validation', () => {
    it('should validate complete enhanced response structure', async () => {
      const guardianContext: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'ambitious',
        topic: 'career',
        period: 'near_future',
        context: 'Career ambition'
      }

      const selectedCards = [1, 7, 10]

      const mockResponse = {
        text: JSON.stringify({
          header: 'สวัสดีครับ มาดูไพ่อาชีพกันครับ',
          cards_reading: [
            {
              position: 1,
              interpretation: 'ทักษะใหม่ๆ รอการพัฒนา'
            },
            {
              position: 2,
              interpretation: 'ความก้าวหน้าในการทำงาน'
            },
            {
              position: 3,
              interpretation: 'โอกาสใหม่จากการเปลี่ยนแปลง'
            }
          ],
          reading: 'การเปลี่ยนอาชีพจะนำความสำเร็จมาสู่คุณ',
          suggestions: ['เรียนรู้ทักษะใหม่', 'กล้าเสี่ยงโอกาส', 'วางแผนอย่างรอบคอบ'],
          next_questions: ['ทักษะใดที่น่าสนใจ?', 'โอกาสที่ดีที่สุดคืออะไร?'],
          final_summary: 'ความสำเร็จในอาชีพใหม่รออยู่ข้างหน้า',
          disclaimer: 'การตัดสินใจควรพิจารณาอย่างรอบด้าน'
        })
      }

      generateText.mockResolvedValue(mockResponse)

      const result = await mysticAgent('What career success awaits?', guardianContext, selectedCards)

      // Validate enhanced structure
      expect(typeof result.header).toBe('string')
      expect(Array.isArray(result.cards_reading)).toBe(true)
      expect(result.cards_reading).toHaveLength(3)
      expect(typeof result.reading).toBe('string')
      expect(Array.isArray(result.suggestions)).toBe(true)
      expect(Array.isArray(result.next_questions)).toBe(true)
      expect(typeof result.final_summary).toBe('string')
      expect(typeof result.disclaimer).toBe('string')

      // Validate card reading structure
      result.cards_reading.forEach((card, index) => {
        expect(card.position).toBe(index + 1)
        expect(typeof card.interpretation).toBe('string')
      })

      // Validate content quality
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.next_questions.length).toBeGreaterThan(0)
      expect(result.disclaimer).toContain('วิจารณญาณ')
    })
  })
})