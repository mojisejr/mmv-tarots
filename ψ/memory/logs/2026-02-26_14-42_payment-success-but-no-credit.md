# Snapshot: Payment Success but Credits Not Updated

**Time**: 2026-02-26 14:42
**Context**: User successfully tested Credit Card payment with Omise test keys. Charge `chrg_test_66u8qwnepey3t38bkps` created successfully in Omise Dashboard, but user credits did not increase.

## Evidence & Diagnostics

### 1. External Confirmation
The user verified the charge status via `curl`:
```bash
curl https://api.omise.co/charges/chrg_test_66u8qwnepey3t38bkps \
  -u skey_test_62rbdyg7dl62aubqct6:
```
Status: **Successful** (Charge created and paid).

### 2. Root Cause Analysis (Code Audit)
In `app/api/checkout/omise/route.ts`, the `CARD` flow handles immediate success (no 3DS) as follows:

```typescript
// Immediate success (no 3DS)
if (charge.status === 'successful' && charge.paid) {
  // ... logs ...
  return NextResponse.json({
    success:      true,
    chargeId:     charge.id,
    chargeStatus: charge.status,
    stars:        price.package.stars,
    packageName:  price.package.name,
  });
}
```

**The Missing Link**: 
- The `route.ts` does **not** call `CreditService.addStars()` for immediate success.
- It relies entirely on `app/api/webhooks/omise/route.ts` to process the `charge.complete` event.
- In local testing, webhooks usually fail unless a tunnel (like ngrok or cloudflared) is configured and registered in the Omise Dashboard.

## Current State
- ✅ **Frontend Fix**: Omise Token extraction is now correct (`response.id`).
- ✅ **Payment Flow**: Charge creation via Omise.js -> Backend API is working.
- 🚧 **Fulfillment Flow**: Credit update is lagging because it depends on webhooks, which are missing in local/current setup.

## Recommendation (For Next Session)
- **Option A**: Implement direct credit update in `route.ts` for immediate success path (with idempotency guard).
- **Option B**: Set up a webhook tunnel for local testing.
- **Option C**: Implement a "Sync Status" button on the UI that calls `api/checkout/omise/status` to manually trigger fulfillment.

**Status**: Monitoring. No immediate code changes applied per user request.
