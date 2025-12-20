// API Route for POST /api/predict
// Phase 5: Fire-and-forget Vercel Workflow integration

import { NextRequest } from 'next/server'
import { startTarotWorkflow } from '../../../app/workflows/tarot'
import { validatePostPredictRequest } from '../../../lib/validations'
import { generateJobId } from '../../../lib/job-id'
import { db } from '../../../lib/db'
import { auth } from '../../../lib/auth'
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '../../../lib/errors'
import type { PostPredictRequest, PostPredictResponse } from '../../../types/api'

/**
 * POST /api/predict
 * Submit a tarot prediction request and trigger asynchronous workflow
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: request.headers })
    
    // Extract userId and userName from session
    const userId = session?.user?.id || null
    const userName = session?.user?.name || null
    
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

    // Generate unique job ID
    const jobId = generateJobId()

    // Create prediction record in database
    try {
      await db.prediction.create({
        data: {
          jobId,
          userIdentifier: userId,
          question: validBody.question,
          status: 'PENDING'
        }
      })
    } catch (dbError) {
      console.error('Failed to create prediction record:', dbError)
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to create prediction record'
      })
    }

    // Trigger workflow asynchronously (fire-and-forget)
    // Don't await - let it run in background
    startTarotWorkflow({
      jobId,
      question: validBody.question,
      userIdentifier: validBody.userIdentifier,
      userId,
      userName
    }).catch(async (error) => {
      // Handle errors asynchronously - log and update database
      console.error('Workflow failed:', error)

      // Mark job as failed in database
      await db.prediction.updateMany({
        where: { jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })
    })

    // Return success response with PENDING status
    const response: PostPredictResponse = {
      jobId,
      status: 'PENDING',
      message: `Processing your tarot reading. Job ID: ${jobId}`
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