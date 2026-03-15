# MMV Referral Phase 5 - Controlled Rollout Checklist

Plan Ref: `#mmv-referral-semantic-refactor`
Status: `ACTIVE (Phase 5)`
Date: `2026-03-15`

## A. Pre-Rollout Gate
- [ ] Build/Lint/Test hard gate is green on candidate commit.
- [ ] Critical referral replay subset passed twice consecutively.
- [ ] Ops query pack verified against staging snapshot.
- [ ] Alert destination configured (`DISCORD_WEBHOOK_URL`) for referral guard.

## B. Kill-Switch Contract
- Feature flag: `MMV_REFERRAL_REWARD_ENGINE_DISABLED`
- Behavior when enabled (`1` or `true`):
  - Skip first-prediction reward engine execution.
  - Emit `reward_engine.disabled` telemetry event.
  - Preserve request success path (non-crashing fail-safe mode).

### Kill-Switch Activation Steps
1. Set env var on runtime:
   - `MMV_REFERRAL_REWARD_ENGINE_DISABLED=1`
2. Redeploy service.
3. Verify logs include `reward_engine.disabled`.
4. Confirm no new `first_prediction_bonus:*` / `referrer_bonus:*` / `manual_claim_referee_bonus:*` rows.

## C. Progressive Rollout Plan
1. `10%` traffic window for 15 minutes.
2. `50%` traffic window for 30 minutes.
3. `100%` rollout after sentinel queries remain clean.

## D. Mandatory Sentinel Checks During Rollout
- [ ] Impossible combo sentinel returns `0 rows`.
- [ ] Missing referrer bonus sentinel returns `0 rows`.
- [ ] Duplicate bonus sentinel returns `0 rows`.
- [ ] No sustained warning/critical referral alerts.

## E. Go/No-Go Record
- Release candidate commit: `TBD`
- Decision: `GO` / `NO-GO`
- Decision owner: `TBD`
- Timestamp: `TBD`
- Notes: `TBD`

## F. Rollback Procedure
1. Enable `MMV_REFERRAL_REWARD_ENGINE_DISABLED=1`.
2. Redeploy immediately.
3. Run sentinel queries and capture affected user IDs.
4. Execute reconciliation plan before re-enable.
