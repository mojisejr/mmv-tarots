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
import { db } from '@/lib/server/db';
import { getOmiseClient, toSatang } from '@/lib/server/omise';

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
    const omise = getOmiseClient();

    if (!omise) {
      return NextResponse.json(
        { error: 'Payment gateway is not configured' },
        { status: 503 }
      );
    }

    // 1. Parse & validate request body
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { priceId, userId, paymentMethod, token, ownerName } = parsed.data;

    // 2. Validate CARD requires token
    if (paymentMethod === 'CARD' && !token) {
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
        return NextResponse.json(
          { error: 'This promotion is for new customers only.' },
          { status: 403 }
        );
      }
    }

    const amountSatang = toSatang(price.amount);
    const currency = price.currency.toUpperCase();
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
      // Step A: Create PromptPay source
      const source = await omise.sources.create({
        type:     'promptpay',
        amount:   amountSatang,
        currency: currency,
        name:     ownerName,
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

      const qrImageUrl =
        source.scannable_code?.image?.download_uri ?? null;

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
      const charge = await omise.charges.create({
        amount:      amountSatang,
        currency:    currency,
        card:        token!, // Client-side Omise.js token
        description: description,
        return_uri:  `${appUrl}/profile?payment=success`,
        metadata:    chargeMetadata,
        capture:     true,
      });

      // 3DS redirect required
      if (charge.authorize_uri) {
        return NextResponse.json({
          success:      false,
          requires3DS:  true,
          authorizeUri: charge.authorize_uri,
          chargeId:     charge.id,
        });
      }

      // Immediate success (no 3DS)
      if (charge.status === 'successful' && charge.paid) {
        return NextResponse.json({
          success:      true,
          chargeId:     charge.id,
          chargeStatus: charge.status,
          stars:        price.package.stars,
          packageName:  price.package.name,
        });
      }

      // Failed
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
    console.error('[/api/checkout/omise] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
