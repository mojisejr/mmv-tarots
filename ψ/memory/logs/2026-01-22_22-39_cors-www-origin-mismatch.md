# Snapshot: CORS & The "www" Origin Mismatch

**Time**: 2026-01-22 22:39
**Context**: Fixing CORS error when accessing `https://www.mimivibe-tarot.com` but API calls were hitting `https://mimivibe-tarot.com`.

## Insight

**"www" and "non-www" are strangers to the browser.**

Even though `mimivibe-tarot.com` and `www.mimivibe-tarot.com` serve the same content, browsers treat them as **different origins** (Cross-Origin).

- **The Problem**: You were visiting `www.` (Origin A) but the App's `NEXT_PUBLIC_BETTER_AUTH_URL` was configured to hit `non-www` (Origin B).
- **The Block**: The browser blocked the API request because the server at Origin B didn't explicitly say "I allow Origin A to talk to me" (Missing `Access-Control-Allow-Origin`).
- **The Fix**: By updating the ENV to `https://www.mimivibe-tarot.com`, we aligned the API target with the Browser URL. Now both are Origin A.
- **Result**: The request becomes **Same-Origin**, bypassing the strict CORS checks entirely.

## Apply When

- Setting up new domains.
- configuring `NEXT_PUBLIC_` API Base URLs.
- Always decide strictly between `www` or `non-www` as the **Canonical URL** and stick to it everywhere.

## Tags

`cors` `domain-config` `better-auth` `networking`
