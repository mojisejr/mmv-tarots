import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { CreditService } from '@/services/credit-service';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';
import { z } from 'zod';

const buyPackageSchema = z.object({
  packageId: z.enum(['1', '2']),
});

const PACKAGES = {
  '1': { stars: 100, name: 'Starter Pack' },
  '2': { stars: 200, name: 'Pro Pack' },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const body = await request.json();
    const validation = buyPackageSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid package ID',
      });
    }

    const { packageId } = validation.data;
    const packageInfo = PACKAGES[packageId];

    await CreditService.addStars(session.user.id, packageInfo.stars, {
      packageId,
      packageName: packageInfo.name
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${packageInfo.stars} stars`,
      currentStars: await CreditService.getUserStars(session.user.id),
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
