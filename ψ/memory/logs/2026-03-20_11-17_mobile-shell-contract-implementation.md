# Snapshot: Mobile Shell Contract + Z-Index Hierarchy + QR Save — Phase 1-3 Implementation

**Time**: 2026-03-20 11:17 +0700
**Context**: Implemented Phases 1, 2, 3 of the mmv-mobile-bottom-nav-safe-area remediation plan (Option B). Commit `6e9a9c1` on branch `staging`.

---

## Evidence

### Phase 1: Ground Truth Shell Contract
- Added CSS custom properties to `app/globals.css`:
  - `--mobile-bottom-nav-height: 80px`
  - `--mobile-bottom-nav-margin: 16px`
  - `--mobile-bottom-clearance: calc(80px + 16px + env(safe-area-inset-bottom, 0px))`
  - Z-index tokens: `--z-content: 1`, `--z-bottom-nav: 50`, `--z-toast: 60`, `--z-overlay: 70`, `--z-modal: 80`, `--z-critical-overlay: 100`
- Updated `app/layout.tsx` `<main>` from `pb-[env(safe-area-inset-bottom)]` to `pb-[var(--mobile-bottom-clearance)] md:pb-0`
- Removed scattered `pb-24` from `app/package/page.tsx`, `app/billing/page.tsx`, `app/transactions/page.tsx` — now handled globally by shell
- Policy pages (`privacy`, `refund`, `terms`) automatically protected via layout clearance

### Phase 2: Layering & Modal Safety
- `components/layout/bottom-nav.tsx`: `z-50` → `z-[var(--z-bottom-nav)]`
- `components/ui/modal.tsx`: `z-50` → `z-[var(--z-modal)]` (80 > 50 = modal always above nav)
- No more z-index collision between Modal and BottomNav

### Phase 3: One-Device Payment UX
- Added `handleSaveQR` callback to `PromptPayQR.tsx`: blob download with LIFF fallback (window.open)
- Added "บันทึก QR" button with Download icon below QR code
- Updated copy: "สแกน QR ด้านบน หรือบันทึกไว้เปิดในแอปธนาคาร"

### Hard Gate Results
- Build: ✅
- Lint: ✅
- Test: 50 files, 269 tests — ALL PASSED

### Files Touched (8)
- `app/globals.css` — token definitions
- `app/layout.tsx` — shell clearance
- `components/layout/bottom-nav.tsx` — z-index token
- `components/ui/modal.tsx` — z-index token
- `app/package/page.tsx` — remove pb-24
- `app/billing/page.tsx` — remove pb-24
- `app/transactions/page.tsx` — remove pb-24
- `components/features/payment/PromptPayQR.tsx` — QR save button

## Apply When
- เพิ่มหน้าใหม่ที่อยู่ใต้ BottomNav → ไม่ต้องจำ magic number, layout shell จัดการให้แล้ว
- เพิ่ม overlay/modal ใหม่ → ใช้ `var(--z-modal)` หรือ `var(--z-overlay)` เพื่อให้อยู่เหนือ nav เสมอ
- แก้ UI overlap issues → ตรวจ token hierarchy ก่อนเพิ่ม z-index ใหม่

## Next Actions
- Phase 4: สร้าง `MobilePageShell` component + migrate standard pages
- Phase 5: Manual smoke test บน mobile viewports 375x667, 390x844, 430x932
- ตรวจ produced build บน LIFF ว่า QR save/download ทำงานจริง

## Tags
`implementation` `mmv-tarots` `mobile-shell` `bottom-nav` `safe-area` `z-index` `payment` `qr-save` `design-tokens`
