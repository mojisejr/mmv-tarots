# Snapshot: Sentry Implementation Success (Phase 1-3)

**Time**: 2026-02-01 22:23
**Context**: การติดตั้งและตั้งค่า Sentry SDK สำหรับ `mmv-tarots` ตามแผน Roadmap Phase 1-3

## Insight

การติดตั้ง Sentry แบบ "Manual Mode" (เพื่อหลีกเลี่ยง Wizard แบบ Interactive) สำเร็จด้วยดี:

1.  **Installation**:
    - ติดตั้ง `@sentry/nextjs`
    - สร้างไฟล์ Config ใหม่ 3 ไฟล์ (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
    - สร้าง `app/global-error.tsx` เพื่อดักจับ Error ระดับ Global
2.  **Configuration**:
    - ปรับ `next.config.ts` ให้ใช้ `withSentryConfig` ครอบ `withWorkflow` ได้อย่างถูกต้อง (Order: `withSentryConfig(withWorkflow(config))`)
    - แก้ไข Config `hideSourceMaps` (Deprecated) เป็น `sourcemaps: { deleteSourcemapsAfterUpload: true }`
3.  **Hard Gate Verification**:
    - **Build**: ✅ Passed (`npm run build`) - Source Maps upload logic included in build pipeline.
    - **Lint**: ✅ Passed (`npm run lint`).
    - **Warning**: มี Deprecation warning จาก Sentry เกี่ยวกับ `disableLogger` และ `reactComponentAnnotation` ซึ่งเป็นเรื่องปกติของ Version ใหม่กับ Turbopack (ยังคงใช้งานได้)

## Changes
- `package.json`: Added `@sentry/nextjs`
- `next.config.ts`: Integrated Sentry Config
- `app/global-error.tsx`: Created
- `sentry.*.config.ts`: Created

## Apply When
- เมื่อต้องการ Re-validate การติดตั้ง Sentry
- เมื่อต้องการตรวจสอบ Config ของ `next.config.ts` ที่มีการ Wrap หลายชั้น

## Tags
`sentry` `implementation` `success` `hard-gate-passed` `mmv-tarots`
