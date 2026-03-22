---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, referral, liff, phase-c]
related_files: [projects/mmv-tarots/app/liff/page.tsx, projects/mmv-tarots/__tests__/lib/liff-phase1.test.ts]
---

# Snapshot: Phase C LIFF Gateway Compatibility

**Time**: 2026-03-12 23:08:09 +0700
**Context**: Implement `ggg phase C` for universal-referral flow in `mmv-tarots`, focused on preserving referral context across LIFF gateway transitions without changing entitlement business rules.

## Tags
- mmv-tarots
- universal-referral
- phase-c
- liff-gateway
- context-recovery

## Evidence
- Added durable referral recovery in `resolveDurableGatewayTarget(...)` by deriving fallback `ref` from persisted target.
- Preserved no-override rule: explicit `ref` in current target remains authoritative.
- Hard Gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm test` (`25 files`, `142 tests`)

## Apply When
- Use this pattern when OAuth/LIFF redirect keeps path state but drops referral query context.
- Keep target safety rules unchanged (internal path only, reject external URL state).

## Next Actions
- Phase D: align share surfaces to universal link UX consistently.
- Keep monitoring for LIFF-specific regressions around `mmv_next` and referral forwarding.
