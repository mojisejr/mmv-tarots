// API Route for POST /api/predict
// Phase 5: Fire-and-forget Vercel Workflow integration

import { NextRequest, after } from 'next/server'
import { startTarotWorkflow } from '@/services/tarot-service'
import { PredictionService } from '@/services/prediction-service'
import { CreditService } from '@/services/credit-service'
import { validatePostPredictRequest } from '@/lib/server/validations'
import { auth } from '@/lib/server/auth'
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '@/lib/server/errors'
import type { PostPredictRequest, PostPredictResponse } from '@/types/api'

/**
 * POST /api/predict
 * Submit a tarot prediction request and trigger asynchronous workflow
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required'
      })
    }

    // Extract userId and userName from session
    const userId = session.user.id
    const userName = session.user.name || null

    // Rate Limit Check: 1 request per 2 minutes
    const lastPrediction = await PredictionService.getByUserId(userId, 1)
    if (lastPrediction && lastPrediction.length > 0) {
      const lastTime = new Date(lastPrediction[0].createdAt).getTime()
      const now = new Date().getTime()
      const diffMinutes = (now - lastTime) / (1000 * 60)
      
      if (diffMinutes < 2) {
        const retryAfter = Math.ceil((2 * 60) - ((now - lastTime) / 1000))
        throw new ApiError({
          code: ERROR_CODES.TOO_MANY_REQUESTS,
          message: 'Please wait before asking another question.',
          details: { retryAfter }
        })
      }
    }

    // Check credit balance
    const hasCredit = await CreditService.hasEnoughStars(userId)
    if (!hasCredit) {
      throw new ApiError({
        code: ERROR_CODES.PAYMENT_REQUIRED,
        message: 'Insufficient stars. Please top up to continue.'
      })
    }
    
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

    // Create prediction record in database using Service
    let prediction;
    try {
      prediction = await PredictionService.createPrediction({
        userId,
        question: validBody.question
      });
    } catch (dbError) {
      console.error('Failed to create prediction record:', dbError)
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to create prediction record'
      })
    }

    const jobId = prediction.jobId as string;

    // Trigger workflow asynchronously using after() to prevent Vercel suspension
    // This ensures the background task completes even after response is sent
    after(async () => {
      try {
        await startTarotWorkflow({
          jobId,
          question: validBody.question,
          userIdentifier: validBody.userIdentifier,
          userId,
          userName
        })
      } catch (error) {
        // Handle errors asynchronously - log and update database
        console.error('Workflow failed:', error)

        // Mark job as failed in database
        await PredictionService.updatePrediction(jobId, {
          status: 'FAILED',
          completedAt: new Date()
        }).catch(err => console.error('Failed to mark job as failed:', err))
      }
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
          : error.code === ERROR_CODES.TOO_MANY_REQUESTS
          ? 429
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