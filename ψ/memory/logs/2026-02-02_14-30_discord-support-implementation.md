# Snapshot: Discord Support Configuration & Implementation

**Date**: 2026-02-02 14:30 GMT+7
**Project**: `mmv-tarots`
**Status**: Implemented & Verified (Build Pass)

## 📌 Implementation Checklist
- [x] **Backend**: Created `app/api/support/route.ts` with Discord Webhook logic.
  - [x] Auth Guard (Better Auth Session).
  - [x] Zod Validation (Message + Context).
  - [x] Rich Embed Payload (User Info, Device Stats).
- [x] **Frontend**: Updated `app/profile/page.tsx`.
  - [x] Added "แจ้งปัญหา / Support" Button.
  - [x] Implemented Glassmorphic Modal.
  - [x] Auto-capture context (`navigator.userAgent`, `window.location`).
- [x] **Verification**: `npm run build` passed.

## 🛠️ Technical Details
- **Webhook**: Configured to use `DISCORD_WEBHOOK_URL`.
- **Validation**:
  ```typescript
  const context = {
    userAgent: navigator.userAgent,
    url: window.location.href,
    resolution: `${window.innerWidth}x${window.innerHeight}`,
  };
  ```

## 📝 Next Steps
- Deploy to Vercel (Auto via Git Push).
- Test sending a ticket from production.
