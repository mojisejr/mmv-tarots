// Workflow Integration Tests for Tarot AI Pipeline
// Phase 3: RED - Tests written before implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { startTarotWorkflow } from '@/app/workflows/tarot'
import { db } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    prediction: {
      update: vi.fn(),
      updateMany: vi.fn()
    }
  }
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: '{}'
  })
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mock-model')
}))

vi.mock('workflow', () => ({
  workflowSpec: {
    define: vi.fn()
  }
}))

const mockDb = vi.mocked(db)
const { generateText: mockGenerateText } = vi.mocked(await import('ai'))

describe('Tarot Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Workflow Triggering', () => {
    it('should update prediction status to PROCESSING on workflow start', async () => {
      const params = {
        jobId: 'job-1704067200000-abc123def',
        question: 'What does my future hold?'
      }

      mockDb.prediction.updateMany.mockResolvedValue({})

      await startTarotWorkflow(params)

      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: params.jobId },
        data: {
          status: 'PROCESSING',
          analysisResult: expect.any(Object),
          selectedCards: expect.any(Array)
        }
      })
    })

    it('should handle database update failure gracefully', async () => {
      const params = {
        jobId: 'job-1704067200000-xyz789uvw',
        question: 'Will I find love?'
      }

      const dbError = new Error('Database connection failed')
      mockDb.prediction.update.mockRejectedValue(dbError)

      // Should throw error to be handled by POST endpoint
      await expect(startTarotWorkflow(params)).rejects.toThrow(dbError)
    })
  })

  describe('AI Agent Pipeline', () => {
    const mockJobId = 'job-1704067200000-test123456'

    it('should execute all 4 agents in correct sequence', async () => {
      // Mock successful AI responses for each agent
      mockGenerateText
        .mockResolvedValueOnce({
          text: JSON.stringify({
            approved: true,
            reason: 'Appropriate question for tarot reading'
          })
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            mood: 'hopeful',
            topic: 'future',
            period: 'long-term',
            context: 'User seeking guidance about life direction'
          })
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            selectedCards: [19, 8, 17], // The Sun, Strength, The Star
            reasoning: 'Cards chosen based on hopeful future seeking'
          })
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            header: 'สวัสดีค่า... เห็นคำถามเรื่องอนาคตนะคะ',
            cards_reading: expect.arrayContaining([
              expect.objectContaining({
                position: expect.any(Number),
                name_en: expect.any(String),
                name_th: expect.any(String),
                image: expect.stringMatching(/^cards\//),
                keywords: expect.arrayContaining([expect.any(String)]),
                interpretation: expect.any(String)
              })
            ]),
            reading: expect.stringContaining('ไพ่ทั้ง 3 ใบ'),
            suggestions: expect.arrayContaining([expect.any(String)]),
            next_questions: expect.arrayContaining([expect.any(String)]),
            final_summary: expect.any(String),
            disclaimer: expect.stringContaining('วิจารณญาณ')
          })
        })

      const params = {
        jobId: mockJobId,
        question: 'What should I focus on in my career?'
      }

      // Mock database updates
      mockDb.prediction.update
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})

      await startTarotWorkflow(params)

      // Verify all 4 AI calls were made
      expect(mockGenerateText).toHaveBeenCalledTimes(4)

      // Verify agent sequence
      expect(mockGenerateText).toHaveBeenNthCalledWith(1, expect.objectContaining({
        prompt: expect.stringContaining('GATEKEEPER')
      }))
      expect(mockGenerateText).toHaveBeenNthCalledWith(2, expect.objectContaining({
        prompt: expect.stringContaining('ANALYST')
      }))
      expect(mockGenerateText).toHaveBeenNthCalledWith(3, expect.objectContaining({
        prompt: expect.stringContaining('DEALER')
      }))
      expect(mockGenerateText).toHaveBeenNthCalledWith(4, expect.objectContaining({
        prompt: expect.stringContaining('MYSTIC')
      }))
    })

    it('should stop pipeline if gatekeeper rejects question', async () => {
      // Mock gatekeeper rejection
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          approved: false,
          reason: 'Question involves illegal activities'
        })
      })

      const params = {
        jobId: mockJobId,
        question: 'How can I rob a bank and get away with it?'
      }

      // Should fail fast with appropriate error
      await expect(startTarotWorkflow(params)).rejects.toThrow('Question rejected by gatekeeper')

      // Only gatekeeper should be called
      expect(mockGenerateText).toHaveBeenCalledTimes(1)
    })

    it('should handle AI API failures with retry logic', async () => {
      // Mock AI failure then success
      mockGenerateText
        .mockRejectedValueOnce(new Error('AI API rate limited'))
        .mockResolvedValueOnce({
          text: JSON.stringify({
            approved: true,
            reason: 'Appropriate question'
          })
        })

      const params = {
        jobId: mockJobId,
        question: 'Should I move to a new city?'
      }

      // Should retry and succeed
      await expect(startTarotWorkflow(params)).resolves.not.toThrow()

      // Should have retried
      expect(mockGenerateText).toHaveBeenCalledTimes(2)
    })
  })

  describe('Database Updates', () => {
    const mockJobId = 'job-1704067200000-dbtest123'

    it('should update analysis result after analyst agent', async () => {
      const params = {
        jobId: mockJobId,
        question: 'Is my relationship going to last?'
      }

      const mockAnalysis = {
        mood: 'concerned',
        topic: 'relationship',
        period: 'present',
        context: 'User worried about relationship stability'
      }

      mockGenerateText
        .mockResolvedValueOnce({ text: JSON.stringify({ approved: true }) })
        .mockResolvedValueOnce({ text: JSON.stringify(mockAnalysis) })

      mockDb.prediction.updateMany.mockResolvedValue({})

      await startTarotWorkflow(params)

      // Verify analysis was saved
      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
        data: expect.objectContaining({
          analysisResult: mockAnalysis
        })
      })
    })

    it('should update selected cards after dealer agent', async () => {
      const params = {
        jobId: mockJobId,
        question: 'Will I get the promotion?'
      }

      const mockCards = [1, 21, 10] // The Magician, The World, Wheel of Fortune

      mockGenerateText
        .mockResolvedValueOnce({ text: JSON.stringify({ approved: true }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ mood: 'ambitious' }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ selectedCards: mockCards }) })

      mockDb.prediction.updateMany.mockResolvedValue({})

      await startTarotWorkflow(params)

      // Verify cards were saved
      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
        data: expect.objectContaining({
          selectedCards: mockCards
        })
      })
    })

    it('should mark as COMPLETED with final reading', async () => {
      const params = {
        jobId: mockJobId,
        question: 'What does my future hold?'
      }

      const mockFinalReading = {
        header: 'สวัสดีค่า... มาดูอนาคตกัน',
        cards_reading: [],
        reading: 'จากการสละไพ่พบว่า...',
        suggestions: ['มั่นใจในตัวเอง'],
        next_questions: ['สิ่งที่คุณต้องการคือ'],
        final_summary: 'อนาคตสดใส',
        disclaimer: 'โปรดใช้วิจารณญาณ'
      }

      mockGenerateText
        .mockResolvedValueOnce({ text: JSON.stringify({ approved: true }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ mood: 'hopeful' }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ selectedCards: [19, 17] }) })
        .mockResolvedValueOnce({ text: JSON.stringify(mockFinalReading) })

      mockDb.prediction.updateMany.mockResolvedValue({})

      await startTarotWorkflow(params)

      // Verify final update with completed status
      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          finalReading: mockFinalReading
        }
      })
    })
  })

  describe('Error Scenarios', () => {
    it('should mark as FAILED if any agent fails after retries', async () => {
      const params = {
        jobId: mockJobId,
        question: 'Test question'
      }

      // Mock persistent AI failure
      mockGenerateText.mockRejectedValue(new Error('AI service unavailable'))

      mockDb.prediction.updateMany.mockResolvedValue({})

      await startTarotWorkflow(params)

      // Verify failed status
      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
        data: {
          status: 'FAILED',
          completedAt: expect.any(Date)
        }
      })
    })

    it('should handle malformed AI responses', async () => {
      const params = {
        jobId: mockJobId,
        question: 'Test question'
      }

      // Mock invalid JSON response
      mockGenerateText.mockResolvedValue({
        text: 'Invalid JSON response'
      })

      mockDb.prediction.updateMany.mockResolvedValue({})

      await expect(startTarotWorkflow(params)).rejects.toThrow()

      // Should be marked as failed
      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { jobId: mockJobId },
        data: {
          status: 'FAILED',
          completedAt: expect.any(Date)
        }
      })
    })
  })
})