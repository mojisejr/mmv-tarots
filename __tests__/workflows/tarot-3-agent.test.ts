// 3-Agent Workflow Integration Tests
// Phase 1: RED - Failing tests for complete 3-agent workflow

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startTarotWorkflow3Agent } from '@/app/workflows/tarot-3-agent'
import { db } from '@/lib/server/db'
import type { GuardianResponse } from '@/lib/server/ai/agents/guardian'
import type { DealerResponse } from '@/lib/server/ai/agents/dealer'
import type { MysticResponse } from '@/lib/server/ai/agents/mystic'

// Mock AI agents
vi.mock('@/lib/server/ai/agents/guardian', () => ({
  guardianAgent: vi.fn()
}))

vi.mock('@/lib/server/ai/agents/dealer', () => ({
  dealerAgent: vi.fn()
}))

vi.mock('@/lib/server/ai/agents/mystic', () => ({
  mysticAgent: vi.fn()
}))

// Mock database
vi.mock('@/lib/server/db', () => ({
  db: {
    prediction: {
      updateMany: vi.fn()
    }
  }
}))

const { guardianAgent } = vi.mocked(await import('@/lib/server/ai/agents/guardian'))
const { dealerAgent } = vi.mocked(await import('@/lib/server/ai/agents/dealer'))
const { mysticAgent } = vi.mocked(await import('@/lib/server/ai/agents/mystic'))
const { db } = vi.mocked(await import('@/lib/server/db'))

