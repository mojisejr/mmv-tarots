# Snapshot: Payment Flow Token Bug Analysis

**Time**: 2026-02-26 00:09
**Context**: Debugging `400 Bad Request` on Credit Card checkout in `mmv-tarots`.

## Insight

The "Unexpected Error" during credit card payment is caused by incorrect property access in the Omise.js callback within `CardForm.tsx`.

### The Bug
In `components/features/payment/CardForm.tsx`:
```typescript
window.Omise.createToken(
  'card',
  // ...
  async (statusCode, response) => {
    // ...
    // ERROR: response.object is the string "token", not the token object itself.
    // Accessing .id on a string returns undefined.
    await onToken(response.object.id); 
  }
);
```

### The Fix
The token ID is located at `response.id`.
```typescript
// Correct usage:
await onToken(response.id);
```

### Backend Impact
When `onToken` receives `undefined`:
1. The `checkout` function call sends a payload with missing `token`.
2. `app/api/checkout/omise/route.ts` validates `paymentMethod === 'CARD' && !token`.
3. Returns `400 Bad Request: Card token is required`.

### Action Plan
1. Fix `CardForm.tsx` to use `response.id`.
2. Verify with a test transaction.
