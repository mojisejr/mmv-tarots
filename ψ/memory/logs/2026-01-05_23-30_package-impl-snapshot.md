---
type: snapshot
project: mmv-tarots
status: implemented
timestamp: 2026-01-05_23-30
---

# Package & Promotion System Implementation

## Changes Implemented
1.  **Database Schema**:
    - Split `StarPackage` into `StarPackage` (Product) and `PackagePrice` (Price).
    - Added `isPromo` and `promoLabel` to `PackagePrice`.
    - Migrated database (cleared old data).

2.  **Data Seeding**:
    - Seeded 3 packages: Starter (10), Standard (30), Premium (60).
    - Each package has 2 prices: Regular and Promo (First-time).
    - Used dummy Stripe IDs (`_dummy`) for development.

3.  **API Logic**:
    - `POST /api/checkout/stripe`: Now accepts `priceId`. Checks `isPromo` eligibility against user's transaction history (must have 0 previous TOPUPs).
    - `GET /api/packages`: Returns packages with all active prices.
    - `GET /api/user/promo-eligibility`: New endpoint to check if user is a new customer.

4.  **Frontend**:
    - Updated `PackagePage` to fetch eligibility.
    - Displays "First Time Only" promo price if eligible.
    - Shows strike-through regular price.
    - Handles purchase flow with `priceId`.

## Next Steps
1.  **Stripe Setup**:
    - Create actual Products and Prices in Stripe Dashboard.
    - Update `stripePriceId` in the database with real IDs (can use `prisma studio` or a script).
2.  **Testing**:
    - Test purchase flow for new user (Promo price).
    - Test purchase flow for existing user (Regular price).
    - Verify credits are added correctly.

## Files Modified
- `projects/mmv-tarots/prisma/schema.prisma`
- `projects/mmv-tarots/app/api/checkout/stripe/route.ts`
- `projects/mmv-tarots/app/api/packages/route.ts`
- `projects/mmv-tarots/app/package/page.tsx`
- `projects/mmv-tarots/app/api/user/promo-eligibility/route.ts` (Created)
- `projects/mmv-tarots/scripts/seed-packages.ts` (Created)
