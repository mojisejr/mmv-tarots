# 🛡️ Mission Blueprint: The Truth & The Restoration (Star Fix)

**Task**: Fix Triple Star Glitch & Referral State Desync
**Target Site**: `projects/mmv-tarots`
**Base Branch**: `staging`

## 1. Grounding Context
- **Patterns**: Ritual Gate (API-driven onboarding), Service-layered rewards.
- **Key Files**: 
    - [lib/server/auth.ts](projects/mmv-tarots/lib/server/auth.ts)
    - [services/credit-service.ts](projects/mmv-tarots/services/credit-service.ts)
    - [lib/server/services/referral-service.ts](projects/mmv-tarots/lib/server/services/referral-service.ts)
    - [app/api/user/onboarding/route.ts](projects/mmv-tarots/app/api/user/onboarding/route.ts)

## 2. Implementation Plan
1. **[CreditService]**: เพิ่ม Idempotency check ให้ `grantOnboardingBonus` และ `grantReferralEntryBonus` (เช็ค DB ก่อนบวก)
2. **[Auth Hook]**: ถอนการแจกดาวออก เหลือแค่การ Link ข้อมูลเบื้องต้น (Record IP/Referrer)
3. **[ReferralService]**: ปรับ `processReferralSignup` ให้เลือกได้ว่าจะแจกดาวทันทีหรือไม่ (เพื่อเลื่อนไปให้ Ritual Gate จัดการ)
4. **[Ritual Gate API]**: รวมศูนย์การเช็คและแจกดาวทั้งหมด (บวกดาว Onboarding + บวกดาว Referral ถ้ามี)
5. **[Frontend]**: เรียก `refreshBalance()` หลัง Ritual จบ

## 3. Verification Plan (The Hard Gate)
- [ ] Stars must be exactly 1 for normal signup after Ritual.
- [ ] Stars must be exactly 2 for referral signup after Ritual.
- [ ] Database `referred_by_id` must be correctly set.
- [ ] No double transactions in `CreditTransaction` table.
- [ ] `npm run build` at Site.
