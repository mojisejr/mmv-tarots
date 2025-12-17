import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/predict/[jobId]/route'
import { db } from '@/lib/db'
import { adaptReadingData } from '@/lib/adapters/reading-adapter'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    prediction: {
      findFirst: vi.fn()
    }
  }
}))

vi.mock('@/lib/job-id', () => ({
  isValidJobId: vi.fn(() => true)
}))

vi.mock('@/lib/adapters/reading-adapter', () => ({
  adaptReadingData: vi.fn()
}))

// Mock route params
const mockParams = Promise.resolve({ jobId: 'test-job-123' })

describe('GET /api/predict/[jobId] - Adapter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
  })

  it('should use adaptReadingData for AI Agent wrapper format', async () => {
    // Mock database response with AI Agent wrapper format
    const mockPrediction = {
      jobId: 'test-job-123',
      status: 'COMPLETED',
      question: 'What does my future hold?',
      createdAt: new Date(),
      finalReading: {
        reading: {
          header: 'The Path Forward',
          reading: 'Your journey reveals great potential',
          cards_reading: [
            {
              position: 1,
              name_th: 'ไพ่มัจจุราช',
              name_en: 'The Magician',
              arcana: 'Major Arcana',
              keywords: ['action', 'power'],
              interpretation: 'You have the power to manifest',
              image: '/cards/magician.jpg'
            }
          ],
          suggestions: ['Trust your intuition'],
          next_questions: ['What is your true desire?'],
          final_summary: 'Transformation awaits',
          disclaimer: 'For entertainment purposes'
        },
        success: true
      }
    }

    // Mock database call
    vi.mocked(db.prediction.findFirst).mockResolvedValue(mockPrediction)

    // Mock adapter to return transformed data
    const transformedReading = {
      header: 'The Path Forward',
      reading: 'Your journey reveals great potential',
      cards_reading: [
        {
          position: 1,
          name_th: 'ไพ่มัจจุราช',
          name_en: 'The Magician',
          arcana: 'Major Arcana',
          keywords: ['action', 'power'],
          interpretation: 'You have the power to manifest',
          image: '/cards/magician.jpg'
        }
      ],
      suggestions: ['Trust your intuition'],
      next_questions: ['What is your true desire?'],
      final_summary: 'Transformation awaits',
      disclaimer: 'For entertainment purposes'
    }
    vi.mocked(adaptReadingData).mockReturnValue(transformedReading)

    // Call API
    const request = new Request('http://localhost:3000/api/predict/test-job-123')
    const response = await GET(request, { params: mockParams })
    const data = await response.json()

    // Verify adapter was called with correct data
    expect(adaptReadingData).toHaveBeenCalledWith(mockPrediction.finalReading)

    // Verify response contains transformed data
    expect(data.result.reading).toEqual(transformedReading)
    expect(data.status).toBe('COMPLETED')
    expect(data.jobId).toBe('test-job-123')
  })

  it('should handle adapter returning null (invalid data)', async () => {
    // Mock database response with invalid wrapper format
    const mockPrediction = {
      jobId: 'test-job-123',
      status: 'COMPLETED',
      question: 'What does my future hold?',
      createdAt: new Date(),
      finalReading: {
        reading: { header: 'Invalid Reading' },
        success: false // Should return null
      }
    }

    vi.mocked(db.prediction.findFirst).mockResolvedValue(mockPrediction)
    vi.mocked(adaptReadingData).mockReturnValue(null)

    const request = new Request('http://localhost:3000/api/predict/test-job-123')
    const response = await GET(request, { params: mockParams })
    const data = await response.json()

    // Verify adapter was called
    expect(adaptReadingData).toHaveBeenCalledWith(mockPrediction.finalReading)

    // Should not include reading in result when adapter returns null
    expect(data.result).not.toBeDefined()
    expect(data.status).toBe('COMPLETED')
  })

  it('should handle already valid ReadingResult format (backward compatibility)', async () => {
    // Mock database response with direct ReadingResult format
    const mockPrediction = {
      jobId: 'test-job-123',
      status: 'COMPLETED',
      question: 'What does my future hold?',
      createdAt: new Date(),
      finalReading: {
        header: 'Already Valid Reading',
        reading: 'This reading is already in correct format'
      }
    }

    vi.mocked(db.prediction.findFirst).mockResolvedValue(mockPrediction)
    vi.mocked(adaptReadingData).mockReturnValue(mockPrediction.finalReading)

    const request = new Request('http://localhost:3000/api/predict/test-job-123')
    const response = await GET(request, { params: mockParams })
    const data = await response.json()

    // Verify adapter was called
    expect(adaptReadingData).toHaveBeenCalledWith(mockPrediction.finalReading)

    // Verify response contains data as-is
    expect(data.result.reading).toEqual(mockPrediction.finalReading)
  })

  it('should not call adapter for non-COMPLETED status', async () => {
    const mockPrediction = {
      jobId: 'test-job-123',
      status: 'PROCESSING',
      question: 'What does my future hold?',
      createdAt: new Date(),
      finalReading: null
    }

    vi.mocked(db.prediction.findFirst).mockResolvedValue(mockPrediction)

    const request = new Request('http://localhost:3000/api/predict/test-job-123')
    const response = await GET(request, { params: mockParams })
    const data = await response.json()

    // Adapter should NOT be called for non-completed status
    expect(adaptReadingData).not.toHaveBeenCalled()

    // Should not include result for non-completed status
    expect(data.result).not.toBeDefined()
    expect(data.status).toBe('PROCESSING')
  })

  it('should not call adapter when finalReading is null', async () => {
    const mockPrediction = {
      jobId: 'test-job-123',
      status: 'COMPLETED',
      question: 'What does my future hold?',
      createdAt: new Date(),
      finalReading: null
    }

    vi.mocked(db.prediction.findFirst).mockResolvedValue(mockPrediction)

    const request = new Request('http://localhost:3000/api/predict/test-job-123')
    const response = await GET(request, { params: mockParams })
    const data = await response.json()

    // Adapter should NOT be called when finalReading is null
    expect(adaptReadingData).not.toHaveBeenCalled()

    // Should not include result when finalReading is null
    expect(data.result).not.toBeDefined()
  })
})