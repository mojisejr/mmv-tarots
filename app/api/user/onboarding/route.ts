import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { completeOnboarding } from '@/lib/server/services/user-service';
import { headers } from 'next/headers';

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers() // await is required in Next.js 15+
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await completeOnboarding(session.user.id);

    return NextResponse.json({ success: true, onboardingCompleted: true });
  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
