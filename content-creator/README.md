# content-creator — local admin tool

gen caption+ภาพ (Gemini) → ฟีม approve → auto-post Facebook page. **เครื่องมือของฟีม (admin) ไม่ใช่ feature สำหรับ end-users** ที่ดูดวง

## ⚙️ Runtime contract — LOCAL ONLY (P1.1)

feature นี้ **รันบนเครื่อง local เท่านั้น** ไม่ deploy บน Vercel:
- DB เป็น **file SQLite** (better-sqlite3) — Vercel serverless fs เป็น ephemeral/แยก instance → data หาย
- `createContentDb()` จะ **throw บน Vercel** (`process.env.VERCEL`) โดยตั้งใจ — กัน data loss
- route `/content-creator` ปิดบน production ด้วย env guard `CONTENT_CREATOR_ENABLED` (middleware → 404)

## ▶️ วิธีรัน (runnable target)

```bash
npm run content-creator:dev      # = CONTENT_CREATOR_ENABLED=true next dev
# เปิด http://localhost:3000/content-creator
```

ต้องมีใน `.env.local`:
- `CONTENT_DB_PATH` — path ของ SQLite file (default `content-creator/content.db`, persistent บนเครื่อง, gitignored)
- `GOOGLE_GENERATIVE_AI_API_KEY`, `CONTENT_FB_PAGE_ID`, `CONTENT_FB_PAGE_ACCESS_TOKEN` (สำหรับ gen/post)

> **Node 22** เท่านั้น (`.nvmrc`) — better-sqlite3 เป็น native module (ABI ผูกกับ Node version)
> Windows: ตั้ง env ผ่าน `.env.local` หรือ cross-env (inline env ใน script เป็น mac/linux)

## 🗄️ DB

- Drizzle + better-sqlite3, **แยกจาก Postgres/Neon หลัก 100%** (คนละ dep, คนละ file, ไม่แตะ build script)
- schema apply อัตโนมัติตอน startup (`migrate()` ใน `createContentDb`) — ไม่ต้องรัน migration เอง
- เปลี่ยน schema: แก้ `db/schema.ts` → `npx drizzle-kit generate` → commit migration artifact

## 🔄 State machine

```
PENDING ─gen→ GENERATED ─approve(คน)→ APPROVED ─claim→ PUBLISHING ─post สำเร็จ→ POSTED
  PUBLISHING ─recovery→ FAILED / APPROVED       (active) ─→ CANCELED ; ─error→ FAILED ─retry→ PENDING
```
**PUBLISHING = claim lease**: worker ต้อง `claimForPublish()` (APPROVED→PUBLISHING atomic) ก่อนยิง Facebook — กัน scheduler concurrent โพสต์ซ้ำ
