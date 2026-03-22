# Snapshot: India Login Infinite Loading Analysis

**Time**: 2026-01-22 13:25 GMT+7
**Context**: Debugging a critical issue where users in India experience "infinite loading" during login on the `mmv-tarots` project, while VPN users can connect normally.

## Insight

The root cause of the "infinite loading" login issue in India is **Infrastructure/ISP Blocking**, not application code.

1.  **Diagnosis**:
    - **Symptom**: Login requests hang until timeout for users on standard Indian ISPs (Jio/Airtel).
    - **Evidence**: Enabling VPN immediately resolves the issue (Request succeeds).
    - **Region**: Server is already on `sin1` (Singapore), so latency is not the cause.
    - **Code**: `lib/server/auth.ts` uses non-blocking patterns. Complexity is low.

2.  **The "Vercel.app" Problem**:
    - Indian ISPs frequently block or throttle traffic to `*.vercel.app` domains directly at the DNS/Packet level.
    - This results in packets being dropped (Blackhole), causing the client to wait indefinitely.

## Solution Strategy

**"Don't fix the code, fix the domain."**

1.  **Immediate Fix**: Switch to a **Custom Domain** (e.g., `www.mmv-tarots.com`).
    - Standard TLDs are not subjected to the blanket bans that apply to shared hosting subdomains.
2.  **Configuration**:
    - Update `NEXT_PUBLIC_BETTER_AUTH_URL` and `BETTER_AUTH_URL` in Vercel to point to the new custom domain.
3.  **Client Resilience**: A secondary improvement is to add explicit timeout handling in the `authClient` fetch configuration to alert users faster.

## Tags

`debugging` `vercel` `india` `isp-block` `better-auth` `infrastructure`
