# MMV Referral Policy Truth Table (Phase 1 Realignment)

Plan Ref: #mmv-referral-post-onboarding-claim-refactor
Date: 2026-03-15
Status: FROZEN (phase-1 canonical contract)

## Policy Contract

- Universal rewards:
  - ONBOARDING_BONUS = +1
  - FIRST_PREDICTION_BONUS = +1
- Referral rewards:
  - LINK_ONBOARDING_BONUS = +1 (only for LINK attribution, at onboarding completion)
  - REFERRER_BONUS = +2 (at referee first successful prediction)
  - MANUAL_CLAIM_REFEREE_BONUS = +2 (only for MANUAL_CODE source, at referee first successful prediction)
- Guardrails:
  - One-path-only invariant: LINK and MANUAL_CODE cannot both be consumed by the same user.
  - Post-onboarding manual claim is allowed exactly once when no prior entitlement exists.
  - Link-attributed users are denied manual claim (409).
  - Reward issuance must remain idempotent at each policy boundary.

## Scenario Matrix

| Scenario ID | Entry Path | Source | Onboarding | Link Bonus | First Prediction (Universal) | Manual Referee Bonus | Referrer Bonus | Expected Referee Total | Expected Referrer Total | Manual Claim Allowed Later |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S0 | No referral | NONE | +1 | +0 | +1 | +0 | +0 | +2 | +0 | Yes (if no entitlement yet) |
| S1 | Referral link before/on onboarding | LINK | +1 | +1 | +1 | +0 | +2 | +3 | +2 | No |
| S2 | Manual code before onboarding | MANUAL_CODE | +1 | +0 | +1 | +2 | +2 | +4 | +2 | Already consumed |
| S3 | Manual code after onboarding | MANUAL_CODE | +1 | +0 | +1 | +2 | +2 | +4 | +2 | Already consumed |
| S4 | Link first, then manual attempt | LINK (manual denied) | +1 | +1 | +1 | +0 | +2 | +3 | +2 | No (deny 409) |

## Deny Cases (Mandatory)

- DC-01: self-referral is rejected.
- DC-02: duplicate manual claim is rejected.
- DC-03: link-attributed user cannot claim manual code later.

## Acceptance

This Phase 1 contract is the canonical source of truth for implementation Phases 2-4 of #mmv-referral-post-onboarding-claim-refactor.
