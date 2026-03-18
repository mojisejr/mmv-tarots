-- Phase 1 additive migration for source-aware referral semantics.
-- Safe strategy: add nullable columns and enums first; backfill and tighten in later slices.

CREATE TYPE "ReferralSource" AS ENUM ('LINK', 'MANUAL_CODE');

CREATE TYPE "ReferralEligibilityState" AS ENUM (
  'PENDING_FIRST_PREDICTION',
  'GRANTED',
  'BLOCKED',
  'CANCELED'
);

ALTER TABLE "referral_history"
ADD COLUMN "source" "ReferralSource",
ADD COLUMN "eligibility_state" "ReferralEligibilityState";

CREATE INDEX "referral_history_source_idx" ON "referral_history"("source");
CREATE INDEX "referral_history_eligibility_state_idx" ON "referral_history"("eligibility_state");
