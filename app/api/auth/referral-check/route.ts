import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';

/**
 * Auth callback handler for processing referral rewards
 * This endpoint is called after successful authentication
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Phase B: Legacy endpoint is intentionally a no-op.
    // Referral entitlement is decided at /api/user/onboarding (Ritual Gate) to avoid duplicate reward paths.
    return NextResponse.json({
      success: true,
      legacy: true,
      message: 'Referral check skipped. Onboarding gate is the source of truth.',
    });
  } catch (error) {
    console.error('[Referral] Error processing referral:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
