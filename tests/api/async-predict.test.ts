// Async Predict API Tests
// Phase 1: RED - Failing tests for asynchronous Vercel Workflow integration

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../app/api/predict/route'
import { NextRequest } from 'next/server'

// Mock the workflow imports
vi.mock('../../lib/workflows/simple-tarot', () => ({
  runSimpleTarotWorkflow: vi.fn()
}))

vi.mock('../../app/workflows/tarot', () => ({
  startTarotWorkflow: vi.fn()
}))

import { runSimpleTarotWorkflow } from '../../lib/workflows/simple-tarot'
import { startTarotWorkflow } from '../../app/workflows/tarot'

describe('POST /api/predict - Asynchronous Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return PENDING status for valid question (async workflow)', async () => {
    // Arrange
    const requestBody = {
      question: 'Will I find success in my career?',
      userIdentifier: 'user-123'
    }

    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.status).toBe('PENDING')
    expect(data.jobId).toBeDefined()
    expect(data.message).toContain('Processing')
    expect(startTarotWorkflow).toHaveBeenCalledWith({
      jobId: data.jobId,
      question: requestBody.question,
      userIdentifier: requestBody.userIdentifier
    })
    expect(runSimpleTarotWorkflow).not.toHaveBeenCalled()
  })

  it('should not use synchronous workflow for async processing', async () => {
    // Arrange
    const requestBody = {
      question: 'Should I change my job?',
      numCards: 5
    }

    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)

    // Assert
    expect(runSimpleTarotWorkflow).not.toHaveBeenCalled()
    expect(startTarotWorkflow).toHaveBeenCalled()
  })

  it('should handle workflow triggering errors gracefully', async () => {
    // Arrange
    vi.mocked(startTarotWorkflow).mockRejectedValue(new Error('Workflow service unavailable'))

    const requestBody = {
      question: 'Will I find love?'
    }

    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe('WORKFLOW_ERROR')
  })

  it('should create prediction record before triggering workflow', async () => {
    // Arrange - This test would require database mocking
    const requestBody = {
      question: 'What is my future?',
      userIdentifier: 'user-456'
    }

    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(data.jobId).toMatch(/^job-\d+-[a-z0-9]+$/)
    expect(data.status).toBe('PENDING')

    // Should verify database record exists (requires mock implementation)
    // TODO: Add database verification when implemented
  })

  it('should maintain compatibility with existing request format', async () => {
    // Arrange - Test backward compatibility
    const requestBody = {
      question: 'Should I invest in property?',
      numCards: 3,
      userIdentifier: 'investor-123'
    }

    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.jobId).toBeDefined()
    expect(data.status).toBe('PENDING')
    expect(data.message).toBeDefined()
  })
})