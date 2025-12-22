// API Route Tests for GET /api/predict/[jobId]
// Phase 2: RED - Tests written before implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/predict/[jobId]/route'
import { createTestRequest } from '@/lib/shared/utils'
import { db } from '@/lib/server/db'
import type { GetPredictResponse } from '@/types/api'

// Mock dependencies
vi.mock('@/lib/server/db', () => ({
  db: {
    prediction: {
      findFirst: vi.fn()
    }
  }
}))

const mockDb = vi.mocked(db)

describe('GET /api/predict/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation', () => {
    it('should reject invalid job ID format', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: 'invalid-job-id' }

      // Mock params properly for Next.js App Router
      const context = {
        params: Promise.resolve(params)
      }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Invalid job ID format'
        },
        timestamp: expect.any(String)
      })
    })

    it('should reject empty job ID', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: '' }

      const context = {
        params: Promise.resolve(params)
      }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Job ID is required'
        }
      })
    })
  })

  describe('Functionality', () => {
    const mockJobId = 'job-1704067200000-abc123def'

    it('should return PENDING status for pending predictions', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: mockJobId }

      const context = {
        params: Promise.resolve(params)
      }

      mockDb.prediction.findFirst.mockResolvedValue({
        id: 'prediction-id',
        jobId: mockJobId,
        question: 'What does my future hold?',
        status: 'PENDING',
        userIdentifier: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: null,
        analysisResult: null,
        selectedCards: null,
        finalReading: null
      })

      const response = await GET(request, context)
      const data: GetPredictResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: mockJobId,
        status: 'PENDING',
        question: 'What does my future hold?',
        createdAt: '2024-01-01T00:00:00.000Z'
      })
      expect(data.completedAt).toBeUndefined()
      expect(data.result).toBeUndefined()
    })

    it('should return PROCESSING status for processing predictions', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: mockJobId }

      const context = {
        params: Promise.resolve(params)
      }

      mockDb.prediction.findFirst.mockResolvedValue({
        id: 'prediction-id',
        jobId: mockJobId,
        question: 'Should I change my job?',
        status: 'PROCESSING',
        userIdentifier: 'user-123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: null,
        analysisResult: { mood: 'curious', topic: 'career', period: 'present' },
        selectedCards: [1, 5, 10],
        finalReading: null
      })

      const response = await GET(request, context)
      const data: GetPredictResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: mockJobId,
        status: 'PROCESSING',
        question: 'Should I change my job?',
        createdAt: '2024-01-01T00:00:00.000Z',
        result: {
          selectedCards: [1, 5, 10],
          analysis: {
            mood: 'curious',
            topic: 'career',
            period: 'present'
          }
        }
      })
      expect(data.completedAt).toBeUndefined()
      expect(data.result?.reading).toBeUndefined()
    })

    it('should return COMPLETED status with full reading result', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: mockJobId }

      const context = {
        params: Promise.resolve(params)
      }

      const mockFinalReading = {
        header: 'สวัสดีค่า... เห็นคำถามเรื่องอนาคตนะคะ',
        cards_reading: [
          {
            position: 1,
            name_en: 'The Sun',
            name_th: 'ไพ่พระอาทิตย์',
            image: 'cards/major/19.jpg',
            keywords: ['ความสำเร็จ', 'ความสุข'],
            interpretation: 'หมายถึงความสำเร็จและความสุขที่จะเข้ามาในชีวิต'
          },
          {
            position: 2,
            name_en: 'The Moon',
            name_th: 'ไพ่พระจันทร์',
            image: 'cards/major/18.jpg',
            keywords: ['ความฝัน', 'ความเข้าใจ'],
            interpretation: 'บ่งบอกถึงสิ่งที่อยู่เบื้องหลังความรู้สึก'
          },
          {
            position: 3,
            name_en: 'The Star',
            name_th: 'ไพ่ดวงดาว',
            image: 'cards/major/17.jpg',
            keywords: ['ความหวัง', 'แรงบันดาลใจ'],
            interpretation: 'เป็นสัญลักษณ์ของความหวังและแรงบันดาลใจ'
          }
        ],
        reading: 'จากการสละไพ่ทั้ง 3 ใบ พบว่าอนาคตของคุณเต็มไปด้วยความสำเร็จและความสุข...',
        suggestions: [
          'มั่นใจในตัวเองและก้าวไปข้างหน้า',
          'เปิดใจรับสิ่งใหม่ๆ ที่จะเข้ามาในชีวิต'
        ],
        next_questions: [
          'ความสำเร็จที่แท้จริงสำหรับคุณคืออะไร?',
          'อุปสรรคใดที่อาจขวางกั้นความสุขของคุณ?'
        ],
        final_summary: 'อนาคตของคุณสดใสและเต็มไปด้วยโอกาสดีๆ',
        disclaimer: 'โปรดใช้วิจารณญาณในการอ่านนะคะ'
      }

      mockDb.prediction.findFirst.mockResolvedValue({
        id: 'prediction-id',
        jobId: mockJobId,
        question: 'What does my future hold?',
        status: 'COMPLETED',
        userIdentifier: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:02:00Z'),
        analysisResult: { mood: 'hopeful', topic: 'future', period: 'long-term' },
        selectedCards: [19, 18, 17],
        finalReading: mockFinalReading
      })

      const response = await GET(request, context)
      const data: GetPredictResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: mockJobId,
        status: 'COMPLETED',
        question: 'What does my future hold?',
        createdAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-01T00:02:00.000Z',
        result: {
          selectedCards: [19, 18, 17],
          analysis: {
            mood: 'hopeful',
            topic: 'future',
            period: 'long-term'
          },
          reading: mockFinalReading
        }
      })
    })

    it('should return FAILED status for failed predictions', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: mockJobId }

      const context = {
        params: Promise.resolve(params)
      }

      mockDb.prediction.findFirst.mockResolvedValue({
        id: 'prediction-id',
        jobId: mockJobId,
        question: 'Will I win the lottery?',
        status: 'FAILED',
        userIdentifier: 'user-456',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:01:00Z'),
        analysisResult: null,
        selectedCards: null,
        finalReading: null
      })

      const response = await GET(request, context)
      const data: GetPredictResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: mockJobId,
        status: 'FAILED',
        question: 'Will I win the lottery?',
        createdAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-01T00:01:00.000Z'
      })
      expect(data.result).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle prediction not found', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: 'job-1704067200000-xyz789uvw' }

      const context = {
        params: Promise.resolve(params)
      }

      mockDb.prediction.findFirst.mockResolvedValue(null)

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toMatchObject({
        error: {
          code: 'PREDICTION_NOT_FOUND',
          message: 'Prediction not found'
        },
        timestamp: expect.any(String)
      })
    })

    it('should handle database errors gracefully', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: 'job-1704067200000-def456ghi' }

      const context = {
        params: Promise.resolve(params)
      }

      const dbError = new Error('Database connection failed')
      mockDb.prediction.findFirst.mockRejectedValue(dbError)

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toMatchObject({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch prediction'
        },
        timestamp: expect.any(String)
      })
    })

    it('should handle malformed job ID from database', async () => {
      const request = createTestRequest(null, 'GET')
      const params = { jobId: 'job-1704067200000-jkl789mno' }

      const context = {
        params: Promise.resolve(params)
      }

      // Database returns record but job ID doesn't match (data integrity issue)
      mockDb.prediction.findFirst.mockResolvedValue({
        id: 'prediction-id',
        jobId: 'different-job-id',
        question: 'Test question',
        status: 'PENDING',
        createdAt: new Date()
      })

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toMatchObject({
        error: {
          code: 'DATA_INTEGRITY_ERROR',
          message: 'Job ID mismatch'
        }
      })
    })
  })
})