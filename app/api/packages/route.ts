import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET() {
  try {
    const packages = await db.starPackage.findMany({
      where: { active: true },
      include: {
        prices: {
          where: { active: true },
          orderBy: { amount: 'asc' },
        },
      },
      orderBy: { stars: 'asc' },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
