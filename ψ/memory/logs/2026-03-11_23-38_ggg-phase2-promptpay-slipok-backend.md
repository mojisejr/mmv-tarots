---
type: snapshot
project: mmv-tarots
task_id: "#MMV-PAYMENT-REPLATFORM-2026-03"
status: active
tags: [snapshot, ggg, payment, promptpay, slipok, phase2]
related_files:
  - projects/mmv-tarots/app/api/payment/orders/route.ts
  - projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - projects/mmv-tarots/app/api/payment/orders/[id]/status/route.ts
  - projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
  - projects/mmv-tarots/lib/server/services/slip-verification-service.ts
---

# Snapshot: MMV Tarots Phase 2 PromptPay + SlipOK Backend Complete

**Time**: 2026-03-11 23:38 +0700
**Context**: Executed `ggg` for Phase 2 backend replacement (order create, slip submit, status poll, verification adapter, idempotent fulfillment)

## Evidence
- New APIs implemented:
  - `POST /api/payment/orders`
  - `POST /api/payment/orders/[id]/slip`
  - `GET /api/payment/orders/[id]/status`
- Slip verification integrated via adapter with timeout/retry/normalized provider error handling.
- Fulfillment state machine now records verification logs and credits stars idempotently.
- Optional LINE OA push hook added for credit-success notifications.
- Tests added for all three new API routes.
- Hard Gate result:
  - `npm run build`: PASS
  - `npm run lint`: PASS
  - `npm run test`: PASS (`155/155`)
- Commit: `9ac7165` (`feat(payment): phase2 promptpay-slipok backend APIs #MMV-PAYMENT-REPLATFORM-2026-03`)

## Next Actions
- Start Phase 3: rewire package UI from Omise flow to payment-order + slip-upload flow.
- Keep legacy Omise/Stripe APIs intact until Phase 3 is green, then remove in Phase 4.

## Tags
`snapshot` `ggg` `mmv-tarots` `phase2` `payment-replatform` `promptpay` `slipok` `idempotency`
