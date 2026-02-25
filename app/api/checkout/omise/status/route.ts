/**
 * GET /api/checkout/omise/status?chargeId=chrg_xxx
 *
 * Polling endpoint for PromptPay payment status.
 * Client polls every 3-5 seconds until status = 'successful' | 'failed' | 'expired'
 *
 * Phase 3 — Transaction Integrity:
 * When charge becomes 'successful', stars are credited idempotently
 * (if not already credited by webhook).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { CreditService } from '@/services/credit-service';
import { getOmiseClient } from '@/lib/server/omise';
import {
  capturePaymentException,
  emitPaymentEvent,
  notifyPaymentAlert,
} from '@/lib/server/payment-observability';

export async function GET(req: NextRequest) {
  try {
    const omise = getOmiseClient();

    if (!omise) {
      return NextResponse.json(
        { error: 'Payment gateway is not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      return NextResponse.json({ error: 'chargeId is required' }, { status: 400 });
    }

    // Fetch latest charge status from Omise
    const charge = await omise.charges.retrieve(chargeId);

    // ── Phase 3.3: Transaction Lock (Double-spend prevention) ─────────────────
    // Check if we already credited this charge (from Webhook or previous poll)
    const existing = await db.creditTransaction.findUnique({
      where: { omiseChargeId: chargeId },
    });

    if (charge.status === 'successful' && !existing) {
      // Credit stars — idempotent: only runs if not yet credited
      const { userId, stars, paymentMethod, priceId } = charge.metadata;

      if (userId && stars) {
        await CreditService.addStars(userId, parseInt(stars, 10), {
          omiseChargeId:  chargeId,
          omiseSourceId:  charge.source?.id ?? null,
          paymentMethod:  paymentMethod ?? 'PROMPTPAY',
          packageId:      priceId ?? null,
          amount:         charge.amount / 100,
          creditedVia:    'status-poll',
        });
        emitPaymentEvent('omise.poll.credited', {
          chargeId,
          userId,
          stars: parseInt(stars, 10),
          paymentMethod: paymentMethod ?? 'PROMPTPAY',
        });
      }
    }

    if (charge.status === 'failed') {
      emitPaymentEvent('omise.poll.failed', {
        chargeId,
        failureCode: charge.failure_code ?? 'unknown',
      });
    }

    return NextResponse.json({
      chargeId:    charge.id,
      status:      charge.status,
      paid:        charge.paid,
      amount:      charge.amount / 100,
      currency:    charge.currency,
      credited:    !!existing || (charge.status === 'successful'),
      failureCode: charge.failure_code    ?? null,
      failureMsg:  charge.failure_message ?? null,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    capturePaymentException('omise.status.poll', error);
    await notifyPaymentAlert({
      title: 'Omise status polling failed',
      severity: 'warning',
      details: { message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
