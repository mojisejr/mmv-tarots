# Snapshot: Sentry Implementation Roadmap for mmv-tarots

**Time**: 2026-02-01 22:13
**Context**: เตรียมความพร้อมสำหรับการปล่อย mmv-tarots ขึ้น Production โดยเน้นระบบ Monitoring ด้วย Sentry

## Insight

แผนการติดตั้ง Sentry แบบ 4-Phase ที่ทนทานต่อระบบเดิม (Next.js 16 + Better Auth + Workflow SDK):

1. **Phase 1: Installation**:
   - ใช้ `@sentry/wizard` เพื่อรันการตั้งค่าพื้นฐานและสร้างไฟล์ Config (`sentry.*.config.js`, `instrumentation.ts`)
   
2. **Phase 2: Configuration Cleanup**:
   - ปรับแต่ง `next.config.ts` ให้ใช้ `withSentryConfig(withWorkflow(nextConfig))` เพื่อรักษาความสามารถของ Workflow SDK เดิม
   - ตรวจสอบ `app/global-error.tsx` ที่ Wizard สร้างขึ้น

3. **Phase 3: Verification (Hard Gate)**:
   - ตรวจสอบการ Build (`npm run build`) และการอัปโหลด Source Maps
   - ตรวจสอบ Linter ให้ผ่านทั้งหมด

4. **Phase 4: Smoke Test**:
   - จำลอง Error เพื่อทดสอบการรับส่งข้อมูลระหว่าง Client/Server และ Sentry Dashboard

## Apply When

- เมื่อต้องการเพิ่มระบบ Error Tracking ในโปรเกต์ Next.js 15+ App Router
- เมื่อมีการใช้ `withWorkflow` หรือ Middleware หลายชั้นที่อาจขัดขวางการทำงานของ SDK ตัวอื่น

## Tags

`sentry` `nextjs` `production-ready` `monitoring` `mmv-tarots` `hard-gate`
