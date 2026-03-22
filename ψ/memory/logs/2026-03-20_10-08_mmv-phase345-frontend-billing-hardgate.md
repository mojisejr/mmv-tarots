# Snapshot: MMV Tarots Phase 3-4-5 Frontend Journey, Billing Surface & Hard Gate

**Time**: 2026-03-20 10:08 +0700
**Context**: Completed phases 3, 4, 5 of the single-draft-reuse payment order blueprint. All 5 phases now DONE.

## Tags
`mmv-tarots` `payment` `billing` `frontend` `draft-revival` `hard-gate` `phase-3` `phase-4` `phase-5`

## Evidence

### Phase 3: Frontend Journey Consistency
- `PaymentModal.tsx`: Added toast feedback (`toast.info('กู้คืนคำสั่งชำระเงินเดิมแล้ว')`) when API returns `reuseMode: 'revived'`
- `package/page.tsx`: Reviewed — restore logic already correct: EXPIRED clears localStorage, next buy triggers createOrder which auto-revives via backend
- No UX flow changes needed — backend handles revive transparently

### Phase 4: Billing Surface Alignment
- `billing-history-list.tsx`: Removed `showAll` checkbox from user-facing billing UI
- API endpoint `/api/payment/orders/me` still supports `showAll=true` param for internal/debug use
- Default visibility policy already excludes PENDING_PAYMENT/EXPIRED without slip evidence — no API changes needed
- Support CTA remains for REJECTED/EXPIRED/VERIFYING statuses (statuses with real business context)

### Phase 5: Hard Gate & Rollout Safety
- Build: ✅ pass
- Lint: ✅ pass
- Tests: ✅ 50/50 files, 269/269 tests pass
- Commit: `13eb774` on branch `staging`
- No schema changes required — revive operates on existing columns

### Manual Smoke Checklist (for production rollout)
1. เปิด package page → เลือกแพ็กเกจ → เปิด QR → ปล่อยหมดเวลา → เปิดซื้อใหม่ → ต้องได้ order เดิมถูก revive + toast "กู้คืน..."
2. ส่งสลิปบน revived order → verify/credit ได้ปกติ
3. เข้า billing page → ไม่เห็น duplicate waiting/paid pairs, ไม่มี showAll checkbox
4. ซื้อใหม่หลังเครดิตเข้าแล้ว → ต้องได้ order ใหม่จริง

## Apply When
- Rolling out single-draft-reuse feature to production
- Reviewing billing UX post-launch
- Debugging order lifecycle in production

## Next Actions
- Deploy to staging/preview environment for manual smoke testing
- Monitor `payment.order.revived` events in observability for adoption signal
- Consider legacy data cleanup (non-destructive archive of old duplicate no-slip drafts) as separate ops task
