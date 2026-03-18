# MMV Profile Split Phase 5 Rollout Checklist

## Context
- Plan: #mmv-profile-transactions-billing-split
- Phase: 5 (Hard Gate + Rollout)
- Date: 2026-03-18

## Hard Gate Evidence
- Build: PASS (`npm run build`)
- Lint: PASS (`npm run lint`)
- Test: PASS (`npm run test`)
- Test summary: 42 files passed, 212 tests passed

## Smoke Checklist
- [x] `/profile -> /billing` path remains available (covered by `__tests__/app/profile-page-phase1.test.tsx` and page link contract)
- [x] Billing surface remains healthy for authenticated/empty/unauthorized paths (covered by `__tests__/app/billing-page-phase4.test.tsx`)
- [x] Payment lifecycle endpoints remain stable (`orders`, `orders/[id]/status`, `orders/[id]/slip`, `orders/me` API suites)
- [x] `/history` remains the primary prediction history route (protected route + redirect behavior retained)

## Rollout Note
- This checklist confirms hard-gate and regression coverage for Phase 5 closeout in CI/dev context.
- If production release is planned, run a live-device pass (LINE LIFF + mobile browser) before final push.

## References
- `__tests__/app/profile-page-phase1.test.tsx`
- `__tests__/app/billing-page-phase4.test.tsx`
- `__tests__/api/payment-orders-route.test.ts`
- `__tests__/api/payment-order-status-route.test.ts`
- `__tests__/api/payment-order-slip-route.test.ts`
- `__tests__/api/payment-orders-me-route.test.ts`
