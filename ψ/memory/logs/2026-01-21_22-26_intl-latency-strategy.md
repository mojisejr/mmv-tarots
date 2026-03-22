# Snapshot: Intl Latency & Region Configuration Strategy

**Time**: 2026-01-21 22:26
**Context**: Investigating "hanging" issues for users in India/Australia for `mmv-tarots`.

## Insight

1.  **Domain Name**: No impact on core latency. DNS resolution is global and cached.
2.  **Dashboard Settings**: Confirmed as `sin1`. This is correct but can be supplemented by code-level config.
3.  **Hanging Cause**: 
    - **Neon DB Cold Start (Primary Suspect)**: Since it's on Free Tier, the database sleeps after 5 mins of inactivity. Waking up takes 3-5s.
    - **Vercel Cold Start**: Standard serverless overhead (~1s).
4.  **Recommended Fix**:
    - Add `export const preferredRegion = 'sin1';` to `app/api/auth/[...all]/route.ts`.
    - Consider **Neon Launch Plan ($19)** if production traffic requires 0ms cold starts.
    - Added background logging to track auth performance.

## Apply When

- When global users report "hanging" or slow initial loads on Vercel + Neon projects.

## Tags

`latency` `nextjs` `vercel` `neon-db` `intl-users`
