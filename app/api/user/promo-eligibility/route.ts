
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ eligible: true }); // Assume eligible if not logged in (or handle in frontend)
  }

  try {
    const previousTopups = await db.creditTransaction.count({
      where: {
        userId,
        type: 'TOPUP',
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({ eligible: previousTopups === 0 });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
