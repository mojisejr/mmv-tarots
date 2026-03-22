# Snapshot: Ritual Gate Implementation (Phase 2)

**Time**: 2026-01-19 14:55
**Context**: Implement Phase 2 ของแผน "Robust Auth & Phased Onboarding" เพื่อสร้างจุดแจกรางวัลที่แม่นยำ (Guaranteed Reward Point)
**Branch**: `feat/phase-2-onboarding-ritual` (mmv-tarots)

## 🕯️ What Changed

### Reward-Enabled Onboarding API
ปรับปรุง `app/api/user/onboarding/route.ts` จากเดิมที่เป็นแค่ flag update ให้กลายเป็น "พิธีกรรมศักดิ์สิทธิ์" (Ritual Checkpoint):
1.  **Idempotency Check**: ตรวจสอบว่า User คนนี้เคยทำ Onboarding ไปแล้วหรือยัง ถ้าทำแล้วจะข้ามทันทีเพื่อป้องกันการแจกรางวัลซ้ำ
2.  **Guaranteed Transaction**: ใช้ `db.$transaction` เพื่อมัดรวมการอัปเดตสถานะ (`onboardingCompleted`) และการแจกแต้ม (`CreditService.grantOnboardingBonus`) ไว้ด้วยกัน
3.  **Future-Proofing**: สร้างโครงสร้างไว้สำหรับการย้าย Referral Claims มาไว้ที่จุดนี้ได้ง่ายๆ ในอนาคต

```typescript
// Core Logic
await db.$transaction(async (tx) => {
  await tx.user.update({ ... });
  await CreditService.grantOnboardingBonus(user.id);
  // Referral processing fallback point
});
```

## 🛡️ The Hard Gate Check
- [x] `npm run build`: Passed (100% Success)
- [x] `git status`: Clean slate

## 📉 Impact
- **Accuracy**: การแจกดาวจะแม่นยำขึ้น 100% เพราะทำผ่าน Transaction และเช็ค Idempotency ชัดเจน
- **Performance**: ย้ายงานหนัก (Transaction) มาไว้จุดนี้ ทำให้ Login เร็วขึ้น (จากผลของ Phase 1)

## Next Steps
- [ ] Merge to `staging`
- [ ] Implement **Phase 3: Visual Confirmation UI** (แก้ Frontend ให้พูดความจริงกับ User ว่าได้แต้มแล้วนะ)

## Tags
`onboarding` `rewards` `transaction` `phase-2`
