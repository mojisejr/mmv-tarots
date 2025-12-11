// API Route for POST /api/predict
// Phase 1: REFACTOR - Clean implementation with proper validation

import { NextRequest } from 'next/server'
import { db } from '../../../lib/db'
import { startTarotWorkflow } from '../../workflows/tarot'
import { generateJobId } from '../../../lib/job-id'
import { validatePostPredictRequest } from '../../../lib/validations'
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '../../../lib/errors'
import type { PostPredictRequest, PostPredictResponse } from '../../../types/api'

/**
 * POST /api/predict
 * Submit a tarot prediction request and receive a job ID for tracking
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
      if (parseError instanceof ApiError) {
        throw parseError
      }
      throw new ApiError({
        code: ERROR_CODES.INVALID_JSON,
        message: 'Invalid JSON in request body'
      })
    }

    // Validate request
    const validationErrors = validatePostPredictRequest(body)
    if (validationErrors.length > 0) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: validationErrors
      })
    }

    const validBody = body as PostPredictRequest

    // Generate job ID
    const jobId = generateJobId()

    // Save to database
    try {
      await db.prediction.create({
        data: {
          question: validBody.question,
          userIdentifier: validBody.userIdentifier || null,
          jobId,
          status: 'PENDING'
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to save prediction request'
      })
    }

    // Trigger AI workflow
    try {
      await startTarotWorkflow({
        jobId,
        question: validBody.question
      })
    } catch (workflowError) {
      console.error('Workflow trigger failed:', workflowError)
      throw new ApiError({
        code: ERROR_CODES.WORKFLOW_ERROR,
        message: 'Failed to start AI workflow'
      })
    }

    // Return success response
    const response: PostPredictResponse = {
      jobId,
      status: 'PENDING',
      message: `Prediction request received. Job ID: ${jobId}`
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
        error.code === ERROR_CODES.INVALID_JSON ? 400 : 500
      return createErrorResponse(error, status)
    }

    // Handle unknown errors
    return createErrorResponse(
      {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to process prediction request'
      },
      500
    )
  }
}