// API Route for POST /api/predict
// Phase 3: Simple synchronous workflow for immediate curl testing

import { NextRequest } from 'next/server'
import { runSimpleTarotWorkflow } from '../../../lib/workflows/simple-tarot'
import { validatePostPredictRequest } from '../../../lib/validations'
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '../../../lib/errors'
import type { PostPredictRequest, PostPredictResponse } from '../../../types/api'

/**
 * POST /api/predict
 * Submit a tarot prediction request and receive immediate results
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Parse request body
    let body: unknown
    try {
      const text = await request.text()
      if (!text) {
        throw new ApiError({
          code: ERROR_CODES.INVALID_REQUEST,
          message: 'Request body is required'
        })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      throw new ApiError({
        code: ERROR_CODES.INVALID_REQUEST,
        message: 'Invalid JSON in request body'
      })
    }

    // Validate request
    const validationErrors = validatePostPredictRequest(body as PostPredictRequest)
    if (validationErrors.length > 0) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: validationErrors
      })
    }

    const validBody = body as PostPredictRequest

    // Run simple synchronous workflow
    const result = await runSimpleTarotWorkflow({
      question: validBody.question,
      userIdentifier: validBody.userIdentifier || undefined
    })

    if (!result.success) {
      throw new ApiError({
        code: ERROR_CODES.WORKFLOW_ERROR,
        message: result.error || 'Failed to generate tarot reading'
      })
    }

    // Return success response with completed status
    const response: PostPredictResponse = {
      jobId: result.jobId,
      status: 'COMPLETED',
      message: `Tarot reading completed. Job ID: ${result.jobId}`
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('POST /api/predict error:', error)

    // Handle API errors
    if (error instanceof ApiError) {
      const status =
        error.code === ERROR_CODES.VALIDATION_ERROR ||
        error.code === ERROR_CODES.INVALID_REQUEST ||
        error.code === ERROR_CODES.INVALID_JSON
          ? 400
          : error.code === ERROR_CODES.DATABASE_ERROR ||
            error.code === ERROR_CODES.WORKFLOW_ERROR
          ? 500
          : 500

      return createErrorResponse(error, status)
    }

    // Handle unexpected errors
    return createErrorResponse(
      new ApiError({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Internal server error'
      }),
      500
    )
  }
}