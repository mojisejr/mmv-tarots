# Mission Blueprint: Domain Loop Correction & Auth Hardening (#MMV-PHASE-5-6)
**Date**: 2026-03-08 23:10
**Context**: Correcting infinite redirect loop (www vs root) and refining Auth Enforcer in Middleware.
**Baseline**: `2b376ed`

## 🛠️ Grounding Summary
- **Vercel Settings**: Corrected to `maemormimi.com` (Production) & `www.maemormimi.com` (Redirect to Root).
- **Conflict**: Local Middleware (Phase 1) manually redirects `www` -> `root`, creating a potential race or double-hop if not carefully managed.
- **Bug**: Current Middleware may cause loops on `/liff` if not explicitly exempted.

## 🏃 Phase 1: Middleware Optimization (Stop the Loop)
1. [DONE] **Clean Redirects**: ลบ manual `www` redirect ออกจาก Middleware เพื่อใช้ Infrastructure-level redirect ของ Vercel (เร็วกว่าและปลอดภัยกว่า).
2. [DONE] **Exempt /liff**: เพิ่มระบบตรวจสอบให้ Auth Enforcer ไม่ทำงานในหน้า `/liff` (Prevent Auth Loop).
3. [DONE] **Exempt /api**: ตรวจสอบ matcher ให้แน่ใจว่า API ไม่ถูกขัดขวาง.

## 🏃 Phase 2: Verification (Hard Gate)
1. [DONE] **Build**: `npm run build`
2. [DONE] **Lint**: `npm run lint`
3. [DONE] **Local Test**: รัน `vitest` เพื่อยืนยันว่า Redirect logic และ Auth Logic ไม่พัง (**134/134 tests passed**).

## 🏃 Phase 3: Deployment & Snapshot
1. [DONE] **Commit**: `fix(#auth): resolve redirect loop and exempt /liff from auth enforcer`
2. [DONE] **Snapshot**: บันทึก Log ลงใน `ψ/memory/logs/mmv-tarots/`.
3. [PENDING] **RRR**: สรุปเซสชันการกู้คืนระบบ.

## 🛡️ Risk Mitigation
- **Risk**: Vercel cache อาจจะเก็บ redirect เก่าไว้.
- **Action**: แนะนำให้ทดสอบผ่าน Incognito หรือลบ Browser Cache หลังจาก Deployment.
