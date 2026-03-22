# Snapshot: Omise Credential & Environment Audit

**Date**: 2026-02-23 15:19 +07
**Context**: Pre-flight check for Omise integration implementation.
**Project**: `mmv-tarots`

## 🔍 Environment Variable Validation

We have verified the `.env` configuration for local development. The keys follow the correct naming conventions for Next.js and Omise SDKs.

### Validation Results

| Variable | Status | Check | Note |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_OMISE_PUBLIC_KEY` | ✅ Valid | Starts with `pkey_test_` | Correctly exposed to client-side. |
| `OMISE_SECRET_KEY` | ✅ Valid | Starts with `skey_test_` | Correctly hidden from client-side. |
| `OMISE_CONFIG_MODE` | ✅ Valid | Value: `test` | Explicit mode set. |
| `NEXT_PUBLIC_APP_URL` | ✅ Valid | Value: `http://localhost:3000` | Ready for local redirect flow. |

## ⚠️ Security Reminder
- The `OMISE_SECRET_KEY` (`skey_...`) **MUST NEVER** be committed to Git or exposed in client-side code.
- Ensure `NEXT_PUBLIC_` is **ONLY** used for the Public Key (`pkey_...`).

## Next Steps
- Implement `Omise.js` script in the root layout.
- Initialize `omise` node client with the validated secret key.

*Logged by Oracle Keeper*
