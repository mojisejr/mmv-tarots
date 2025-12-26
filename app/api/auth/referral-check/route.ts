import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { CreditService } from '@/services/credit-service';

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

    // Get referral cookie
    const refCookie = req.cookies.get('mmv_ref');
    
    if (!refCookie?.value) {
      return NextResponse.json({ message: 'No referral code found' }, { status: 200 });
    }

    const referralCode = refCookie.value;
    
    // Apply referral reward
    const result = await CreditService.applyReferralReward(referralCode, session.user.id);
    
    if (result.success) {
      // Clear the referral cookie
      const response = NextResponse.json(result);
      response.cookies.delete('mmv_ref');
      return response;
    }
    
    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('[Referral] Error processing referral:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
