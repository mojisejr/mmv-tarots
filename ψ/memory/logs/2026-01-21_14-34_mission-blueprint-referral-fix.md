# Snapshot: Mission Blueprint (Lean & Robust) - LINE Referral Persistence Fix

**Time**: 2026-01-21 14:34
**Context**: แผนการแก้ไขปัญหา Referral สูญหายเมื่อใช้งานผ่าน LINE In-App Browser (IAB) โดยเน้นความเรียบง่ายและทนทาน (Simple + Robust)

## 🔍 Discovery (สิ่งที่คุณเจอ)
จากการตรวจสอบผ่าน Web Search และ Codebase Audit พบความจริงดังนี้:
1.  **Isolation Reality**: คุกกี้ที่เซ็ตใน LINE IAB จะไม่ถูกส่งต่อไปยัง External Browser (Safari/Chrome) ทำให้จังหวะขากลับจาก OAuth พัง
2.  **OAuth Capability**: LINE Login อนุญาตให้ Dynamic Query Parameters ติดไปกับ `redirect_uri` ได้ และ Better Auth รองรับการทำ `callbackURL` แบบมี Parameters
3.  **Persistence Path**: การส่งรหัสผ่าน URL ขากลับเป็นวิธีที่แน่นอนที่สุด เพราะ Browser ใหม่จะได้รับรหัสแนะนำผ่านทาง Address Bar ทันที และ Middleware ของเราจะทำหน้าที่ "ดักจับและชุบชีวิต" คุกกี้ใน Browser ใหม่นั้นเอง

---

## 🛡️ Mission Blueprint: Phase 1 (The URL Carrier)

**Task**: Implement URL-based Referral Persistence for OAuth Flow
**Target Site**: `projects/mmv-tarots`
**Base Branch**: `staging`

### 1. Grounding Context
- **Pattern**: OAuth Redirect Persistence
- **Key Files**: 
    - [lib/client/providers/navigation-provider.tsx](projects/mmv-tarots/lib/client/providers/navigation-provider.tsx)
    - [middleware.ts](projects/mmv-tarots/middleware.ts) (Verify only)

### 2. Implementation Plan
1.  **Capture existing ref**: ในหน้า Login, ตรวจสอบ URL ปัจจุบันว่ามี `?ref=...` หรือไม่
2.  **Inject into callbackURL**: ปรับ `handleLoginClick` ให้ส่ง `callbackURL` ที่มีรหัสแนะนำติดไปด้วย:
    ```typescript
    const ref = new URLSearchParams(window.location.search).get('ref');
    const callbackURL = ref ? `/?ref=${ref}` : '/';
    ```
3.  **Ensure Multi-step Compatibility**: ตรวจสอบว่า `callbackURL` นี้จะถูกส่งต่อไปยังหน้าขากลับของ Better Auth ได้ถูกต้อง

### 3. Verification Plan (The Hard Gate)
- [ ] ทดสอบสร้างลิงก์แนะนำแกล้งเปิดใน Private Mode
- [ ] จำลองการ Login และเช็คว่า URL ปลายทางยังคงมี `?ref=...` ติดมาหรือไม่
- [ ] ตรวจสอบ Database (User Table) ว่ามีการสร้าง `referredById` สำเร็จ

---

## 🔮 Future Resilience (Phase 2 - Optional)
- เพิ่ม "Referral Redemption" ในหน้า Profile เพื่อให้ User กรอกรหัสย้อนหลังได้ (Manual Fallback)

## Tags

`mission-blueprint` `line-referral-fix` `strategic-auth` `mmv-tarots`
