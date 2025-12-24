import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { CreditService } from '@/services/credit-service';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const stars = await CreditService.getUserStars(session.user.id);

    return NextResponse.json({
      stars,
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
