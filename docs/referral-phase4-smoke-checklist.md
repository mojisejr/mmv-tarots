# Referral Phase 4 Smoke Checklist

Issue: #mmv-referral-post-onboarding-claim-refactor

## Scope
- Validate runtime parity for LINK and MANUAL_CODE reward flows.
- Confirm post-onboarding manual claim policy for eligible users.
- Confirm deterministic payout behavior under replay and race-like conditions.

## LINK Flow
- Open share URL with `?ref=<valid_code>` and complete signup.
- Complete onboarding once: expect `ONBOARDING_BONUS` (+1) and `LINK_ONBOARDING_BONUS` (+1).
- Complete first successful prediction once: expect `FIRST_PREDICTION_BONUS` (+1).
- Verify referrer receives `REFERRER_BONUS` (+2) exactly once.
- Retry first-prediction completion callback: verify no duplicate LINK or REFERRER payout.
- Try manual claim after link attribution: expect HTTP 409.

## MANUAL_CODE Flow (Post-Onboarding Claim)
- Signup without referral link and complete onboarding: expect only `ONBOARDING_BONUS` (+1).
- Submit valid referral code via profile claim endpoint after onboarding.
- Complete first successful prediction once: expect `FIRST_PREDICTION_BONUS` (+1).
- Verify referee receives `MANUAL_CLAIM_REFEREE_BONUS` (+2) exactly once.
- Verify referrer receives `REFERRER_BONUS` (+2) exactly once.
- Retry claim and callback flow: verify no duplicate entitlement or payouts.

## Regression Guardrails
- Self-referral returns 400.
- Duplicate/manual-claim-after-entitlement returns 409.
- Existing link-attributed user cannot switch to manual path.
- Reward kill-switch (`MMV_REFERRAL_REWARD_ENGINE_DISABLED`) blocks reward execution.

## Evidence Capture
- Save test command output from:
  - `__tests__/services/first-prediction-reward-service.test.ts`
  - `__tests__/lib/referral-service-phase2.test.ts`
  - `__tests__/e2e/referral-reward-matrix-phase4.test.ts`
- Record final `git rev-parse --short HEAD` in rollout notes.
