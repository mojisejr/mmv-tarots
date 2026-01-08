import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { CreditService } from '@/services/credit-service';
import { PredictionService } from '@/services/prediction-service';
import { calculateRateLimit } from '@/lib/server/rate-limit';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const userId = session.user.id;
    const stars = await CreditService.getUserStars(userId);

    // Fetch recent predictions for concentration/cooldown calculation
    const predictions = await PredictionService.getByUserId(userId, 10);
    const { concentration } = calculateRateLimit(predictions);

    return NextResponse.json({
      stars,
      concentration,
      lastPredictionAt: predictions[0]?.createdAt || null
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
