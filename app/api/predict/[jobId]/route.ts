// API Route for GET /api/predict/[jobId]
// Phase 2: GREEN - Minimal implementation to make tests pass

import { NextRequest } from 'next/server'
import { PredictionService } from '@/services/prediction-service'
import { isValidJobId } from '@/lib/server/job-id'
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '@/lib/server/errors'
import type { GetPredictResponse } from '@/types/api'

/**
 * GET /api/predict/[jobId]
 * Fetch prediction status and results by job ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<Response> {
  try {
    // Get jobId from route params
    const { jobId } = await params

    // Validate job ID format
    if (!jobId || jobId.trim() === '') {
      throw new ApiError({
        code: ERROR_CODES.INVALID_JOB_ID,
        message: 'Job ID is required'
      })
    }

    if (!isValidJobId(jobId)) {
      throw new ApiError({
        code: ERROR_CODES.INVALID_JOB_ID,
        message: 'Invalid job ID format'
      })
    }

    // Fetch prediction from database using Service
    let prediction
    try {
      prediction = await PredictionService.getByJobId(jobId)
    } catch (dbError) {
      console.error('Database error:', dbError)
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to fetch prediction'
      })
    }

    // Check if prediction exists
    if (!prediction) {
      throw new ApiError({
        code: ERROR_CODES.PREDICTION_NOT_FOUND,
        message: 'Prediction not found'
      })
    }

    // Data integrity check
    if (prediction.jobId !== jobId) {
      throw new ApiError({
        code: ERROR_CODES.DATA_INTEGRITY_ERROR,
        message: 'Job ID mismatch'
      })
    }

    // Build response based on prediction status
    const response: GetPredictResponse = {
      jobId: prediction.jobId,
      status: prediction.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
      question: prediction.question,
      createdAt: prediction.createdAt.toISOString()
    }

    // Add error information if status is FAILED
    if (prediction.status === 'FAILED') {
      response.error = {
        code: 'PREDICTION_FAILED',
        message: 'Tarot reading processing failed'
      }
    }

    // Add completedAt if present
    if (prediction.completedAt) {
      response.completedAt = prediction.completedAt.toISOString()
    }

    // Add result if available
    if (prediction.status !== 'PENDING' && prediction.status !== 'FAILED') {
      const result: any = {}

      // Add selected cards if present
      if (prediction.selectedCards) {
        result.selectedCards = prediction.selectedCards
      }

      // Add analysis if present
      if (prediction.analysisResult) {
        result.analysis = prediction.analysisResult
      }

      // Add final reading if completed and valid
      if (prediction.status === 'COMPLETED' && prediction.finalReading) {
        // Adapt reading data from AI Agent wrapper format
        const { adaptReadingData } = await import('@/lib/server/adapters/reading-adapter');
        const adaptedReading = adaptReadingData(prediction.finalReading);

        if (adaptedReading) {
          result.reading = adaptedReading
        }
      }

      // Only include result if there's data
      if (Object.keys(result).length > 0) {
        response.result = result
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error(`GET /api/predict/${(await params).jobId} error:`, error)

    // Handle API errors
    if (error instanceof ApiError) {
      let status: number

      // Determine appropriate status code
      if (error.code === ERROR_CODES.PREDICTION_NOT_FOUND) {
        status = 404
      } else if (error.code === ERROR_CODES.INVALID_JOB_ID) {
        status = 400
      } else {
        status = 500
      }

      return createErrorResponse(error, status)
    }

    // Handle unknown errors
    return createErrorResponse(
      {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch prediction'
      },
      500
    )
  }
}