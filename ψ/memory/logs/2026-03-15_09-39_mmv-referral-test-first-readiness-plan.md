---
type: plan
project: mmv-tarots
task_id: "#mmv-referral-test-first-readiness"
status: active
tags: [plan, blueprint, test-first, referral, production-readiness]
related_files:
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/app/api/user/onboarding/route.ts
  - projects/mmv-tarots/services/tarot-service.ts
  - projects/mmv-tarots/lib/referral-utils.ts
---

# Snapshot: MMV Referral Test-First Readiness Blueprint

**Time**: 2026-03-15 09:39 +0700
**Context**: Plan before refactor: lock unit+e2e evidence for referral production behavior

## Objective
- Establish high-confidence evidence for referral production behavior before any refactor by adding missing unit/integration/e2e coverage around share attribution, referral claim, reward integrity, and DB correctness.

## Scope
- In Scope:
  - Build test matrix for referral lifecycle across web + LIFF paths.
  - Add/upgrade unit and API tests for deterministic reward and idempotency behavior.
  - Add focused e2e scenarios for social-share link reliability and end-to-end credit outcomes.
  - Define measurable hard gates and evidence artifacts for safe refactor kickoff.
- Out of Scope:
  - Any behavior-changing refactor in referral service/business logic.
  - Schema migrations that alter production data model.
  - Product/UX redesign.

## Phases
### Phase 1 - Baseline Truth & Test Matrix Lock
- Deliverables:
  - Referral flow map (share -> ref capture -> signup/claim -> onboarding -> first predict -> ledger).
  - Risk-to-test mapping (critical/high/medium).
  - Canonical acceptance criteria for each reward event and non-event.
- Critical Test Cases:
  - First-touch cookie attribution persists (`mmv_ref`) and is not overwritten by later links.
  - LIFF gateway keeps `ref` when state/query is partially lost.
  - Referral code claim rejects self/invalid/already-claimed/late claim.
- Exit Criteria:
  - Written matrix approved and traceable to code paths.
  - No ambiguous reward rule remains.

### Phase 2 - Unit/API Safety Net (No Behavior Change)
- Deliverables:
  - New/expanded tests for `referral-service`, `credit-service`, `onboarding route`.
  - Explicit tests for idempotency and duplicate-prevention expectations.
  - Transaction ledger assertions (`amount`, `type`, `balanceAfter`, metadata source).
- Critical Test Cases:
  - `processReferralSignup` is idempotent under repeated calls for same referee.
  - Onboarding gate grants exactly one onboarding bonus and max one referral-entry bonus.
  - Legacy `referral-check` remains no-op and cannot trigger reward side effects.
- Exit Criteria:
  - Test suite covers critical branches with deterministic pass.
  - Failures clearly identify which rule is violated.

### Phase 3 - E2E Referral Reliability Suite
- Deliverables:
  - E2E scenarios for web and LIFF share-entry journeys.
  - End-to-end verification of expected stars and transaction rows after onboarding/prediction events.
  - Replay/resume scenario checks (refresh/reopen/tab repeat).
- Critical Test Cases:
  - Social share link `/share/[id]?ref=...` attributes referral end-to-end.
  - Referral code manual claim path gives expected eligibility outcome.
  - Repeated onboarding/predict requests cannot create duplicate payouts.
- Exit Criteria:
  - E2E green in CI-local parity mode.
  - Produced evidence table of scenario -> observed DB/API outcomes.

### Phase 4 - Pre-Refactor Gate & Decision Review
- Deliverables:
  - Consolidated evidence report: what is proven, what still uncertain.
  - Refactor readiness checklist with blockers and go/no-go.
  - Draft refactor targets prioritized by impact/risk.
- Critical Test Cases:
  - Gate replay: run critical subset twice to detect non-determinism.
  - Regression sentinel: existing passing referral tests remain green.
- Exit Criteria:
  - Hard Gate pass (Build + Lint + Targeted Tests + Referral E2E subset).
  - Explicit human approval to begin behavior-changing refactor.

## Risks & Countermeasures
- Risk: Flaky e2e due to external LIFF/session timing.
  - Countermeasure: isolate deterministic mocks where possible and tag external-dependent tests separately.
- Risk: False confidence from unit-only coverage.
  - Countermeasure: require at least one full lifecycle e2e with DB assertions.
- Risk: Test fixtures diverge from production schema/seed.
  - Countermeasure: align fixtures with Prisma schema and keep seed snapshot for referral scenarios.

## Rollback Strategy
- Trigger:
  - If new tests become unstable or break unrelated core flows.
- Rollback:
  - Revert only newly added test artifacts for the affected phase.
  - Keep baseline matrix and evidence logs intact.
  - Reintroduce tests incrementally in smaller slices.

## Verification Strategy (Hard Gate)
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Unit/API: run referral-focused suites first, then full test suite if stable.
- E2E: run critical referral journeys as release gate subset.
- Evidence:
  - Save command output summary + scenario result table in Oracle memory log.

## Tags
`plan` `test-first` `referral` `production-readiness` `mmv-tarots`


---
## Phase Update
- Timestamp: 2026-03-15 09:48:48 +0700
- Phase 1 Status: DONE
- Artifact: 
- Commit: 
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (, )
- Next Phase: Phase 2 - Unit/API Safety Net

---
## Phase Update Correction
- Timestamp: 2026-03-15 09:49:05 +0700
- Note: prior append had shell interpolation artifacts; this entry is authoritative.
- Phase 1 Status: DONE
- Artifact: projects/mmv-tarots/docs/referral-test-readiness-phase1.md
- Commit: a69643d
- Hard Gate: Build PASS, Lint PASS, Test PASS (28 files, 159 tests)
- Next Phase: Phase 2 - Unit/API Safety Net

---
## Phase Update
- Timestamp: 2026-03-15 09:56:05 +0700
- Phase 2 Status: DONE
- Artifacts:
  - projects/mmv-tarots/__tests__/api/onboarding-route.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-service-phase2.test.ts
  - projects/mmv-tarots/__tests__/services/credit-service-phase2.test.ts
- Commit: 56b5bea
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (31 files, 175 tests)
- Next Phase: Phase 3 - E2E Referral Reliability Suite

---
## Phase Update
- Timestamp: 2026-03-15 10:20:03 +0700
- Phase 3 Status: DONE
- Artifacts:
  - projects/mmv-tarots/__tests__/e2e/referral-reliability-phase3.test.ts
- Commit: 8e0c6ea
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (32 files, 178 tests)
- Next Phase: Phase 4 - Pre-Refactor Gate & Decision Review

---
## Phase Update
- Timestamp: 2026-03-15 10:30:16 +0700
- Phase 4 Status: DONE
- Artifacts:
  - projects/mmv-tarots/docs/referral-test-readiness-phase4.md
- Commit: 52e2d7e
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (32 files, 178 tests)
- Decision: GO (with constraints) for behavior-preserving refactor slices only