describe('3-Agent Tarot Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete 3-Agent Workflow Success', () => {
    it('should execute full 3-agent pipeline successfully', async () => {
      const workflowParams = {
        jobId: 'job-test-123',
        question: 'Should I start my own business?',
        userIdentifier: 'user-456'
      }

      // Mock Guardian response
      const guardianResponse: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'ambitious',
        topic: 'career',
        period: 'near_future',
        context: 'Entrepreneurial question seeking business guidance'
      }
      guardianAgent.mockResolvedValue(guardianResponse)

      // Mock Dealer response
      const dealerResponse: DealerResponse = {
        selectedCards: [1, 10, 21],
        reasoning: 'The Magician for skills, Wheel of Fortune for opportunity, The World for success',
        theme: 'entrepreneurial_success',
        confidence: 0.88
      }
      dealerAgent.mockResolvedValue(dealerResponse)

      // Mock Mystic response
      const mysticResponse: MysticResponse = {
        header: 'สวัสดีครับ มาดูไพ่ธุรกิจกันครับ',
        cards_reading: [
          {
            position: 1,
            name_en: 'The Magician',
            name_th: 'ไพ่พ่อมด',
            image: 'cards/major/1.jpg',
            keywords: ['ทักษะ', 'พลัง', 'การสร้างสรรค์'],
            interpretation: 'ไพ่พ่อมดบ่งบอกว่าคุณมีทักษะและพลังพอที่จะเริ่มธุรกิจ'
          },
          {
            position: 2,
            name_en: 'Wheel of Fortune',
            name_th: 'วงล้อแห่งโชคชะตา',
            image: 'cards/major/10.jpg',
            keywords: ['โอกาส', 'โชคชะตา', 'การเปลี่ยนแปลง'],
            interpretation: 'ไพ่วงล้อมีบอกว่าโอกาสดีๆ กำลังจะมาถึง'
          },
          {
            position: 3,
            name_en: 'The World',
            name_th: 'ไพ่โลก',
            image: 'cards/major/21.jpg',
            keywords: ['ความสำเร็จ', 'การสำเร็จ', 'ความสมบูรณ์'],
            interpretation: 'ไพ่โลกบอกว่าธุรกิจของคุณจะประสบความสำเร็จ'
          }
        ],
        reading: 'จากการดูไพ่ทั้ง 3 ใบ พบว่าการเริ่มธุรกิจในช่วงนี้เป็นทางที่ถูกต้อง ไพ่พ่อมดบอกว่าคุณมีความสามารถพอเพียง ไพ่วงล้อโชคชะตาบอกถึงโอกาสที่ดี และไพ่โลกยืนยันถึงความสำเร็จที่จะเกิดขึ้น',
        suggestions: ['วางแผนธุรกิจอย่างรอบคอบ', 'เตรียมความพร้อมในด้านการเงิน', 'เรียนรู้จากคู่แข่ง'],
        next_questions: ['ธุรกิจใดที่เหมาะกับคุณ?', 'ทุนที่จำเป็นต้องการเท่าไหร่?'],
        final_summary: 'ธุรกิจของคุณจะประสบความสำเร็จอย่างแน่นอน',
        disclaimer: 'การลงทุนมีความเสี่ยง ควรศึกษาข้อมูลอย่างละเอียด'
      }
      mysticAgent.mockResolvedValue(mysticResponse)

      // Mock database operations
      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Execute workflow
      await expect(startTarotWorkflow3Agent(workflowParams)).resolves.not.toThrow()

      // Verify workflow sequence
      expect(guardianAgent).toHaveBeenCalledWith(workflowParams.question)
      expect(dealerAgent).toHaveBeenCalledWith(workflowParams.question, guardianResponse)
      expect(mysticAgent).toHaveBeenCalledWith(workflowParams.question, guardianResponse, dealerResponse.selectedCards)

      // Verify database updates
      expect(db.prediction.updateMany).toHaveBeenCalledTimes(4) // PROCESSING, analysis, cards, COMPLETED

      // Verify final database state
      const finalUpdate = db.prediction.updateMany.mock.calls[3][0]
      expect(finalUpdate.data.status).toBe('COMPLETED')
      expect(finalUpdate.data.finalReading).toEqual(mysticResponse)
      expect(finalUpdate.data.completedAt).toBeInstanceOf(Date)
    })

    it('should handle Guardian rejection properly', async () => {
      const workflowParams = {
        jobId: 'job-reject-123',
        question: 'How can I cheat someone?',
        userIdentifier: 'user-789'
      }

      // Mock Guardian rejection
      const guardianResponse: GuardianResponse = {
        approved: false,
        reason: 'Question involves harmful intent',
        mood: 'concerned',
        topic: 'harmful',
        period: 'present',
        context: 'Inappropriate question detected'
      }
      guardianAgent.mockResolvedValue(guardianResponse)

      // Mock database operations
      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Execute workflow - should throw error
      await expect(startTarotWorkflow3Agent(workflowParams)).rejects.toThrow('Question rejected by guardian')

      // Verify only initial updates occurred
      expect(db.prediction.updateMany).toHaveBeenCalledTimes(2) // PROCESSING, FAILED

      // Verify Dealer and Mystic were not called
      expect(dealerAgent).not.toHaveBeenCalled()
      expect(mysticAgent).not.toHaveBeenCalled()

      // Verify final database state
      const finalUpdate = db.prediction.updateMany.mock.calls[1][0]
      expect(finalUpdate.data.status).toBe('FAILED')
      expect(finalUpdate.data.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('Context Propagation Between Agents', () => {
    it('should properly propagate Guardian context to Dealer and Mystic', async () => {
      const workflowParams = {
        jobId: 'job-context-123',
        question: 'Will my relationship last forever?',
        userIdentifier: 'user-love'
      }

      // Mock specific Guardian response
      const guardianResponse: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'hopeful',
        topic: 'love',
        period: 'distant_future',
        context: 'Long-term relationship commitment question'
      }
      guardianAgent.mockResolvedValue(guardianResponse)

      // Mock Dealer response with context awareness
      const dealerResponse: DealerResponse = {
        selectedCards: [6, 14, 17],
        reasoning: 'Selected based on love theme, hopeful mood, and distant future timeframe',
        theme: 'eternal_love',
        confidence: 0.85
      }
      dealerAgent.mockResolvedValue(dealerResponse)

      // Mock Mystic response with enhanced context
      const mysticResponse: MysticResponse = {
        header: 'สวัสดีค่ะ มาดูไพ่รักถาวรกันค่ะ',
        cards_reading: [
          {
            position: 1,
            name_en: 'The Lovers',
            name_th: 'ไพ่คู่รัก',
            image: 'cards/major/6.jpg',
            keywords: ['ความรัก', 'การผูกมัด', 'ความสัมพันธ์'],
            interpretation: 'ไพ่คู่รักบ่งบอกถึงความผูกพันที่แน่นหนา'
          }
        ],
        reading: 'จากบริบทของความรักในระยะยาว พบว่าความสัมพันธ์ของคุณจะยั่งยืน',
        suggestions: ['สร้างความไว้วางใจ', 'สื่อสารอย่างเปิดเผย', 'ให้ความสำคัญต่อกันและกัน'],
        next_questions: ['สิ่งที่สำคัญที่สุดในความสัมพันธ์?', 'วิธีการสร้างความสัมพันธ์ที่ดี?'],
        final_summary: 'ความรักที่แท้จริงจะอยู่กับคุณตลอดไป',
        disclaimer: 'ความรักต้องการความพยายามร่วมกัน'
      }
      mysticAgent.mockResolvedValue(mysticResponse)

      // Mock database operations
      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Execute workflow
      await startTarotWorkflow3Agent(workflowParams)

      // Verify context propagation
      expect(dealerAgent).toHaveBeenCalledWith(
        workflowParams.question,
        expect.objectContaining({
          mood: 'hopeful',
          topic: 'love',
          period: 'distant_future'
        })
      )

      expect(mysticAgent).toHaveBeenCalledWith(
        workflowParams.question,
        expect.objectContaining({
          mood: 'hopeful',
          topic: 'love',
          period: 'distant_future'
        }),
        dealerResponse.selectedCards
      )

      // Verify analysis was saved with Guardian context
      const analysisUpdate = db.prediction.updateMany.mock.calls[1][0]
      expect(analysisUpdate.data.analysisResult).toEqual(guardianResponse)
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should handle Dealer agent failure with retry', async () => {
      const workflowParams = {
        jobId: 'job-retry-123',
        question: 'What challenges await me?',
        userIdentifier: 'user-challenge'
      }

      // Mock Guardian success
      const guardianResponse: GuardianResponse = {
        approved: true,
        reason: null,
        mood: 'concerned',
        topic: 'general',
        period: 'near_future',
        context: 'Challenge seeking question'
      }
      guardianAgent.mockResolvedValue(guardianResponse)

      // Mock Dealer failure then success
      dealerAgent
        .mockRejectedValueOnce(new Error('Dealer API Error'))
        .mockRejectedValueOnce(new Error('Dealer API Error'))
        .mockResolvedValueOnce({
          selectedCards: [5, 11, 15],
          reasoning: 'Cards selected after retry',
          theme: 'overcoming_challenges',
          confidence: 0.75
        })

      // Mock Mystic response
      mysticAgent.mockResolvedValue({
        header: 'สวัสดีค่ะ มาดูไพ่ความท้าทายกันค่ะ',
        cards_reading: [],
        reading: 'คุณจะเผชิญความท้าทายแต่จะผ่านไปได้',
        suggestions: ['มีความอดทน', 'เรียนรู้จากความผิดพลาด'],
        next_questions: ['บทเรียนที่สำคัญคืออะไร?'],
        final_summary: 'ความท้าทายจะทำให้คุณแข็งแกร่งขึ้น',
        disclaimer: 'ทุกอุปสรรคมีประโยชน์'
      } as MysticResponse)

      // Mock database operations
      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Execute workflow - should succeed after retry
      await expect(startTarotWorkflow3Agent(workflowParams)).resolves.not.toThrow()

      // Verify retry happened
      expect(dealerAgent).toHaveBeenCalledTimes(3) // 2 failures + 1 success
      expect(mysticAgent).toHaveBeenCalledTimes(1)

      // Verify workflow completed successfully
      const finalUpdate = db.prediction.updateMany.mock.calls[3][0]
      expect(finalUpdate.data.status).toBe('COMPLETED')
    })

    it('should handle complete workflow failure after max retries', async () => {
      const workflowParams = {
        jobId: 'job-fail-123',
        question: 'Test question',
        userIdentifier: 'user-fail'
      }

      // Mock Guardian success
      guardianAgent.mockResolvedValue({
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'Test question'
      })

      // Mock persistent Dealer failure
      dealerAgent.mockRejectedValue(new Error('Persistent Dealer Error'))

      // Mock database operations
      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Execute workflow - should fail after retries
      await expect(startTarotWorkflow3Agent(workflowParams)).rejects.toThrow('Persistent Dealer Error')

      // Verify workflow was marked as FAILED
      const finalUpdate = db.prediction.updateMany.mock.calls[2][0]
      expect(finalUpdate.data.status).toBe('FAILED')
      expect(finalUpdate.data.completedAt).toBeInstanceOf(Date)
    })

    it('should handle database errors gracefully', async () => {
      const workflowParams = {
        jobId: 'job-db-error-123',
        question: 'Test question',
        userIdentifier: 'user-db'
      }

      // Mock Guardian success
      guardianAgent.mockResolvedValue({
        approved: true,
        reason: null,
        mood: 'neutral',
        topic: 'general',
        period: 'present',
        context: 'Test question'
      })

      // Mock database failure
      db.prediction.updateMany.mockRejectedValue(new Error('Database connection failed'))

      // Execute workflow - should handle database error
      await expect(startTarotWorkflow3Agent(workflowParams)).rejects.toThrow('Database connection failed')
    })
  })

  describe('Performance and Resource Management', () => {
    it('should complete workflow within reasonable time', async () => {
      const workflowParams = {
        jobId: 'job-perf-123',
        question: 'Quick career question',
        userIdentifier: 'user-perf'
      }

      // Mock fast agent responses
      guardianAgent.mockResolvedValue({
        approved: true,
        reason: null,
        mood: 'ambitious',
        topic: 'career',
        period: 'present',
        context: 'Career question'
      })

      dealerAgent.mockResolvedValue({
        selectedCards: [7, 10, 19],
        reasoning: 'Career progression cards',
        theme: 'career_growth',
        confidence: 0.82
      })

      mysticAgent.mockResolvedValue({
        header: 'สวัสดีครับ',
        cards_reading: [],
        reading: 'อาชีพของคุณจะเติบโต',
        suggestions: ['ตั้งเป้าหมาย', 'พัฒนาตัวเอง'],
        next_questions: ['เป้าหมายของคุณคืออะไร?'],
        final_summary: 'ความสำเร็จในอาชีพใกล้เข้ามาแล้ว',
        disclaimer: 'ความสำเร็จต้องการความพยายาม'
      } as MysticResponse)

      db.prediction.updateMany.mockResolvedValue({ count: 1 })

      // Measure execution time
      const startTime = Date.now()
      await startTarotWorkflow3Agent(workflowParams)
      const executionTime = Date.now() - startTime

      // Should complete in reasonable time (less than 10 seconds for test)
      expect(executionTime).toBeLessThan(10000)
    })
  })
})