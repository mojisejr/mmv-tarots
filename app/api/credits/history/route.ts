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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await CreditService.getHistory(session.user.id, page, limit);

    return NextResponse.json(history);
  } catch (error) {
    return createErrorResponse(error);
  }
}
