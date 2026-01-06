import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/server/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1. Fetch Price with Package info
    const price = await db.packagePrice.findUnique({
      where: { id: priceId },
      include: { package: true },
    });

    if (!price || !price.active || !price.package.active) {
      return NextResponse.json(
        { error: 'Price or Package not found or inactive' },
        { status: 404 }
      );
    }

    // 2. Validate Promo Eligibility
    if (price.isPromo) {
      const previousTopups = await db.creditTransaction.count({
        where: {
          userId,
          type: 'TOPUP',
          status: 'SUCCESS',
        },
      });

      if (previousTopups > 0) {
        return NextResponse.json(
          { error: 'This promotion is for new customers only.' },
          { status: 403 }
        );
      }
    }

    // 3. Create Stripe Checkout Session
    // Note: In production, use price.stripePriceId directly if pre-created in Stripe.
    // Here we use dynamic price_data for flexibility with dummy IDs.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price_data: {
            currency: price.currency,
            product_data: {
              name: `${price.package.name} (${price.package.stars} Stars)`,
              description: price.package.description || undefined,
            },
            unit_amount: Math.round(price.amount * 100), // Convert to satang
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/package?canceled=true`,
      metadata: {
        userId,
        packageId: price.packageId,
        priceId: price.id,
        stars: price.package.stars.toString(),
        isPromo: price.isPromo ? 'true' : 'false',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
