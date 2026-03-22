---
type: snapshot
project: mmv-tarots
task_id: "#mmv-direct-upload-rounded-price-ppp-2026-03"
status: active
tags: [snapshot, mmv-tarots, payment, direct-upload, phase3, ui]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/components/payment/prompt-pay-qr.test.tsx
  - /Users/non/dev/opilot/ψ/memory/logs/mmv-tarots/2026-03-18_23-28_mmv-direct-file-upload-rounded-price-plan.md
---

# Snapshot: MMV Direct Upload Phase 3 UI

**Time**: 2026-03-19 06:24 +0700
**Context**: Closed ggg Phase 3 for MMV direct upload by replacing URL-only slip submission with a mobile-friendly file upload UX, then passing the full hard gate.

## Tags
`snapshot` `mmv-tarots` `payment` `direct-upload` `phase3` `ui`

## Evidence
- Commit `3fa7ad1`: `#mmv-direct-upload-rounded-price-ppp-2026-03 phase3 direct upload payment ux`
- `PromptPayQR` now opens a file picker, previews the selected slip, shows basic metadata, and submits `FormData` with `slipFile`
- client-side validation mirrors backend expectations for supported image types and max size
- API error extraction now handles nested `error.message` so Thai rejection copy is shown directly in the modal
- payment amount copy/title now stays in rounded `xx.00` format across the payment flow
- hard gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm run test` (`47 files`, `235 tests`)

## Guardrails
- kept the server route/provider contract unchanged from Phase 1-2; this phase only moved the client UX onto that multipart path
- kept rounded price as the only visible payment amount strategy; no satang mutation introduced
- left retry behavior inside the same modal surface so rejected uploads can be replaced without reopening the order flow

## Next Actions
- start Phase 4 integration hardening: validate credited, delayed, rejected, and expired branches still line up with billing and transactions surfaces
- run manual smoke on iPhone, Android, and desktop after Phase 4 to verify picker behavior and real-device upload continuity
- if real-device upload shows provider-specific file quirks, capture MIME/extension evidence before widening client accept rules
