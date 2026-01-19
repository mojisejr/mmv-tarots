import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { headers, cookies } from 'next/headers';
import { CreditService } from '@/services/credit-service';
import { referralService } from '@/lib/server/services/referral-service';

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;

    // Phase 2: The Ritual Gate (Guaranteed Reward Logic)
    // 1. Idempotency Check: Don't reward twice
    // We use a mutable variable here because we might update it during "Self-Healing"
    let currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { onboardingCompleted: true, referredById: true }
    });

    if (currentUser?.onboardingCompleted) {
      return NextResponse.json({ success: true, message: 'Already completed' , reward: 0 });
    }

    // 1.5 Self-Healing Linkage (Fix for missing referrals due to race conditions)
    // If the Auth Hook failed to link the user, we try one last time here using the cookie.
    if (!currentUser?.referredById) {
      const cookieStore = await cookies();
      const referralCode = cookieStore.get('mmv_ref')?.value;

      if (referralCode) {
        console.log('[Ritual Gate] Attempting self-healing for referral:', referralCode);
        const headerStore = await headers();
        const ip = headerStore.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        
        // Attempt to process the referral link now
        await referralService.processReferralSignup(user as any, referralCode, ip);
        
        // Refresh the user state to see if linking worked
        const updatedUser = await db.user.findUnique({
          where: { id: user.id },
          select: { referredById: true }
        });
        
        if (updatedUser?.referredById) {
           console.log('[Ritual Gate] Self-healing successful. Linked to:', updatedUser.referredById);
           // Manually update our local state so the bonus logic below kicks in
           currentUser = { ...currentUser!, referredById: updatedUser.referredById };
        }
      }
    }

    // 2. Perform The Ritual (Transaction)
    // - Mark onboarding completed (ATOMIC LOCK)
    // - Grant "Onboarding Bonus" (1 Star)
    // - Grant "Referral Bonus" (if applicable)
    // We use a transaction to ensure no race conditions allow double-rewarding.
    const result = await db.$transaction(async (tx) => {
      // 2.1 Mark as Completed (ATOMIC CHECK-AND-SET)
      // This updateMany acts as a mutex. Only one request can successfully update 'false' to 'true'.
      const updateResult = await tx.user.updateMany({
        where: { 
          id: user.id, 
          onboardingCompleted: false 
        },
        data: { onboardingCompleted: true }
      });

      if (updateResult.count === 0) {
        // Did not update anything -> Already completed by another concurrent request
        return { completed: false };
      }

      // If we are here, we own the 'Onboarding' event.
      // 2.2 Grant Onboarding Bonus (Must be robust)
      await CreditService.grantOnboardingBonus(user.id, tx);
      
      // 2.3 Process Guaranteed Referral Bonus
      // If the user has a referrer (linked in Phase 1 Auth Hook or Healing), they deserve a star now.
      if (currentUser?.referredById) {
         try {
           await CreditService.grantReferralEntryBonus(user.id, currentUser.referredById, tx);
         } catch (error) {
           console.error('[Ritual Gate] Failed to grant referral bonus:', error);
           // We don't block the onboarding completion if referral fails, but we log it.
         }
      }
      return { completed: true };
    });

    if (result && !result.completed) {
         return NextResponse.json({ success: true, message: 'Already completed', reward: 0 });  
    }

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
