import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { headers } from 'next/headers';
import { CreditService } from '@/services/credit-service';
import { referralService } from '@/lib/server/services/referral-service';

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers() // await is required in Next.js 15+
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;

    // Phase 2: The Ritual Gate (Guaranteed Reward Logic)
    // 1. Idempotency Check: Don't reward twice
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { onboardingCompleted: true, referredById: true }
    });

    if (currentUser?.onboardingCompleted) {
      return NextResponse.json({ success: true, message: 'Already completed' });
    }

    // 2. Perform The Ritual (Transaction)
    // - Mark onboarding completed
    // - Grant "Onboarding Bonus" (1 Star)
    // - Grant "Referral Bonus" (if applicable)
    await db.$transaction(async (tx) => {
      // 2.1 Mark as Completed
      await tx.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true }
      });

      // 2.2 Grant Onboarding Bonus (Must be robust)
      await CreditService.grantOnboardingBonus(user.id, tx);
      
      // 2.3 Process Guaranteed Referral Bonus
      // If the user has a referrer (linked in Phase 1 Auth Hook), they deserve a star now.
      if (currentUser?.referredById) {
         try {
           await CreditService.grantReferralEntryBonus(user.id, currentUser.referredById, tx);
         } catch (error) {
           console.error('[Ritual Gate] Failed to grant referral bonus:', error);
           // We don't block the onboarding completion if referral fails, but we log it.
         }
      }
    });

    return NextResponse.json({ 
      success: true, 
      onboardingCompleted: true,
      ritual: 'completed',
      reward: currentUser?.referredById ? 2 : 1 // Accurate reward feedback
    });
  } catch (error) {
    console.error('Ritual Gate error:', error);
    return NextResponse.json({ error: 'Ritual Failed' }, { status: 500 });
  }
}
