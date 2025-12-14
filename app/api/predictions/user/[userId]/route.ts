// API Route for GET /api/predictions/user/[userId]
// Fetches all predictions for a specific user

import { NextRequest } from 'next/server';
import { db } from '../../../../../lib/db';
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '../../../../../lib/errors';

/**
 * GET /api/predictions/user/[userId]
 * Fetch all predictions for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  try {
    // Get userId from route params
    const { userId } = await params;

    // Validate userId
    if (!userId || userId.trim() === '') {
      throw new ApiError({
        code: ERROR_CODES.INVALID_REQUEST,
        message: 'User ID is required'
      });
    }

    // Fetch predictions from database
    let predictions;
    try {
      predictions = await db.prediction.findMany({
        where: { userIdentifier: userId.trim() },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to 50 most recent predictions
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to fetch predictions'
      });
    }

    // Transform data for response
    const transformedPredictions = predictions.map(p => ({
      id: p.jobId,
      jobId: p.jobId,
      question: p.question,
      status: p.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
      createdAt: p.createdAt.toISOString(),
      completedAt: p.completedAt?.toISOString(),
      finalReading: p.finalReading
    }));

    return Response.json({
      predictions: transformedPredictions,
      total: transformedPredictions.length,
      page: 1,
      totalPages: Math.ceil(transformedPredictions.length / 50)
    });

  } catch (error) {
    console.error('GET /api/predictions/user/[userId] error:', error);

    // Handle API errors
    if (error instanceof ApiError) {
      const status =
        error.code === ERROR_CODES.INVALID_REQUEST ||
        error.code === ERROR_CODES.INVALID_JSON
          ? 400
          : error.code === ERROR_CODES.DATABASE_ERROR
          ? 500
          : 500;

      return createErrorResponse(error, status);
    }

    // Handle unknown errors
    return createErrorResponse(
      new ApiError({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch user predictions'
      }),
      500
    );
  }
}