import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { referralService } from '@/lib/server/services/referral-service';

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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.referredById) {
      return NextResponse.json({ error: 'Referral already claimed' }, { status: 409 });
    }

    if (user.onboardingCompleted) {
      return NextResponse.json({ error: 'Referral claim window has ended' }, { status: 409 });
    }

    if (user.referralCode === code) {
      return NextResponse.json({ error: 'Self referral is not allowed' }, { status: 400 });
    }

    const referrer = await db.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!referrer) {
      return NextResponse.json({ error: 'Referral code is invalid' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    await referralService.processReferralSignup(user, code, ip);

    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      select: { referredById: true },
    });

    if (!updatedUser?.referredById) {
      return NextResponse.json({ error: 'Unable to claim referral code' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      referredById: updatedUser.referredById,
      message: 'Referral code claimed successfully',
    });
  } catch (error) {
    console.error('[Referral Claim] Failed to claim referral code:', error);
    return NextResponse.json({ error: 'Failed to claim referral code' }, { status: 500 });
  }
}
