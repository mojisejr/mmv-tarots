// Predict Status Polling Tests
// Phase 1: RED - Failing tests for async job status checking

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../app/api/predict/[jobId]/route'
import { NextRequest } from 'next/server'

// Mock database
vi.mock('../../lib/db', () => ({
  db: {
    prediction: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

import { db } from '../../lib/db'

describe('GET /api/predict/[jobId] - Async Status Polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return PENDING status for processing jobs', async () => {
    // Arrange
    const jobId = 'job-1234567890-abc123def'

    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: 'pred-123',
      jobId: jobId,
      question: 'Will I find success?',
      status: 'PROCESSING',
      analysisResult: null,
      selectedCards: null,
      finalReading: null,
      createdAt: new Date(),
      completedAt: null
    })

    const request = new NextRequest(`http://localhost:3000/api/predict/${jobId}`)

    // Act
    const response = await GET(request, { params: { jobId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.jobId).toBe(jobId)
    expect(data.status).toBe('PROCESSING')
    expect(data.question).toBe('Will I find success?')
    expect(data.result).toBeUndefined()
  })

  it('should return COMPLETED status with results for finished jobs', async () => {
    // Arrange
    const jobId = 'job-1234567890-def456ghi'

    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: 'pred-456',
      jobId: jobId,
      question: 'Should I change my career?',
      status: 'COMPLETED',
      analysisResult: { mood: 'positive', topic: 'career' },
      selectedCards: [32, 15, 7],
      finalReading: {
        header: 'สวัสดีค่ะ มาดูไพ่กัน',
        reading: 'จากการสลาไพ่พบว่า...',
        cards_reading: [
          { name_en: 'page_of_wands', position: 1 },
          { name_en: 'the_tower', position: 2 },
          { name_en: 'the_chariot', position: 3 }
        ],
        suggestions: ['มั่นใจในตัวเอง'],
        final_summary: 'อนาคตสดใส'
      },
      createdAt: new Date(Date.now() - 60000), // 1 minute ago
      completedAt: new Date()
    })

    const request = new NextRequest(`http://localhost:3000/api/predict/${jobId}`)

    // Act
    const response = await GET(request, { params: { jobId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.jobId).toBe(jobId)
    expect(data.status).toBe('COMPLETED')
    expect(data.result).toBeDefined()
    expect(data.result.selectedCards).toEqual([32, 15, 7])
    expect(data.result.reading).toBeDefined()
  })

  it('should return FAILED status for error jobs', async () => {
    // Arrange
    const jobId = 'job-1234567890-ghi789jkl'

    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: 'pred-789',
      jobId: jobId,
      question: 'What does my future hold?',
      status: 'FAILED',
      analysisResult: null,
      selectedCards: null,
      finalReading: null,
      createdAt: new Date(Date.now() - 120000), // 2 minutes ago
      completedAt: new Date()
    })

    const request = new NextRequest(`http://localhost:3000/api/predict/${jobId}`)

    // Act
    const response = await GET(request, { params: { jobId } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.jobId).toBe(jobId)
    expect(data.status).toBe('FAILED')
    expect(data.error).toBeDefined()
  })

  it('should return 404 for non-existent jobs', async () => {
    // Arrange - valid format but non-existent in database
    const jobId = 'job-1234567890-nonexabcd'

    vi.mocked(db.prediction.findFirst).mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/predict/${jobId}`)

    // Act
    const response = await GET(request, { params: { jobId } })

    // Assert
    expect(response.status).toBe(404)
  })

  it('should handle malformed job IDs gracefully', async () => {
    // Arrange - invalid format should return 400
    const invalidJobId = 'invalid-job-format'

    vi.mocked(db.prediction.findFirst).mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/predict/${invalidJobId}`)

    // Act
    const response = await GET(request, { params: { jobId: invalidJobId } })

    // Assert
    expect(response.status).toBe(400)
  })
})