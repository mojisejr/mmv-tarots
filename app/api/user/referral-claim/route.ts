import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { referralClaimService } from '@/lib/server/services/referral-claim-service';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    const code = typeof payload?.code === 'string' ? payload.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const result = await referralClaimService.claimReferralCode({
      userId: session.user.id,
      code,
      ipAddress: ip,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('[Referral Claim] Failed to claim referral code:', error);
    return NextResponse.json({ error: 'Failed to claim referral code' }, { status: 500 });
  }
}
