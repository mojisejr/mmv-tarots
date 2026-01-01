import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';

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

  // Fetch last prediction time for cooldown calculation
  const lastPrediction = await db.prediction.findFirst({
    where: { userIdentifier: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  return NextResponse.json({
    ...user,
    lastPredictionAt: lastPrediction?.createdAt || null
  });
};
