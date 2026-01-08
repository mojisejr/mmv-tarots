import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { calculateRateLimit } from '@/lib/server/rate-limit';

export const GET = async () => {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then(m => m.headers()),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch full user data including referralCode
  const { db } = await import('@/lib/server/db');
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      referralCode: true,
      stars: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch recent predictions for concentration/cooldown calculation
  // We need enough history for the Token Bucket algorithm
  const predictions = await db.prediction.findMany({
    where: { userIdentifier: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { createdAt: true }
  });

  const { concentration } = calculateRateLimit(predictions);

  return NextResponse.json({
    ...user,
    concentration,
    lastPredictionAt: predictions[0]?.createdAt || null
  });
};
