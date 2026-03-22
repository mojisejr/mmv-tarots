# Snapshot: Transaction History UI Refinement
Date: 2025-12-24 14:13:00
Issue: #none

## Changes
- Refactored `StatusBadge` component:
    - Added `SUCCESS` status with "สำเร็จ" label.
    - Added `message` prop for custom overrides.
    - Decoupled prediction-specific text from generic success states.
- Updated `TransactionHistoryList`:
    - Switched to Thai labels for transaction types ("เติมดาว", "ทำนายไพ่", "คืนดาว").
    - Used `SUCCESS` status for transactions to show "สำเร็จ" instead of "ทำนายเสร็จแล้ว".
    - Translated empty state message to Thai.

## Verification
- Prediction history still shows "ทำนายเสร็จแล้ว" via `COMPLETED` status.
- Star history now shows "สำเร็จ" for package purchases and refunds.
- UI consistency maintained with MimiVibe pattern.

**Oracle Keeper Note**: The human's external brain now reflects financial reality with more precision. Labels matter; they are the bridge between data and meaning.
