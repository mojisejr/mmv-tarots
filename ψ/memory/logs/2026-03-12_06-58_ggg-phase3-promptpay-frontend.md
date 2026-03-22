---
type: snapshot
project: mmv-tarots
task_id: "#MMV-PAYMENT-REPLATFORM-2026-03"
status: active
tags: [snapshot, ggg, phase3, payment, promptpay, slipok, frontend]
related_files:
  - projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - projects/mmv-tarots/app/package/page.tsx
  - projects/mmv-tarots/components/features/payment/PaymentReceipt.tsx
---

# Snapshot: MMV Phase 3 PromptPay Frontend Rewire

**Time**: 2026-03-12 06:58 +0700
**Context**: Execute `ggg` Phase 3 from payment replatform blueprint by replacing Omise-centric modal flow with PromptPay order flow + SlipOK verification UX and refresh recovery.

## Evidence
- Hard Gate passed on Site (`projects/mmv-tarots`):
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅ (`155/155`)
- Runtime payment UI now consumes Phase 2 APIs directly:
  - `POST /api/payment/orders`
  - `POST /api/payment/orders/[id]/slip`
  - `GET /api/payment/orders/[id]/status`

## Key Changes
- `PaymentModal.tsx`: replaced method/card/3DS branching with order-driven state machine (`creating-order -> qr-display -> receipt/failed`).
- `PromptPayQR.tsx`: generates dynamic PromptPay QR on client, accepts slip URL submission, polls order status, and handles credited/rejected/expired transitions.
- `app/package/page.tsx`: restores active pending order from local storage after reload and resumes payment modal.
- `PaymentReceipt.tsx`: switched to order reference terminology for receipt details.
- Added QR dependencies: `promptpay-qr`, `qrcode`, `@types/qrcode`.

## Apply When
- Need payment UX that survives page refresh/network drop while preserving one active payment intent.
- Need migration path that can keep old backend endpoints alive temporarily while frontend moves to new order APIs.

## Next Actions
- Phase 4: remove Omise/Stripe runtime/API/test/dependency leftovers.
- Add first-party slip file upload endpoint if product wants direct file picker (current flow expects `slipImageUrl`).

## Tags
`snapshot` `ggg` `phase3` `mmv-tarots` `promptpay` `slipok` `frontend`
