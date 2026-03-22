# Snapshot: Auth Provider Switching vs ISP Blocking

**Time**: 2026-01-22 13:34 GMT+7
**Context**: Investigating if switching authentication providers (e.g., from LINE to Google) would resolve the "infinite loading" login issue for users in India on Vercel.

## Insight

**Changing the Auth Provider does NOT fix Domain Blocking.**

The issue lies in the **Callback URL** (The Return Leg), not the Provider itself.

1.  **The Mechanism**:
    - **Outbound**: User goes to Provider (LINE/Google). This works as these major sites are not blocked.
    - **Inbound (The Failure Point)**: When the Provider redirects the user back to the application (e.g., `https://app.vercel.app/api/auth/callback/line`), the request hits the blocked domain.

2.  **Why it fails**:
    - If the ISP blocks `*.vercel.app`, the browser cannot reach the callback URL to complete the handshake.
    - It doesn't matter which vehicle (Provider) brings the user back; if the destination gate (Domain) is walled off, the connection hangs.

3.  **Conclusion**:
    - Switching from LINE to Google/Facebook yields the same result: "Infinite Loading" at the callback phase.
    - **The only effective solution is to change the destination gate** by using a **Custom Domain** (e.g., `.com`), which bypasses the ISP's blanket block on Vercel subdomains.

## Apply When
- Users suggest changing Login Providers to fix "Network Timeout" or "Connection Refused" errors.
- Debugging OAuth callback failures in restrictive network environments.

## Tags
`auth` `infrastructure` `oauth` `india` `isp-block` `vercel`
