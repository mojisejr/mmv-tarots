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
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { CreditService } from '@/services/credit-service';
import { getOmiseClient } from '@/lib/server/omise';
import {
  capturePaymentException,
  emitPaymentEvent,
  notifyPaymentAlert,
} from '@/lib/server/payment-observability';
import { paymentDebug } from '@/lib/server/payment-debug';

export async function GET(req: NextRequest) {
  try {
    paymentDebug('omise.status', 'request.received');

    const omise = getOmiseClient();

    if (!omise) {
      paymentDebug('omise.status', 'gateway.not_ready');
      return NextResponse.json(
        { error: 'Payment gateway is not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      paymentDebug('omise.status', 'request.missing_charge_id');
      return NextResponse.json({ error: 'chargeId is required' }, { status: 400 });
    }

    paymentDebug('omise.status', 'request.validated', { chargeId });

    // Fetch latest charge status from Omise
    const charge = await omise.charges.retrieve(chargeId);
    paymentDebug('omise.status', 'charge.retrieved', {
      chargeId: charge.id,
      status: charge.status,
      paid: charge.paid,
    });

    // ── Phase 3.3: Transaction Lock (Double-spend prevention) ─────────────────
    // Check if we already credited this charge (from Webhook or previous poll)
    const existing = await db.creditTransaction.findUnique({
      where: { externalRef: chargeId },
    });

    paymentDebug('omise.status', 'credit.lookup', {
      chargeId,
      alreadyCredited: Boolean(existing),
    });

    if (charge.status === 'successful' && !existing) {
      // Credit stars — idempotent: only runs if not yet credited
      const { userId, stars, paymentMethod, priceId } = charge.metadata;

      if (userId && stars) {
        paymentDebug('omise.status', 'credit.apply.start', {
          chargeId,
          userId,
          stars,
          paymentMethod: paymentMethod ?? 'PROMPTPAY',
        });
        try {
          await CreditService.addStars(userId, parseInt(stars, 10), {
            externalRef:  chargeId,
            channel:      paymentMethod === 'PROMPTPAY' ? 'PROMPTPAY_QR' : 'SYSTEM',
            omiseChargeId: chargeId,
            omiseSourceId: charge.source?.id ?? null,
            paymentMethod: paymentMethod ?? 'PROMPTPAY',
            packageId:     priceId ?? null,
            amount:        charge.amount / 100,
            creditedVia:   'status-poll',
          });
          paymentDebug('omise.status', 'credit.apply.success', {
            chargeId,
            userId,
            stars: parseInt(stars, 10),
          });
          emitPaymentEvent('omise.poll.credited', {
            chargeId,
            userId,
            stars: parseInt(stars, 10),
            paymentMethod: paymentMethod ?? 'PROMPTPAY',
          });
        } catch (creditError: unknown) {
          if (
            creditError instanceof Prisma.PrismaClientKnownRequestError &&
            creditError.code === 'P2002'
          ) {
            paymentDebug('omise.status', 'credit.already_processed', {
              chargeId,
              userId,
            });
          } else {
            throw creditError;
          }
        }
      }
    }

    if (charge.status === 'failed') {
      paymentDebug('omise.status', 'charge.failed', {
        chargeId,
        failureCode: charge.failure_code ?? 'unknown',
      });
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
    paymentDebug('omise.status', 'request.exception', { message });
    capturePaymentException('omise.status.poll', error);
    await notifyPaymentAlert({
      title: 'Omise status polling failed',
      severity: 'warning',
      details: { message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
