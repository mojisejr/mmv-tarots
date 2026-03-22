# Snapshot: MMV Tarots Draft-Reuse Phase 1+2 Implementation Complete

**Time**: 2026-03-20 09:14 +0700
**Context**: Implemented Phase 1 (Lifecycle Contract Hardening) and Phase 2 (Create-Order API Integration) of the single-draft reuse payment order plan. The system now revives expired drafts instead of creating duplicate rows.

## Tags
- mmv-tarots, payment, draft-reuse, revive, lifecycle, phase1, phase2

## Evidence
- **Commit**: `709d791` on `staging` branch — `feat(payment): implement draft-reuse lifecycle + revive API (phase 1+2)`
- **Files changed** (4):
  - `lib/server/services/payment-order-service.ts` — added `findReusableDraftOrder()`, `reviveDraftOrder()`, `reuseMode` field, slip-evidence guard
  - `app/api/payment/orders/route.ts` — 3-path resolution: active → revive → new; emits `payment.order.revived` event
  - `__tests__/services/payment-order-service.test.ts` — new: 8 tests covering reuse/revive/guard logic
  - `__tests__/api/payment-orders-route.test.ts` — updated + 4 new tests for revive API path
- **Hard Gate**: build ✅ | lint ✅ | targeted tests 16/16 ✅ | broader payment tests 22/22 ✅

## Apply When
- ต้องการเข้าใจ semantics ของ draft-reuse: `findReusableDraftOrder()` ค้นหา expired/pending draft ที่ไม่มี slip evidence, verification logs, หรือ creditedAt
- `reviveDraftOrder()` รีเซ็ต draft เป็น PENDING_PAYMENT + expiry ใหม่ คง referenceCode เดิม
- API response เพิ่ม `reuseMode: 'active' | 'revived' | 'new'` แบบ backward-compatible (ยังมี `reused: boolean`)

## Next Actions
- Phase 3: Frontend Journey Consistency — ทบทวน PaymentModal + package/page.tsx ให้เข้ากับ revive semantics
- Phase 4: Billing Surface Alignment — ปรับ billing list ไม่ให้ user เห็น duplicate waiting drafts
- Phase 5: Rollout Safety + Hard Gate ครบ
