import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/server/db';
import { CreditService } from '@/services/credit-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // จัดการ Event: checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`🔔 Processing Webhook for Session: ${session.id}`);

    try {
      // ตรวจสอบว่าประมวลผลแล้วหรือยัง (Idempotency Check)
      const existing = await db.creditTransaction.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existing) {
        console.log(`✅ Already processed: ${session.id}`);
        return NextResponse.json({ received: true });
      }

      const { userId, stars } = session.metadata || {};
      console.log(`📝 Metadata - UserID: ${userId}, Stars: ${stars}`);

      if (!userId || !stars) {
        console.error('❌ Missing metadata in session:', session.id);
        throw new Error('Missing metadata: userId or stars');
      }

      // เพิ่มดาวให้ User โดยใช้ CreditService
      console.log(`🚀 Attempting to add ${stars} stars to user ${userId}...`);
      await CreditService.addStars(userId, parseInt(stars, 10), {
        stripeSessionId: session.id,
        packageName: session.metadata?.packageId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
      });

      console.log(`✨ Stars added successfully for user: ${userId}`);
    } catch (error: any) {
      console.error('❌ Error processing webhook:', error.message);
      return NextResponse.json(
        { error: `Failed to process payment: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
