# MMV Referral Phase 5 - Operations Query Pack

Plan Ref: `#mmv-referral-semantic-refactor`
Status: `ACTIVE (Phase 5)`
Date: `2026-03-15`

## Purpose
Temporary dashboard/query pack for payout validation during controlled rollout.

## 1. Daily Reward Issuance by Event
```sql
SELECT
  DATE_TRUNC('day', "createdAt") AS day,
  COALESCE("metadata"->>'event', 'UNKNOWN') AS event,
  COUNT(*) AS tx_count,
  SUM("amount") AS total_amount
FROM "CreditTransaction"
WHERE "status" = 'SUCCESS'
  AND (
    "externalRef" LIKE 'first_prediction_bonus:%'
    OR "externalRef" LIKE 'referrer_bonus:%'
    OR "externalRef" LIKE 'manual_claim_referee_bonus:%'
  )
GROUP BY 1, 2
ORDER BY 1 DESC, 2 ASC;
```

## 2. Impossible Combo Sentinel (LINK source + referee manual bonus)
```sql
SELECT
  rh."id" AS referral_history_id,
  rh."source",
  referee_tx."id" AS referee_tx_id,
  referee_tx."amount" AS referee_bonus,
  referee_tx."createdAt" AS referee_tx_time
FROM "ReferralHistory" rh
JOIN "CreditTransaction" referee_tx
  ON referee_tx."externalRef" = CONCAT('manual_claim_referee_bonus:', rh."id")
WHERE rh."source" = 'LINK';
```
Expected: `0 rows`

## 3. Missing Referrer Bonus Sentinel
```sql
SELECT
  rh."id" AS referral_history_id,
  rh."source",
  rh."eligibilityState",
  rh."status",
  rh."referrerId"
FROM "ReferralHistory" rh
LEFT JOIN "CreditTransaction" referrer_tx
  ON referrer_tx."externalRef" = CONCAT('referrer_bonus:', rh."id")
WHERE rh."status" = 'GRANTED'
  AND rh."eligibilityState" = 'GRANTED'
  AND referrer_tx."id" IS NULL;
```
Expected: `0 rows`

## 4. Duplicate Bonus Sentinel
```sql
SELECT
  "externalRef",
  COUNT(*) AS duplicate_count
FROM "CreditTransaction"
WHERE "externalRef" LIKE 'first_prediction_bonus:%'
   OR "externalRef" LIKE 'referrer_bonus:%'
   OR "externalRef" LIKE 'manual_claim_referee_bonus:%'
GROUP BY "externalRef"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```
Expected: `0 rows`

## 5. Rollout Window Watch Command
```bash
cd /Users/non/dev/opilot/projects/mmv-tarots && \
rg -n "\\[ReferralEvent\\]|referral.exception|reward_engine.disabled" .next/server || true
```

## 6. Alert Escalation Rule
- `critical`: impossible combo or duplicate payout detected.
- `warning`: temporary mismatch during in-flight transactions (must clear on next check).
- `info`: expected idempotency skip events.
