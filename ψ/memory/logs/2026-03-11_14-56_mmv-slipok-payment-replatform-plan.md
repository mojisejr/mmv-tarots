# Snapshot: MMV Tarots Payment Replatform to PromptPay+SlipOK (Clean Cutover)

**Time**: 2026-03-11 14:56 +0700
**Context**: Blueprint to replace Omise/Stripe with PromptPay QR + SlipOK automation, full schema realignment, and codebase cleanup

---
type: plan
project: mmv-tarots
task_id: "#MMV-PAYMENT-REPLATFORM-2026-03"
status: active
tags: [plan, blueprint, payment, promptpay, slipok, cleanup]
related_files: [projects/mmv-tarots/app/package/page.tsx, projects/mmv-tarots/services/credit-service.ts, projects/mmv-tarots/prisma/schema.prisma]
---

## Objective
- Replace current gateway-dependent payment stack (Omise + legacy Stripe paths) with a PromptPay QR + SlipOK verification architecture that is simpler, robust under Thai market constraints, and fully integrated with LIFF, browser UX, and LINE OA notifications.

## Scope
- In Scope:
  - Replace payment checkout APIs with order-based PromptPay + SlipOK verification flow.
  - Redesign Prisma schema for order + verification + credit fulfillment idempotency.
  - Remove obsolete Stripe/Omise code paths, env vars, SDK usage, tests, and docs.
  - Rewire package UI from Omise modal to new payment flow with slip upload and status tracking.
  - Keep Credit/Stars business semantics intact (TOPUP ledger, referral/onboarding unaffected).
- Out of Scope:
  - Changing auth architecture (Better-Auth + LIFF gateway remains).
  - Repricing package strategy or referral business rules.
  - Deploy automation scripts outside existing CI workflow.

## Grounding Summary (Current State)
- Active runtime path today:
  - `app/package/page.tsx` -> `components/features/payment/PaymentModal.tsx` -> `/api/checkout/omise` -> `/api/checkout/omise/status` + `/api/webhooks/omise` -> `CreditService.addStars`.
- Legacy/parallel path still present:
  - `app/api/checkout/stripe/route.ts`, `app/api/webhooks/stripe/route.ts`.
- Schema coupling to old gateways:
  - `CreditTransaction.stripeSessionId`, `CreditTransaction.omiseChargeId`, `PackagePrice.stripePriceId`, `PackagePrice.omisePriceId`, and enum `PaymentMethod` with gateway-specific values.
- Relevant decisions from memory:
  - `#MMV-PAYMENT-PIVOT-01`: shift away from external approval bottlenecks to PromptPay + high-control flow.

## Target Architecture (Clean Replacement)
1. User selects package in `/package`.
2. Server creates `PaymentOrder` with fixed amount (THB + optional unique satang strategy) and expiry.
3. UI renders PromptPay QR (merchant/person PromptPay target + exact amount).
4. User uploads slip image (or sends to LIFF upload endpoint).
5. Server sends slip to SlipOK verification API.
6. On verification success, system performs idempotent fulfillment (`CreditService.addStars`) and marks order as `CREDITED`.
7. System emits confirmation to browser status and LINE OA notification pipeline.

## Proposed Data Model (Prisma Redesign)
### New/Updated Models
- `PaymentOrder` (new)
  - `id` (cuid), `userId` (FK), `packagePriceId` (FK), `amountTHB` (Decimal), `amountSatang` (Int), `currency`.
  - `status` enum `PaymentOrderStatus`: `PENDING_PAYMENT`, `SLIP_UPLOADED`, `VERIFYING`, `VERIFIED`, `REJECTED`, `EXPIRED`, `CREDITED`.
  - `expiresAt`, `verifiedAt`, `creditedAt`, `referenceCode`, `slipImageUrl`, `verificationProvider`, `verificationErrorCode`, `verificationErrorMessage`, `metadata`.
  - indexes: `[userId, createdAt]`, `[status, expiresAt]`, unique `referenceCode`.

- `CreditTransaction` (refactor)
  - Remove `stripeSessionId`, `omiseChargeId`.
  - Add `paymentOrderId` (FK nullable), `externalRef` (provider tx ref), `channel` enum `PaymentChannel`.
  - Preserve `TOPUP/PREDICTION/REFUND/ONBOARDING/REFERRAL` semantics.

- `PackagePrice` (cleanup)
  - Remove `stripePriceId`, `omisePriceId`.
  - Keep only package economics fields.

- Optional `PaymentVerificationLog` (new)
  - Append-only masked verification payloads for audit and dispute handling.

