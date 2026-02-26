# Omise PromptPay Local Test Flow

## Goal
Test PromptPay on local in a simple and robust way without local webhook tunneling.

## Required Environment
Set these values in `.env`:

- `OMISE_SECRET_KEY=skey_test_...`
- `NEXT_PUBLIC_OMISE_PUBLIC_KEY=pkey_test_...`
- `OMISE_CONFIG_MODE=test`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Both keys must match the same mode (`test` or `live`).

## Local Steps (No Webhook)
1. Start app with `npm run dev`.
2. Open package/top-up UI and choose `PROMPTPAY`.
3. Confirm API returns a QR image (`qrImageUrl`) and `chargeId`.
4. In Omise Dashboard (Test mode), open the same charge and simulate successful payment.
5. Open profile with redirect query:
   - `/profile?payment=success&chargeId=<your_charge_id>`
6. The page will call `/api/checkout/omise/status` and reconcile credit automatically.

## Quick Verification
- Checkout API should not return `authentication failed` on PromptPay.
- Status API should eventually return `status: successful` and `credited: true`.
- User star balance should update after reconcile.

## Troubleshooting Checklist
- Ensure `OMISE_SECRET_KEY` and `NEXT_PUBLIC_OMISE_PUBLIC_KEY` are both present.
- Ensure key prefixes match mode:
  - test: `skey_test_...` + `pkey_test_...`
  - live: `skey_live_...` + `pkey_live_...`
- Restart the dev server after `.env` changes.
- Ensure Omise Dashboard is in the same mode as your keys.
- If checkout fails, inspect API response fields `error` and `code`.
