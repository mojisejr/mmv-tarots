/**
 * POST /api/checkout/omise
 *
 * Phase 3: Omise Charge Service
 *
 * Supported flows:
 *   PROMPTPAY  — Creates a PromptPay source → charges → returns QR image URL
 *   CARD       — Receives card token from client-side Omise.js → creates a charge
 *                Returns authorize_uri if 3DS redirect is required, else success
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { getOmiseClient, getOmiseConfigState, toSatang } from '@/lib/server/omise';
import { CreditService } from '@/services/credit-service';
import {
  capturePaymentException,
  emitPaymentEvent,
  notifyPaymentAlert,
} from '@/lib/server/payment-observability';
import { paymentDebug } from '@/lib/server/payment-debug';

// ── Request schema ─────────────────────────────────────────────────────────────
const CheckoutSchema = z.object({
  priceId:       z.string().min(1),
  userId:        z.string().min(1),
  paymentMethod: z.enum(['PROMPTPAY', 'CARD']),
  // Required only for CARD flow — token created client-side via Omise.js
  token:         z.string().optional(),
  // Optional owner name for PromptPay receipt
  ownerName:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    paymentDebug('omise.checkout', 'request.received');

    const omiseConfigState = getOmiseConfigState();
    const omise = getOmiseClient();

    if (!omise || !omiseConfigState.ready) {
      paymentDebug('omise.checkout', 'gateway.not_ready', {
        reason: omiseConfigState.reason ?? 'Omise client initialization failed',
      });
      return NextResponse.json(
        {
          error: 'Payment gateway is not configured',
          reason: omiseConfigState.reason ?? 'Omise client initialization failed',
        },
        { status: 503 }
      );
    }

    // 1. Parse & validate request body
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      paymentDebug('omise.checkout', 'request.validation_failed', {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { priceId, userId, paymentMethod, token, ownerName } = parsed.data;
    paymentDebug('omise.checkout', 'request.validated', {
      paymentMethod,
      priceId,
      userId,
      hasOwnerName: Boolean(ownerName),
      hasToken: Boolean(token),
    });

    // 2. Validate CARD requires token
    if (paymentMethod === 'CARD' && !token) {
      paymentDebug('omise.checkout', 'card.missing_token', {
        userId,
        priceId,
      });
      return NextResponse.json(
        { error: 'Card token is required for CARD payment' },
        { status: 400 }
      );
    }

    // 3. Fetch PackagePrice + StarPackage
    const price = await db.packagePrice.findUnique({
      where: { id: priceId },
      include: { package: true },
    });

    if (!price || !price.active || !price.package.active) {
      paymentDebug('omise.checkout', 'price.not_found_or_inactive', {
        userId,
        priceId,
        hasPrice: Boolean(price),
        priceActive: price?.active ?? false,
        packageActive: price?.package?.active ?? false,
      });
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // 4. Promo eligibility guard
    if (price.isPromo) {
      const previousTopups = await db.creditTransaction.count({
        where: { userId, type: 'TOPUP', status: 'SUCCESS' },
      });
      if (previousTopups > 0) {
        paymentDebug('omise.checkout', 'promo.blocked_existing_customer', {
          userId,
          priceId,
          previousTopups,
        });
        return NextResponse.json(
          { error: 'This promotion is for new customers only.' },
          { status: 403 }
        );
      }
    }

    const amountSatang = toSatang(price.amount);
    const currency = price.currency.toLowerCase();
    const description = `${price.package.name} — ${price.package.stars} Stars`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    const chargeMetadata: Record<string, string> = {
      userId,
      priceId,
      packageId:     price.packageId,
      stars:         price.package.stars.toString(),
      isPromo:       price.isPromo ? 'true' : 'false',
      paymentMethod,
    };

    // ──────────────────────────────────────────────────────────────────────────
    // PROMPTPAY FLOW
    // ──────────────────────────────────────────────────────────────────────────
    if (paymentMethod === 'PROMPTPAY') {
      paymentDebug('omise.checkout.promptpay', 'source.create.start', {
        userId,
        priceId,
        amountSatang,
        currency,
        hasOwnerName: Boolean(ownerName),
      });

      // Step A: Create PromptPay source
      const source = await omise.sources.create({
        type:     'promptpay',
        amount:   amountSatang,
        currency: currency,
        name:     ownerName,
      });

      paymentDebug('omise.checkout.promptpay', 'source.create.success', {
        sourceId: source.id,
      });

      // Step B: Create charge from source
      const charge = await omise.charges.create({
        amount:      amountSatang,
        currency:    currency,
        source:      source.id,
        description: description,
        return_uri:  `${appUrl}/profile?payment=success&chargeId=${'{charge_id}'}`,
        metadata:    chargeMetadata,
      });

      paymentDebug('omise.checkout.promptpay', 'charge.create.success', {
        chargeId: charge.id,
        status: charge.status,
        hasQrImageUrl: Boolean(source.scannable_code?.image?.download_uri),
      });

      const qrImageUrl =
        source.scannable_code?.image?.download_uri ?? null;

      emitPaymentEvent('omise.charge.created', {
        paymentMethod,
        chargeId: charge.id,
        userId,
        priceId,
        status: charge.status,
      });

      return NextResponse.json({
        success:      charge.status !== 'failed',
        chargeId:     charge.id,
        chargeStatus: charge.status,
        qrImageUrl,
        amount:       price.amount,
        currency:     price.currency,
        packageName:  price.package.name,
        stars:        price.package.stars,
        expiresAt:    charge.expires_at ?? null,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CARD FLOW
    // ──────────────────────────────────────────────────────────────────────────
    if (paymentMethod === 'CARD') {
      paymentDebug('omise.checkout.card', 'charge.create.start', {
        userId,
        priceId,
        amountSatang,
        currency,
        hasToken: Boolean(token),
      });

      const charge = await omise.charges.create({
        amount:      amountSatang,
        currency:    currency,
        card:        token!, // Client-side Omise.js token
        description: description,
        return_uri:  `${appUrl}/profile?payment=success&chargeId=${'{charge_id}'}`,
        metadata:    chargeMetadata,
        capture:     true,
      });

      paymentDebug('omise.checkout.card', 'charge.create.success', {
        chargeId: charge.id,
        status: charge.status,
        paid: charge.paid,
        hasAuthorizeUri: Boolean(charge.authorize_uri),
      });

      // Immediate success (prioritized even if authorize_uri exists in test mode)
      if (charge.status === 'successful' && charge.paid) {
        paymentDebug('omise.checkout.card', 'charge.success', {
          chargeId: charge.id,
          userId,
          priceId,
        });

        try {
          await CreditService.addStars(userId, price.package.stars, {
            omiseChargeId: charge.id,
            paymentMethod: 'CARD',
            packageId: price.id,
            amount: price.amount,
            creditedVia: 'direct_checkout',
          });

          paymentDebug('omise.checkout.card', 'credit.success', {
            chargeId: charge.id,
            userId,
            stars: price.package.stars,
          });
        } catch (creditError: unknown) {
          if (
            creditError instanceof Prisma.PrismaClientKnownRequestError &&
            creditError.code === 'P2002'
          ) {
            paymentDebug('omise.checkout.card', 'credit.already_processed', {
              chargeId: charge.id,
              userId,
            });
          } else {
            throw creditError;
          }
        }

        emitPaymentEvent('omise.card.success', {
          chargeId: charge.id,
          userId,
          priceId,
        });

        return NextResponse.json({
          success:      true,
          chargeId:     charge.id,
          chargeStatus: charge.status,
          stars:        price.package.stars,
          packageName:  price.package.name,
        });
      }

      // 3DS redirect required
      if (charge.authorize_uri) {
        paymentDebug('omise.checkout.card', 'charge.requires_3ds', {
          chargeId: charge.id,
          userId,
          priceId,
        });
        emitPaymentEvent('omise.card.requires_3ds', {
          chargeId: charge.id,
          userId,
          priceId,
        });

        return NextResponse.json({
          success:      false,
          requires3DS:  true,
          authorizeUri: charge.authorize_uri,
          chargeId:     charge.id,
        });
      }

      // Failed
      paymentDebug('omise.checkout.card', 'charge.failed', {
        chargeId: charge.id,
        userId,
        priceId,
        failureCode: charge.failure_code ?? 'unknown',
      });
      emitPaymentEvent('omise.card.failed', {
        chargeId: charge.id,
        userId,
        priceId,
        failureCode: charge.failure_code ?? 'unknown',
      });

      await notifyPaymentAlert({
        title: 'Omise card charge failed',
        severity: 'warning',
        details: {
          chargeId: charge.id,
          userId,
          priceId,
          failureCode: charge.failure_code ?? 'unknown',
        },
      });

      return NextResponse.json({
        success:        false,
        chargeId:       charge.id,
        chargeStatus:   charge.status,
        failureCode:    charge.failure_code    ?? 'unknown',
        failureMessage: charge.failure_message ?? 'Payment failed',
      }, { status: 402 });
    }

    return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    paymentDebug('omise.checkout', 'request.exception', {
      message,
    });
    capturePaymentException('omise.checkout.create_charge', error);
    await notifyPaymentAlert({
      title: 'Omise checkout API error',
      severity: 'critical',
      details: { message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
