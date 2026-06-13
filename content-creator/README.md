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
PENDING ─claim→ GENERATING ─gen สำเร็จ→ GENERATED ─approve(คน)→ APPROVED ─claim→ PUBLISHING ─post สำเร็จ→ POSTED
  GENERATING ─gen ล้ม→ FAILED                    PUBLISHING ─recovery→ FAILED / APPROVED
  (active) ─→ CANCELED ; ─error→ FAILED ─retry→ PENDING
```

**GENERATING = claim lease (S2)**: worker ต้อง `claimForGenerate()` (PENDING→GENERATING atomic) ก่อนเรียก Gemini — กัน concurrent gen ซ้ำ/เปลือง cost
- claim คืน **ownership token** (`generationToken`) — `markGenerated()`/`releaseGenerate()` ต้องส่ง token คืน, conditional update ทำงานเฉพาะ token ตรง → stale worker (ที่โดน reclaim) ทับ attempt ใหม่ไม่ได้ (คืน `SUPERSEDED`)
- ไฟล์ภาพเขียนลง path **ผูกกับ token** (`<id>-<token>.png`, 1 attempt = 1 ไฟล์ immutable) → stale worker overwrite ไฟล์ของ attempt ที่ชนะไม่ได้ ; เก็บ `imagePath` ใน DB เฉพาะตอน `markGenerated` สำเร็จ, ถ้า `SUPERSEDED`/ล้ม → ลบ artifact ของตัวเองทิ้ง
- `generatingAt` บันทึกเวลา claim ไว้สำหรับ **expiry-based reclaim** ในอนาคต
- **ข้อจำกัดปัจจุบัน**: ยัง**ไม่มี** auto-reclaim ของ GENERATING ที่ค้าง — ถอด transition `GENERATING→PENDING` ออกแล้ว (reclaim ที่ปลอดภัยต้องเช็ค expiry + ออก token ใหม่ก่อน ซึ่งยังไม่ทำ). gen ล้มไปทาง `FAILED` แล้ว retry ผ่าน `FAILED→PENDING`. row ที่ค้าง GENERATING (เช่น process ตายกลางคัน) ต้อง reconcile มือ — ดู [ตู๋ P1] / S4 reconciliation

**PUBLISHING = claim lease (S4)**: worker ต้อง `claimForPublish()` (APPROVED→PUBLISHING atomic) ก่อนยิง Facebook — กัน scheduler concurrent โพสต์ซ้ำ
