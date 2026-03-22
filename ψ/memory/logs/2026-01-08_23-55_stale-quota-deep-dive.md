# Snapshot: Deep Dive - The "Stale Quota" Mystery

**Time**: 2026-01-08 23:55
**Context**: UI `🔮` icons do not refill automatically in `mmv-tarots` even after the cooldown period has passed, until a new question is asked.

## 🧠 Deep Analysis: Why it's happening

After further analysis, I've identified **two levels** of the problem:

### Level 1: The "Cache-Locked" API (Primary Suspect)
Next.js Route Handlers (specifically `GET` requests) are heavily cached by default in production/static builds. 
- **Symptom**: You refresh the page -> `NavigationProvider` calls `/api/credits/balance` -> Next.js returns the *cached* JSON from 2 minutes ago (which says `active: 0`) because it thinks nothing has changed.
- **Why it "Fixes" on Submit**: A `POST` request to `/api/predict` is a "Mutation". It triggers a revalidation (and is not cached itself), so the following `refreshBalance()` finally gets a real, fresh response.

### Level 2: The "Precision Gap" in Stateless Logic
In `lib/server/rate-limit.ts`, the calculation is done only when requested.
- **Edge Case**: If the mathematical result of tokens is exactly `2.9999`, `Math.floor()` will return `2`. 
- Without a proper `force-dynamic` flag on the API, the system might get stuck on a "near-full" state in the cache.

---

## 🛠️ Execution Plan: "The Crystal Clarity Fix"

### 1. API Hardening (Backend)
- Add `export const dynamic = 'force-dynamic'` to `/api/credits/balance/route.ts`.
- Add `export const revalidate = 0`.
- Manually set headers to disable caching:
  ```ts
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  ```

### 2. Client-Side Integrity (Frontend)
- Update `lib/client/api.ts` to include a `cache: 'no-store'` or a `_t={timestamp}` flag in the fetch call to ensure the browser doesn't intercept the request.
- Ensure `refreshBalance()` is called on Page Focus (when user switches back to the tab).

### 3. Logic Refinement
- Adjust `activeInteger` calculation to use `Math.round(tokens * 100) / 100` and then `floor` to avoid floating point precision issues near the integer boundary.

---

## 🛡️ Verification Method
1. Drain 3 slots.
2. Wait 45-60 seconds (Refresh only).
3. Ifลูกแก้ว returns to 1 or more **without** asking a question, the fix is successful.

## Tags
`deep-dive` `caching-issue` `nextjs-app-router` `floating-point` `mmv-tarots`
