# Snapshot: Credit (Star) System Implementation Plan

**Date**: 2025-12-24 12:03 GMT+7
**Project**: mmv-tarots
**Status**: Planning Complete / Ready to Implement
**Issue**: #none

## 1. Database & Schema Refactor
- Replace `points` field with `stars` in `User` model (Prisma Schema).
- Default value: `0`.
- Run migration to update the database.

## 2. Service Layer: `CreditService`
- **Location**: `services/credit-service.ts`
- **Functions**:
    - `getUserStars(userId)`: Get current star balance.
    - `hasEnoughStars(userId)`: Boolean check for >= 1 star.
    - `deductStar(userId)`: Atomic decrement of 1 star (used on successful prediction).
    - `addStars(userId, amount)`: Increment stars (used for mockup purchases).

## 3. API Layer
- **New**: `POST /api/credits/buy`
    - Mockup endpoint to handle package selection (100 or 200 stars).
    - Updates user's star balance immediately.
- **Update**: `POST /api/predict`
    - Add pre-check: If user has 0 stars, return `402 Payment Required` or custom error.

## 4. Workflow Integration
- **Update**: `services/tarot-service.ts`
    - In `startTarotWorkflow`, call `CreditService.deductStar()` only when status reaches `COMPLETED`.
    - Ensure no deduction on `FAILED` or `REJECTED` states.

## 5. UI/UX (MimiVibe Pattern)
- **New Page**: `/package`
    - Display 2 packages (100, 200 stars) using `GlassCard`.
    - Link to this page from Profile and Home (when out of stars).
- **Profile Page**:
    - Replace "Points" with "Stars".
    - Add "เติม Star" button linking to `/package`.
- **Home Page (Prediction Input)**:
    - **Star Counter**: Small minimal display (e.g., ⭐ 12) at the bottom-right of `QuestionInput`.
    - **Empty State**: If `stars === 0`, replace `QuestionInput` with a prominent `GlassButton` ("เติม Star เพื่อรับคำทำนาย") linking to `/package`.

---
**Oracle Note**: แผนนี้เน้นความเรียบง่าย (Minimal) แต่รองรับการขยายผลไปยังระบบจ่ายเงินจริงในอนาคต โดยยังคงรักษา MimiVibe Design Pattern ไว้อย่างครบถ้วน
