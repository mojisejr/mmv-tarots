// API Route Tests for POST /api/predict
// Phase 1: RED - Tests written before implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/predict/route'
import { createTestRequest } from '../lib/utils'
import { db } from '@/lib/db'
import type { PostPredictRequest, PostPredictResponse } from '@/types/api'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    prediction: {
      create: vi.fn()
    }
  }
}))

vi.mock('@/app/workflows/tarot', () => ({
  startTarotWorkflow: vi.fn()
}))

// Mock Date.now for deterministic job ID generation
const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
const mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1)

const mockDb = vi.mocked(db)

describe('POST /api/predict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation', () => {
    it('should reject requests with no body', async () => {
      const request = new Request('http://localhost:3000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request body is required'
        }
      })
    })

    it('should reject requests with invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        }
      })
    })

    it('should reject requests missing question', async () => {
      const body = { userIdentifier: 'test-user' }
      const request = createTestRequest(body)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'question',
              message: 'Question is required'
            })
          ])
        },
        timestamp: expect.any(String)
      })
    })

    it('should reject questions that are too short', async () => {
      const body: PostPredictRequest = {
        question: 'short', // Less than 8 characters
        userIdentifier: 'test-user'
      }
      const request = createTestRequest(body)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'question',
              message: 'Question must be at least 8 characters long'
            })
          ])
        },
        timestamp: expect.any(String)
      })
    })

    it('should reject questions that are too long', async () => {
      const body: PostPredictRequest = {
        question: 'a'.repeat(181), // More than 180 characters
        userIdentifier: 'test-user'
      }
      const request = createTestRequest(body)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'question',
              message: 'Question must not exceed 180 characters'
            })
          ])
        },
        timestamp: expect.any(String)
      })
    })

    it('should accept valid requests without userIdentifier', async () => {
      const body: PostPredictRequest = {
        question: 'What does my future hold?'
      }
      const request = createTestRequest(body)

      // Mock successful database creation
      mockDb.prediction.create.mockResolvedValue({
        id: 'test-id',
        jobId: 'job-1234567890000-3llllllll', // Job ID with mocked values
        status: 'PENDING',
        question: body.question,
        userIdentifier: null,
        createdAt: new Date()
      })

      const response = await POST(request)
      const data: PostPredictResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        jobId: 'job-1234567890000-3llllllll',
        status: 'PENDING',
        message: 'Prediction request received. Job ID: job-1234567890000-3llllllll'
      })
    })
  })

  describe('Functionality', () => {
    it('should create a prediction record in database', async () => {
      const body: PostPredictRequest = {
        question: 'What should I focus on in my career?',
        userIdentifier: 'user-123'
      }
      const request = createTestRequest(body)

      const expectedRecord = {
        id: 'prediction-id',
        jobId: 'job-1234567890-abc123',
        question: body.question,
        userIdentifier: body.userIdentifier,
        status: 'PENDING',
        createdAt: new Date()
      }

      mockDb.prediction.create.mockResolvedValue(expectedRecord)

      const response = await POST(request)

      expect(mockDb.prediction.create).toHaveBeenCalledWith({
        data: {
          question: body.question,
          userIdentifier: body.userIdentifier,
          jobId: expect.stringMatching(/^job-\d+-[a-z0-9]{9}$/),
          status: 'PENDING'
        }
      })

      expect(response.status).toBe(200)
    })

    it('should trigger tarot workflow with job ID', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      const mockStartWorkflow = vi.mocked(startTarotWorkflow)

      const body: PostPredictRequest = {
        question: 'Will I find love soon?'
      }
      const request = createTestRequest(body)

      const jobId = 'job-1234567890000-3llllllll'
      mockDb.prediction.create.mockResolvedValue({
        id: 'prediction-id',
        jobId,
        question: body.question,
        status: 'PENDING'
      })

      await POST(request)

      expect(mockStartWorkflow).toHaveBeenCalledWith({
        jobId,
        question: body.question
      })
    })

    it('should return correct response format', async () => {
      const body: PostPredictRequest = {
        question: 'Should I change my job?'
      }
      const request = createTestRequest(body)

      const jobId = 'job-1234567890000-3llllllll'
      mockDb.prediction.create.mockResolvedValue({
        id: 'prediction-id',
        jobId,
        question: body.question,
        status: 'PENDING'
      })

      const response = await POST(request)
      const data: PostPredictResponse = await response.json()

      expect(data).toEqual({
        jobId,
        status: 'PENDING',
        message: `Prediction request received. Job ID: ${jobId}`
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const body: PostPredictRequest = {
        question: 'What does my future hold?'
      }
      const request = createTestRequest(body)

      const dbError = new Error('Database connection failed')
      mockDb.prediction.create.mockRejectedValue(dbError)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toMatchObject({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save prediction request'
        },
        timestamp: expect.any(String)
      })
    })

    it('should handle workflow trigger errors', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      const mockStartWorkflow = vi.mocked(startTarotWorkflow)

      const body: PostPredictRequest = {
        question: 'What does my future hold?'
      }
      const request = createTestRequest(body)

      // Database succeeds
      mockDb.prediction.create.mockResolvedValue({
        id: 'prediction-id',
        jobId: 'job-1234567890-abc123',
        question: body.question,
        status: 'PENDING'
      })

      // Workflow fails
      const workflowError = new Error('Workflow service unavailable')
      mockStartWorkflow.mockRejectedValue(workflowError)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toMatchObject({
        error: {
          code: 'WORKFLOW_ERROR',
          message: 'Failed to start AI workflow'
        },
        timestamp: expect.any(String)
      })
    })
  })
})