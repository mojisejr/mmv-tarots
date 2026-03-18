import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { headers, cookies } from 'next/headers';
import { onboardingOrchestrationService } from '@/lib/server/services/onboarding-orchestration-service';

export async function PATCH(_req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    const cookieStore = await cookies();
    const headerStore = await headers();

    const result = await onboardingOrchestrationService.completeOnboarding({
      userId: user.id,
      referralCodeFromCookie: cookieStore.get('mmv_ref')?.value,
      ipAddress: headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    });

    if (result.status === 'already_completed') {
      return NextResponse.json({ success: true, message: 'Already completed', reward: 0 });
    }

    return NextResponse.json({ 
      success: true, 
      onboardingCompleted: true,
      ritual: 'completed',
      reward: result.reward,
    });
  } catch (error) {
    console.error('Ritual Gate error:', error);
    return NextResponse.json({ error: 'Ritual Failed' }, { status: 500 });
  }
}
