---
type: snapshot
project: mmv-tarots
task_id: "#MMV-PAYMENT-REPLATFORM-2026-03"
status: active
tags: [snapshot, ggg, phase4, payment, cleanup, promptpay, slipok]
related_files:
  - projects/mmv-tarots/app/api/payment/orders/route.ts
  - projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - projects/mmv-tarots/services/credit-service.ts
  - projects/mmv-tarots/package.json
---

# Snapshot: MMV Phase 4 Legacy Gateway Cleanup

**Time**: 2026-03-12 07:11 +0700
**Context**: Execute `ggg` Phase 4 hard cleanup to remove Omise/Stripe runtime and keep payment stack focused on PromptPay QR + SlipOK verification.

## Evidence
- Removed legacy gateway endpoints and runtimes:
  - `app/api/checkout/omise/*`, `app/api/checkout/stripe/route.ts`
  - `app/api/webhooks/omise/route.ts`, `app/api/webhooks/stripe/route.ts`
  - `lib/server/omise.ts`, `types/omise.d.ts`, `scripts/diagnose-omise.js`
- Removed obsolete tests/docs and UI branches tied to old gateways:
  - `__tests__/integration/omise-checkout-route.test.ts`
  - `__tests__/lib/omise.test.ts`
  - `docs/omise-local-promptpay-testing.md`
  - `components/features/payment/CardForm.tsx`, `components/features/payment/MethodSelector.tsx`
- Dependency/config cleanup:
  - removed `omise`, `stripe`, and `diagnose:omise` from npm manifest
  - removed `OMISE_*` keys from local `.env` (local config cleanup)

## Apply When
- Migrating payment systems from multi-gateway legacy state to single flow architecture.
- Need to reduce accidental reintroduction risk by deleting runtime surface, tests, scripts, and type stubs together.

## Next Actions
- Phase 5 verification matrix on LIFF mobile + browser + desktop smoke.
- Add/refresh support docs for slip URL upload and manual review fallback path.

## Tags
`snapshot` `ggg` `phase4` `mmv-tarots` `cleanup` `promptpay` `slipok`
