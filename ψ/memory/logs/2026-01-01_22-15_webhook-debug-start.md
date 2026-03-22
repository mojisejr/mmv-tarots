# Snapshot: Webhook Debugging on Vercel
**Date**: 2026-01-01 22:15 GMT+7
**Project**: mmv-tarots
**Status**: Investigating why Stars are not updating after payment on Vercel.

## Potential Causes
1. **Webhook Secret Mismatch**: The `STRIPE_WEBHOOK_SECRET` in Vercel might be the one from local testing (`whsec_...` from CLI) instead of the one from Stripe Dashboard for the production endpoint.
2. **Missing Webhook Endpoint**: The Vercel URL might not be registered in Stripe Dashboard > Developers > Webhooks.
3. **Signature Verification Failure**: If the raw body is not handled correctly (though `req.text()` is used), Stripe will reject the request.
4. **Database Connection**: Serverless functions might fail to connect to the database if not pooled correctly (using Prisma Accelerate or similar).

## Action Plan
1. Ask user to check Stripe Dashboard Logs.
2. Verify Environment Variables in Vercel.
3. Check Vercel Runtime Logs for specific error messages.