### Enum Changes
- Replace gateway-centric enum with:
  - `PaymentChannel`: `PROMPTPAY_QR`, `LINE_ADMIN_MANUAL`, `SYSTEM`.
  - `VerificationProvider`: `SLIP_OK`, `MANUAL_REVIEW`.

## Phases
### Phase 1: Domain & Schema Foundation
- Deliverables:
  - Prisma schema update (`PaymentOrder` + `CreditTransaction`/`PackagePrice` cleanup).
  - Migration mapping old Stripe/Omise refs to generic fields/metadata.
  - Service contracts: `payment-order-service`, `slip-verification-service`.
- Exit Criteria:
  - migration runs without data loss.
  - app compiles with new schema.
- Critical Test Cases:
  - existing DB migration with historical Stripe/Omise rows succeeds.
  - one payment order can link to one topup transaction.
  - duplicate fulfillment for same order is blocked idempotently.

### Phase 2: Backend API Replacement (PromptPay + SlipOK)
- Deliverables:
  - `POST /api/payment/orders`
  - `POST /api/payment/orders/[id]/slip`
  - `GET /api/payment/orders/[id]/status`
  - SlipOK adapter with timeout/retry/error normalization.
  - Fulfillment state machine + idempotent crediting.
  - Notification hooks for browser + LINE OA.
- Exit Criteria:
  - success path credits stars once.
  - failure path never credits.
- Critical Test Cases:
  - valid slip => order `CREDITED` and stars +N once.
  - duplicate webhook/retry/slip submit => still one credit transaction.
  - invalid/tampered slip => `REJECTED`, no credit.
  - expired order + late slip => rejected.

### Phase 3: Frontend Flow Rewire (LIFF + Browser)
- Deliverables:
  - Replace Omise-centric payment components with PromptPay + slip upload + status UI.
  - Update `app/package/page.tsx` and remove legacy chargeId polling dependency.
  - Ensure recovery UX when user refreshes/returns to payment page.
- Exit Criteria:
  - LIFF mobile and desktop browser top-up works end-to-end without Omise.js.
- Critical Test Cases:
  - upload slip and receive success with balance refresh.
  - unstable network does not duplicate submit or credit.
  - page reload recovers order status.

### Phase 4: Hard Cleanup (Stripe/Omise Removal)
- Deliverables:
  - Remove legacy API files:
    - `app/api/checkout/stripe/route.ts`
    - `app/api/webhooks/stripe/route.ts`
    - `app/api/checkout/omise/route.ts`
    - `app/api/checkout/omise/status/route.ts`
    - `app/api/webhooks/omise/route.ts`
  - Remove legacy runtime/types/scripts:
    - `lib/server/omise.ts`, `types/omise.d.ts`, `scripts/diagnose-omise.js`
  - Replace/retire Omise/Stripe tests; add new payment tests.
  - Remove npm deps `omise`, `stripe` and obsolete env references.
- Exit Criteria:
  - zero runtime references to stripe/omise in app/lib/services/components.
- Critical Test Cases:
  - CI catches stale imports.
  - package purchase flow still passes with new APIs.

### Phase 5: Verification, Rollout, Rollback Safety
- Deliverables:
  - Hard gate + smoke matrix + rollback playbook.
  - Event/log observability for verification and fulfillment.
  - merge checklist staging -> main.
- Exit Criteria:
  - build/lint/test green.
  - manual smoke green on LIFF mobile + mobile browser + desktop.
  - rollback steps documented and validated.
- Critical Test Cases:
  - provider timeout/failure scenario does not leak credit.
  - race conditions (double submit) remain idempotent.

## Risks & Countermeasures
- SlipOK downtime/latency.
  - Timeout + retry + explicit retryable failure state.
- Duplicate crediting race.
  - DB transaction lock + unique order-to-topup invariants.
- Schema cleanup breaks legacy analytics.
  - migration mapping to metadata and compatibility query/view.
- User support overhead for unreadable slip.
  - manual review/override path with full audit trail.

## Rollback Strategy
- Keep rollout behind `PAYMENT_FLOW_VERSION=v2` for initial deployment window.
- If KPIs degrade: switch flag back (if coexist window active) or rollback release tag + DB snapshot.
- Preserve `PaymentOrder` records for reconciliation.

## Verification Strategy (Hard Gate)
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Static sweep: `rg -n "stripe|omise|OMISE_|STRIPE_" app lib services components prisma types __tests__` (runtime refs should be zero after Phase 4).

