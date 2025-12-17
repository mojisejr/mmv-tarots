// Phase 0 Test Infrastructure Tests
// TDD RED Phase - Testing our test utilities

import { describe, it, expect } from 'vitest'
import {
  createMockResponse,
  createMockJobId,
  mockCardData,
  mockPredictionResponse,
  createTestRequest,
  type PostPredictRequest,
  type GetPredictResponse,
  JOB_ID_REGEX
} from './utils'

describe('Test Utilities', () => {
  describe('createMockResponse', () => {
    it('should create a Response with correct status and JSON body', async () => {
      const data = { message: 'test' }
      const response = createMockResponse(data, 201)

      expect(response.status).toBe(201)
      expect(response.headers.get('Content-Type')).toBe('application/json')

      const json = await response.json()
      expect(json).toEqual(data)
    })

    it('should default to status 200', () => {
      const response = createMockResponse({})
      expect(response.status).toBe(200)
    })
  })

  describe('createMockJobId', () => {
    it('should create a job ID matching the expected format', () => {
      const jobId = createMockJobId()
      expect(jobId).toMatch(JOB_ID_REGEX)
    })

    it('should generate unique IDs', () => {
      const id1 = createMockJobId()
      const id2 = createMockJobId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('mockCardData', () => {
    it('should have all required Card properties', () => {
      expect(mockCardData).toHaveProperty('id')
      expect(mockCardData).toHaveProperty('cardId')
      expect(mockCardData).toHaveProperty('name')
      expect(mockCardData).toHaveProperty('displayName')
      expect(mockCardData).toHaveProperty('arcana')
      expect(mockCardData.cardId).toBe(0)
      expect(mockCardData.name).toBe('The Fool')
    })
  })

  describe('mockPredictionResponse', () => {
    it('should match GetPredictResponse interface', () => {
      const response = mockPredictionResponse
      expect(response).toHaveProperty('jobId')
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('question')
      expect(response).toHaveProperty('createdAt')
    })

    it('should have COMPLETED status with full result', () => {
      const response = mockPredictionResponse
      expect(response.status).toBe('COMPLETED')
      expect(response.result).toBeDefined()
      expect(response.result?.selectedCards).toHaveLength(3)
      expect(response.result?.reading?.cards_reading).toHaveLength(3)
    })
  })

  describe('createTestRequest', () => {
    it('should create a POST request with correct headers', async () => {
      const body: PostPredictRequest = {
        question: 'Test question for prediction',
        userIdentifier: 'test-user'
      }
      const request = createTestRequest(body)

      expect(request.method).toBe('POST')
      expect(request.headers.get('Content-Type')).toBe('application/json')

      const json = await request.json()
      expect(json).toEqual(body)
    })

    it('should support custom HTTP method', () => {
      const request = createTestRequest({ question: 'test' }, 'GET')
      expect(request.method).toBe('GET')
    })
  })
})

describe('API Type Validation', () => {
  it('should validate PostPredictRequest types', () => {
    const validRequest: PostPredictRequest = {
      question: 'What does my future hold?'.repeat(3) // Valid length
    }

    expect(validRequest.question.length).toBeGreaterThanOrEqual(8)
    expect(validRequest.question.length).toBeLessThanOrEqual(180)
  })

  it('should validate GetPredictResponse structure', () => {
    const response: GetPredictResponse = {
      jobId: createMockJobId(),
      status: 'PENDING',
      question: 'Test question',
      createdAt: new Date().toISOString()
    }

    expect(response.jobId).toMatch(JOB_ID_REGEX)
    expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).toContain(response.status)
  })
})