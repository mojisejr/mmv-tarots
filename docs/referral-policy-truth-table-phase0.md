# MMV Referral Policy Truth Table (Phase 0 Freeze)

Plan Ref: `#mmv-referral-semantic-refactor`
Date: `2026-03-15`
Status: `FROZEN` (pre-code contract)

## Policy Contract (Frozen)

- Universal rewards:
  - `ACCOUNT_CREATE_BONUS = +1`
  - `ONBOARDING_BONUS = +1`
  - `FIRST_PREDICTION_BONUS = +1`
- Referral rewards:
  - `REFERRER_BONUS = +2` at referee first successful prediction
  - `MANUAL_CLAIM_REFEREE_BONUS = +2` only for `MANUAL_CODE` source at referee first successful prediction
- Guardrails:
  - Link-attributed users cannot claim manual referral code later.
  - `app/api/auth/referral-check/route.ts` must remain strict no-op.
  - Reward issuance must be idempotent (exactly once per policy boundary).

## Scenario Matrix

| Scenario ID | Entry Path | Source | Account Create | Onboarding | First Prediction (Universal) | Referee Referral Bonus | Referrer Bonus | Expected Referee Total | Expected Referrer Total | Manual Claim Allowed Later |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S0 | No referral | NONE | +1 | +1 | +1 | +0 | +0 | +3 | +0 | N/A |
| S1 | Referral link before signup | LINK | +1 | +1 | +1 | +0 | +2 | +3 | +2 | No |
| S2 | Manual code claimed before onboarding | MANUAL_CODE | +1 | +1 | +1 | +2 | +2 | +5 | +2 | Already consumed |
| S3 | Manual code attempted after onboarding completed | NONE (claim denied) | +1 | +1 | +1 | +0 | +0 | +3 | +0 | No (claim rejected) |
| S4 | Link first, then manual claim attempt | LINK (manual denied) | +1 | +1 | +1 | +0 | +2 | +3 | +2 | No (claim rejected) |

## Deny-Case Contract (Mandatory)

### DC-01: Link-consumed user claims manual code later

- Given user has already been attributed by referral link (`source=LINK` or equivalent consumed referral state)
- When user calls manual referral claim endpoint
- Then response must be rejected (`409` or policy-defined deny status)
- And no new referral entitlement is created
- And no payout path is duplicated at first prediction

## Ledger Expectations

- Universal reward transactions expected for every successful user path:
  - `ACCOUNT_CREATE_BONUS`
  - `ONBOARDING_BONUS`
  - `FIRST_PREDICTION_BONUS`
- Referral-path transactions:
  - Link path (`S1`, `S4`): referrer gets one `+2`, referee gets no extra referral bonus
  - Manual path (`S2`): referrer gets one `+2`, referee gets one `+2`

## Acceptance

This truth table is the canonical contract for Phases 1-5. Any behavior or test that diverges from this matrix must be treated as a regression unless an explicit plan update is approved.
