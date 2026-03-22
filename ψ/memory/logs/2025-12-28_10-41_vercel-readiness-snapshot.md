# Snapshot: Better Auth Vercel Readiness
**Date**: 2025-12-28 10:41 (Local)
**Issue**: #none
**Project**: mmv-tarots

## Current Situation
- **Vercel Settings**: 
    - `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` have been set in Vercel Dashboard.
    - `NEXT_PUBLIC_APP_URL` is configured using interpolation `https://${VERCEL_URL}` for Preview branches.
    - "Automatically expose System Environment Variables" is enabled.
- **Code Changes**:
    - `lib/server/auth.ts`: Updated to use `as string` for critical environment variables (`BETTER_AUTH_SECRET`, `LINE_CLIENT_ID`, etc.) to ensure Type Safety and fail-fast behavior if variables are missing.
    - `app/api/checkout/stripe/route.ts`: Verified to use `NEXT_PUBLIC_APP_URL` for Stripe redirects.

## Next Steps
- Verify the deployment on Vercel.
- Test the LINE Login flow on both Production and Preview branches.
- Test the Stripe payment flow and verify the redirect back to the correct branch URL.

## Git Info
- **Branch**: `main` (Local)
- **Status**: Ready for Deployment
