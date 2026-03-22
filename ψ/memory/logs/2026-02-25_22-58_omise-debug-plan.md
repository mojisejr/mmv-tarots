# 📸 Snapshot: Omise Error Debugging & Fix Plan

**Date**: 2026-02-25 22:58 GMT+7
**Project**: `projects/mmv-tarots`
**Branch**: `feature/phase3-omise-integration`
**Timestamp**: Wed Feb 25 22:58:50 +07 2026

---

## 🚨 Incident Report

**Symptom**:
- `POST /api/checkout/omise` returns **500 Internal Server Error** (Card & PromptPay).
- **Log**: `[PaymentEvent] payment.exception ... "message":"Unknown error"`
- **Trace**: Sentry shows error originates from `.create()` calls, but stack trace is muddy due to "Unknown error" wrapping.

**Root Cause (Hypothesis)**:
1.  **Library Import Mismatch**: The `omise` Node.js library uses CommonJS-style exports which TypeScript/Next.js default import might be mishandling (returning a wrapped module instead of the factory function).
2.  **Missing Configuration**: The `omise` client might require `publicKey` passed alongside `secretKey` even for server-side calls in version 1.1.0+.
3.  **Silent Failure**: The existing `getOmiseClient` logic doesn't catch initialization errors explicitly.

---

## 🛠️ Remediation Plan (The Fix)

### Step 1: Robust Client Initialization (Local Fix)
- **File**: `lib/server/omise.ts`
- **Action**:
  - Switch to `require('omise')` pattern or ensure correct default import unwrapping.
  - Pass **both** `secretKey` and `publicKey` to the constructor.
  - Add specific try-catch block during initialization to log "Omise Client Init Failed".

### Step 2: Diagnostic Logging (Observability)
- **File**: `lib/server/omise.ts`
- **Action**:
  - Add `console.log('[Omise] Initializing with key prefix:', secretKey.substring(0, 4))` to verify env var loading without leaking secrets.
  - Log the structure of the returned client object (`Object.keys(_client)`) to ensure methods like `charges`, `sources` exist.

### Step 3: API Route Hardening
- **File**: `app/api/checkout/omise/route.ts`
- **Action**:
  - Unwrap the "Unknown error" in `capturePaymentException` to see the *real* error object from Omise (often contains `code` and `message` inside a nested object).

---

## 🧪 Verification Protocol

1.  **Unit Test**: Run `node scripts/test-omise-connection.js` (will create this script) to verify connectivity in isolation.
2.  **Manual Test**: Trigger PromptPay QR generation again.
3.  **Success Criteria**:
    - Status code: **200 OK**
    - JSON response contains `qrImageUrl` (PromptPay) or `authorizeUri`/`success` (Card).

---
*Snapshot plan by Oracle Keeper | #debug-omise*
