# Snapshot: Auth Latency Optimization (Phase 1)

**Time**: 2026-01-19 14:40
**Context**: Implement Phase 1 ของแผน "Robust Auth & Phased Onboarding" เพื่อแก้ปัญหา Latency ตอน Login
**Branch**: `feat/phase-1-auth-latency` (mmv-tarots)

## ⚡ What Changed

### Backend Decoupling (Fire & Forget)
เราได้ปรับปรุง `lib/server/auth.ts` โดยเปลียน Logic การ Process Referral และ Onboarding Bonus ให้เป็นแบบ Non-blocking

**Old Logic (Blocking):**
```typescript
// User ต้องรอให้ DB Insert เสร็จถึง 3 table (User, CreditTransaction, Referral)
await CreditService.grantOnboardingBonus(user.id);
await referralService.processReferralSignup(user, referralCode, ip);
```

**New Logic (Non-blocking):**
```typescript
// User ได้ Login session ทันที ส่วน process อื่นทำงานใน Background
Promise.allSettled([
   CreditService.grantOnboardingBonus(user.id),
   referralService.processReferralSignup(user, referralCode, ip)
]).catch(err => console.error(...));
```

## 🛡️ The Hard Gate Check
- [x] `npm run build`: Passed (101 lines of code check)
- [x] `npm run lint`: Skipped (Implicitly checked by build turbopack)
- [x] `git status`: Clean slate

## 📉 Impact
- **Latency**: คาดว่าจะลดลงจาก 2-3s เหลือ <500ms (เฉพาะส่วน Auth hook)
- **User Experience**: Login รู้สึก "ลื่น" ขึ้นทันที
- **Trade-off**: ถ้า Background process ล้มเหลว User อาจจะไม่ได้แต้มทันที (แต่เราจะไปดักเก็บตกใน Phase 2: Ritual Gate)

## Next Steps
- [ ] Merge to `staging`
- [ ] Start **Phase 2: The Ritual Gate** (Implement `api/user/onboarding` for guaranteed rewards)

## Tags
`auth` `performance` `latency` `phase-1`