## Cleanup Inventory Baseline
- Runtime/API: `app/api/checkout/stripe/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/checkout/omise/route.ts`, `app/api/checkout/omise/status/route.ts`, `app/api/webhooks/omise/route.ts`
- Service/Types: `lib/server/omise.ts`, `types/omise.d.ts`, Omise/Stripe metadata branches in `services/credit-service.ts`
- UI: `components/features/payment/PaymentModal.tsx`, `CardForm.tsx`, `PromptPayQR.tsx`, `MethodSelector.tsx`, `PaymentReceipt.tsx`
- Tests: `__tests__/integration/omise-checkout-route.test.ts`, `__tests__/lib/omise.test.ts`
- Dependencies/Env: package deps `omise`, `stripe`; env groups `OMISE_*`, `STRIPE_*`

## Handoff to Execution (`ggg`)
- Execute strict sequence Phase 1 -> Phase 5.
- Suggested branch: `feat/payment-replatform-slipok-clean-cutover` from `staging`.
- Do not start hard cleanup before Phase 2 and Phase 3 are green.

## Tags
`plan` `mmv-tarots` `payment-replatform` `promptpay` `slipok` `cleanup` `hard-gate`

---

## Execution Update (Phase 1)
- **Time**: 2026-03-11 23:21 +0700
- **Status**: DONE
- **Completed**:
  - Prisma domain refactor: `PaymentOrder`, `PaymentVerificationLog`, `PaymentChannel`, `VerificationProvider`, `PaymentOrderStatus`.
  - `CreditTransaction` migrated to generic refs (`paymentOrderId`, `externalRef`, `channel`).
  - `PackagePrice` cleaned from gateway-specific IDs.
  - Service contracts added: `payment-order-service`, `slip-verification-service`.
  - Hard Gate passed (`build`, `lint`, `test`).
- **Migration**: `20260311163000_payment_order_phase1` applied successfully in dev DB.

## Execution Update (Phase 2)
- **Time**: 2026-03-11 23:38 +0700
- **Status**: DONE
- **Completed**:
  - Added new APIs:
    - `POST /api/payment/orders`
    - `POST /api/payment/orders/[id]/slip`
    - `GET /api/payment/orders/[id]/status`
  - Implemented SlipOK adapter with timeout, retry, and normalized error mapping in `slip-verification-service`.
  - Added fulfillment state machine service with idempotent crediting and verification logs.
  - Added LINE OA notification hook service for credited events (optional, env-gated).
  - Added API tests for create-order, submit-slip, and order-status routes.
- **Hard Gate**:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (`155/155`)

## Execution Update (Phase 3)
- **Time**: 2026-03-12 06:58 +0700
- **Status**: DONE
- **Completed**:
  - Rewired `components/features/payment/PaymentModal.tsx` to PromptPay order flow (`POST /api/payment/orders`) and removed Omise/Card/3DS runtime path from the modal flow.
  - Rebuilt `components/features/payment/PromptPayQR.tsx` for dynamic PromptPay payload + QR rendering (client-side), slip submission (`POST /api/payment/orders/[id]/slip`), and order status polling (`GET /api/payment/orders/[id]/status`).
  - Added reload recovery in `app/package/page.tsx` via active-order snapshot so users can resume pending payment after page refresh/return.
  - Updated `components/features/payment/PaymentReceipt.tsx` and aligned component test to order-reference based receipt output.
  - Added dependencies for QR generation: `promptpay-qr`, `qrcode`, and `@types/qrcode`.
- **Hard Gate**:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (`155/155`)

## Execution Update (Phase 4)
- **Time**: 2026-03-12 07:10 +0700
- **Status**: DONE
- **Completed**:
  - Removed legacy API/webhook endpoints:
    - `app/api/checkout/stripe/route.ts`
    - `app/api/webhooks/stripe/route.ts`
    - `app/api/checkout/omise/route.ts`
    - `app/api/checkout/omise/status/route.ts`
    - `app/api/webhooks/omise/route.ts`
  - Removed legacy runtime/types/scripts:
    - `lib/server/omise.ts`
    - `types/omise.d.ts`
    - `scripts/diagnose-omise.js`
  - Removed obsolete Omise test/docs assets:
    - `__tests__/integration/omise-checkout-route.test.ts`
    - `__tests__/lib/omise.test.ts`
    - `docs/omise-local-promptpay-testing.md`
  - Removed legacy UI branches and exports:
    - deleted `components/features/payment/CardForm.tsx`, `components/features/payment/MethodSelector.tsx`
    - cleaned `components/features/payment/index.ts`
  - Cleaned dependency/config surface:
    - removed `omise`, `stripe` from `package.json`
    - removed `diagnose:omise` npm script
    - updated `package-lock.json`
    - removed `OMISE_*` env entries from `projects/mmv-tarots/.env`
  - Cleaned legacy metadata fallback in `services/credit-service.ts` (`omiseChargeId`, `stripeSessionId`).
- **Hard Gate**:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (`138/138`)

