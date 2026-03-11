-- Phase 1: Payment domain foundation
-- - Add payment_orders + payment_verification_logs
-- - Refactor credit_transactions to generic references
-- - Remove gateway-specific ids from package_prices

-- Enums
CREATE TYPE "PaymentChannel" AS ENUM ('PROMPTPAY_QR', 'LINE_ADMIN_MANUAL', 'SYSTEM');
CREATE TYPE "VerificationProvider" AS ENUM ('SLIP_OK', 'MANUAL_REVIEW');
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING_PAYMENT', 'SLIP_UPLOADED', 'VERIFYING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'CREDITED');

-- payment_orders
CREATE TABLE "payment_orders" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "packagePriceId" TEXT NOT NULL,
  "amountTHB" DECIMAL(10,2) NOT NULL,
  "amountSatang" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'THB',
  "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "referenceCode" TEXT NOT NULL,
  "slipImageUrl" TEXT,
  "verificationProvider" "VerificationProvider",
  "verificationErrorCode" TEXT,
  "verificationErrorMessage" TEXT,
  "metadata" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "creditedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- payment_verification_logs
CREATE TABLE "payment_verification_logs" (
  "id" TEXT NOT NULL,
  "paymentOrderId" TEXT NOT NULL,
  "provider" "VerificationProvider" NOT NULL,
  "status" TEXT NOT NULL,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_verification_logs_pkey" PRIMARY KEY ("id")
);

-- credit_transactions refactor
ALTER TABLE "credit_transactions"
ADD COLUMN "paymentOrderId" TEXT,
ADD COLUMN "externalRef" TEXT,
ADD COLUMN "channel" "PaymentChannel";

-- Migrate legacy refs to the new generic field
UPDATE "credit_transactions"
SET "externalRef" = COALESCE("omiseChargeId", "stripeSessionId")
WHERE "externalRef" IS NULL
  AND ("omiseChargeId" IS NOT NULL OR "stripeSessionId" IS NOT NULL);

-- Keep old gateway identifiers in metadata for audit trail before dropping columns
UPDATE "credit_transactions"
SET "metadata" = jsonb_strip_nulls(
  jsonb_build_object(
    'legacyStripeSessionId', "stripeSessionId",
    'legacyOmiseChargeId', "omiseChargeId",
    'legacyPaymentMethod', "paymentMethod"
  ) || COALESCE("metadata", '{}'::jsonb)
)
WHERE "stripeSessionId" IS NOT NULL
   OR "omiseChargeId" IS NOT NULL
   OR "paymentMethod" IS NOT NULL;

ALTER TABLE "credit_transactions"
DROP COLUMN "stripeSessionId",
DROP COLUMN "omiseChargeId",
DROP COLUMN "paymentMethod";

DROP TYPE "PaymentMethod";

-- package_prices cleanup
ALTER TABLE "package_prices"
DROP COLUMN "stripePriceId",
DROP COLUMN "omisePriceId";

-- Indexes and constraints
CREATE UNIQUE INDEX "credit_transactions_paymentOrderId_key" ON "credit_transactions"("paymentOrderId");
CREATE UNIQUE INDEX "credit_transactions_externalRef_key" ON "credit_transactions"("externalRef");
CREATE INDEX "credit_transactions_channel_createdAt_idx" ON "credit_transactions"("channel", "createdAt");

CREATE UNIQUE INDEX "payment_orders_referenceCode_key" ON "payment_orders"("referenceCode");
CREATE INDEX "payment_orders_userId_createdAt_idx" ON "payment_orders"("userId", "createdAt");
CREATE INDEX "payment_orders_status_expiresAt_idx" ON "payment_orders"("status", "expiresAt");
CREATE INDEX "payment_verification_logs_paymentOrderId_createdAt_idx" ON "payment_verification_logs"("paymentOrderId", "createdAt");

-- FKs
ALTER TABLE "credit_transactions"
ADD CONSTRAINT "credit_transactions_paymentOrderId_fkey"
FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_orders"
ADD CONSTRAINT "payment_orders_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_orders"
ADD CONSTRAINT "payment_orders_packagePriceId_fkey"
FOREIGN KEY ("packagePriceId") REFERENCES "package_prices"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_verification_logs"
ADD CONSTRAINT "payment_verification_logs_paymentOrderId_fkey"
FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
