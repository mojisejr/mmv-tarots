# Snapshot: Burst & Breathe Implementation (mmv-tarots)

**Time**: 2026-01-08 23:20
**Context**: Successfully implemented the "Burst & Breathe" cooldown system, allowing users to ask 3 questions continuously before resting.

## Technical Details

### 1. Token Bucket Algorithm (`lib/server/rate-limit.ts`)
- **Type**: Stateless Token Bucket (calculated from `Prediction` history).
- **Capacity**: 3 Slots.
- **Refill Rate**: 1 Slot per 45 seconds (Conservative standard).
- **Logic**: 
    - Fetches last 10 predictions.
    - Simulates token consumption and refill over time.
    - If tokens < 1, returns `allowed: false` and `retryAfter`.

### 2. API Changes
- **`/api/predict`**: Validates request against `calculateRateLimit`. Returns `429` with `retryAfter` if exhausted.
- **`/api/user/me`**: Now returns `concentration` object:
    ```json
    {
      "active": 2, // Available slots
      "total": 3,
      "nextRefillIn": 15 // Seconds
    }
    ```

### 3. Frontend Soul (`QuestionInput.tsx`)
- **Indicator**: Added `FloatingBadge` (Bottom-Left) showing 3 Crystal Balls (🔮🔮🔮).
    - Opacity changes based on `concentration.active`.
- **Feedback**: Shows "แม่หมอกำลังรวบรวมสมาธิ... อีก X วินาที" when cooldown triggers.
- **Design**: Maintained glassmorphism style and synchronized with `NavigationProvider`.

## Verification
- **Build**: Passed (`npm run build`).
- **Types**: Verified with `tsc`.
- **Git**: Pushed to `feat/burst-breathe-cooldown`.

## Next Steps
- Merge usage to `staging`.
- User Acceptance Testing (UAT) to feel the "Breathe" rhythm in real life.

## Tags
`implementation` `mmv-tarots` `rate-limiting` `token-bucket` `ux-soul`
