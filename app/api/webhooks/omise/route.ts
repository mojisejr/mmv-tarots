/**
 * POST /api/webhooks/omise
 *
 * Phase 3 / Phase 5 bridge: Omise Webhook Handler
 *
 * Handles event: charge.complete
 *   → Idempotency check on omiseChargeId
 *   → Credits stars to user
 *   → Logs paymentMethod + chargeId for Dispute Defense
 *
 * Security: Omise recommends IP whitelist on the dashboard.
 * We additionally validate the event structure and metadata integrity here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { CreditService } from '@/services/credit-service';

interface OmiseWebhookEvent {
  object:     string;
  id:         string;
  key:        string;
  created_at: string;
  data: {
    object:         string;
    id:             string;
    status:         string;
    paid:           boolean;
    amount:         number;
    currency:       string;
    failure_code?:  string;
    failure_message?: string;
    source?: {
      id:   string;
      type: string;
    };
    metadata: Record<string, string>;
  };
}

export async function POST(req: NextRequest) {
  let event: OmiseWebhookEvent;

  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only handle charge.complete events
  if (event.key !== 'charge.complete') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const charge = event.data;

  // Validate event structure
  if (!charge || charge.object !== 'charge') {
    return NextResponse.json({ error: 'Invalid charge data' }, { status: 400 });
  }

  const chargeId = charge.id;
  console.log(`[Omise Webhook] 🔔 charge.complete — chargeId: ${chargeId}, status: ${charge.status}`);

  // Only process successful charges
  if (charge.status !== 'successful' || !charge.paid) {
    console.log(`[Omise Webhook] ⚠️  Charge not successful — status: ${charge.status}`);
    return NextResponse.json({ received: true, action: 'skipped_non_success' });
  }

  try {
    // ── Phase 3.3: Transaction Lock (Idempotency) ──────────────────────────────
    const existing = await db.creditTransaction.findUnique({
      where: { omiseChargeId: chargeId },
    });

    if (existing) {
      console.log(`[Omise Webhook] ✅ Already processed — chargeId: ${chargeId}`);
      return NextResponse.json({ received: true, action: 'already_processed' });
    }

    // Extract metadata sent during charge creation
    const { userId, stars, paymentMethod, priceId } = charge.metadata;

    if (!userId || !stars) {
      console.error(`[Omise Webhook] ❌ Missing metadata — chargeId: ${chargeId}`);
      return NextResponse.json(
        { error: 'Missing required metadata: userId or stars' },
        { status: 422 }
      );
    }

    // ── Credit Stars ────────────────────────────────────────────────────────────
    await CreditService.addStars(userId, parseInt(stars, 10), {
      omiseChargeId: chargeId,
      omiseSourceId: charge.source?.id ?? null,
      paymentMethod: paymentMethod ?? 'PROMPTPAY',
      packageId:     priceId  ?? null,
      amount:        charge.amount / 100,
      creditedVia:   'webhook',
    });

    console.log(
      `[Omise Webhook] 🚀 Stars credited — chargeId: ${chargeId}, userId: ${userId}, stars: ${stars}`
    );

    return NextResponse.json({
      received: true,
      action:   'stars_credited',
      chargeId,
      userId,
      stars:    parseInt(stars, 10),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error(`[Omise Webhook] ❌ Processing error — chargeId: ${chargeId}:`, message);
    // Return 500 so Omise retries the webhook
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
