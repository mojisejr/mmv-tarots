// API Route for GET /api/predictions/me
// Fetches all predictions for the currently authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { PredictionService } from '@/services/prediction-service';
import { auth } from '@/lib/server/auth';
import {
  ApiError,
  ERROR_CODES,
  createErrorResponse
} from '@/lib/server/errors';

/**
 * GET /api/predictions/me
 * Fetch all predictions for the currently authenticated user
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required'
      });
    }

    const userId = session.user.id;

    // Fetch predictions from database using Service
    let predictions;
    try {
      predictions = await PredictionService.getByUserId(userId);
    } catch (dbError) {
      console.error('Database error fetching predictions:', dbError);
      throw new ApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to fetch predictions'
      });
    }

    // Return predictions
    return NextResponse.json({
      predictions,
      total: predictions.length,
      page: 1,
      totalPages: 1
    });

  } catch (error) {
    console.error('Error in GET /api/predictions/me:', error);
    
    if (error instanceof ApiError) {
      return createErrorResponse({
        code: error.code,
        message: error.message,
        details: error.details
      }, error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 500);
    }

    return createErrorResponse({
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
