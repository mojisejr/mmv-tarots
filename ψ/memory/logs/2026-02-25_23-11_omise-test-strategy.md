# 🧪 Omise Payment Test Strategy (Snapshot)

**Status**: Planning
**Date**: 2026-02-25 23:11
**Objective**: Fix `authentication failed` errors and establish a regression shield for the payment gateway.

## 1. Context & Problem
- **Symptom**: 500 Internal Server Error on checkout.
- **Log**: `Omise Authentication Failed`.
- **Root Cause Hypothesis**:
  1. Invalid Keys (Public/Secret swapped or expired).
  2. Environment Variable Loading issue (Next.js server/edge boundary).
  3. API Version mismatch (2017 vs 2019).

## 2. Test Execution Plan

### Phase 1: Isolation Diagnosis (The Probe)
**Goal**: Verify credentials outside the Next.js runtime to rule out framework issues.
- **Action**: Create `scripts/diagnose-omise.ts`.
- **Logic**:
  - Load `.env` directly using `dotenv`.
  - Initialize `omise` SDK raw.
  - Attempt a simple `omise.account.retrieve()` call.
  - **Success Criteria**: Returns Account Email/ID.

### Phase 2: Unit Testing (The Logic)
**Goal**: Verify `lib/server/omise.ts` handles edge cases correctly (Fail Fast, Currency Normalization).
- **Target**: `__tests__/lib/omise.test.ts`
- **Scenarios**:
  - `getOmiseClient()` throws if keys are missing.
  - `createCharge()` normalizes 'THB' to 'thb'.
  - `createCharge()` wraps upstream errors in `PaymentError`.

### Phase 3: Integration Testing (The Route)
**Goal**: Verify `POST /api/checkout/omise` handles the HTTP contract correctly.
- **Target**: `__tests__/integration/checkout-api.test.ts`
- **Method**: Mock the `omise` library call, test the Route Handler logic.
- **Scenarios**:
  - **Success**: 200 OK + `authorizeUri`.
  - **Failure**: 400 Bad Request (Validation).
  - **Failure**: 500 Server Error (Upstream failure).

## 3. Implementation Steps
1.  **Create Probe**: `scripts/diagnose-omise.ts` -> Run with `bun`.
2.  **Fix Config**: If probe fails, fix `.env`.
3.  **Create Limit Tests**: Implement Phase 2 tests.
4.  **Create Route Tests**: Implement Phase 3 tests.

## 4. Dependencies
- `vitest` (Already configured).
- `dotenv` (For script isolation).
