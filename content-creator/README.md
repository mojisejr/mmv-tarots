# content-creator — local admin tool

gen caption+ภาพ (Gemini) → ฟีม approve → auto-post Facebook page. **เครื่องมือของฟีม (admin) ไม่ใช่ feature สำหรับ end-users** ที่ดูดวง

## ⚙️ Runtime contract — LOCAL ONLY (P1.1)

feature นี้ **รันบนเครื่อง local เท่านั้น** ไม่ deploy บน Vercel:
- DB เป็น **file SQLite** (better-sqlite3) — Vercel serverless fs เป็น ephemeral/แยก instance → data หาย
- `createContentDb()` จะ **throw บน Vercel** (`process.env.VERCEL`) โดยตั้งใจ — กัน data loss
- route `/content-creator` ปิดบน production ด้วย env guard `CONTENT_CREATOR_ENABLED` (middleware → 404)
- gate = **fail-closed** (`content-creator/lib/enabled.ts`): ปิดเป็น default, เปิดเฉพาะ `CONTENT_CREATOR_ENABLED=true` บน local, **ปิดเสมอบน Vercel** แม้เผลอ set env. middleware + ทุก route handler เช็คซ้ำ (defense-in-depth)

## 🖥️ Approve UI (S3)

- หน้า `/content-creator` (client) → list โพสต์, โพสต์ `GENERATED` มีปุ่ม **Approve/Cancel**
- API (อยู่ใต้ `/content-creator/api/*` → middleware guard ครอบ):
  - `GET  /content-creator/api/posts` — list 50 ล่าสุด (imagePath → media URL, ไม่ leak fs path)
  - `POST /content-creator/api/approve` — `{id, action: approve|cancel}` → `tryTransition` GENERATED→APPROVED/CANCELED (atomic, double-approve → 409)
  - `GET  /content-creator/api/media/[name]` — serve ภาพจาก `CONTENT_MEDIA_DIR` ; **path-safe** (`basename` + assert ใต้ media root + บังคับ `.png` — กัน traversal เหมือน S2 P2)

## ➕ Seeding UI (S3.5a) — ทางเข้า

หน้า `/content-creator/new` (client) → สร้าง content เอง (แทน dev script) → pipeline ครบ input→approve ผ่าน UI
- กรอก template + input (finance-daily: card + meaning) → **สร้าง + Generate (sync, ~10s)** → เด้งกลับคิว approve
- API:
  - `GET  /content-creator/api/templates` — list template (dropdown)
  - `POST /content-creator/api/preview` — build prompt ที่จะส่ง Gemini **โดยไม่ gen** (ฟรี — ดูก่อนกด)
  - `POST /content-creator/api/create` — `{templateId, inputData}` → validate → insert PENDING → `generate()` **sync** → GENERATED (gen ล้ม → 502 + row FAILED)

## 🎨 Brand Profile (S3.5b/c) — theme/character เดียวกัน

แบรนด์ "หมอมี่" (แมวหมอดู) steer ทุก gen ให้ไม่หลุดกรอบ — spec verify ด้วย spike จริง (ดู memory `mmv-brand-spec`)
- **DB** `brand_profile` (singleton `default`): `stylePrompt`, `captionPersona`, `refImagePath`, `imageModel` — `getBrandProfile` merge บน DEFAULT (หมอมี่) → ใช้ได้ทันทีแม้ยังไม่ตั้งค่า
- **Settings UI** `/content-creator/settings` — ฟีมแก้ style prompt + caption tone ; `GET/PUT /content-creator/api/brand`
- **engine**: gen ดึง brand → caption system += persona ; image prompt += style
  - **มี `refImagePath` → `genImageWithRef` (nano banana `gemini-2.5-flash-image`)** ยึดตัวละคร/style จาก ref เป๊ะ (verified spike) + บังคับ **ห้าม text บนภาพ** (caveat: nano banana สะกดมั่ว — caption ใส่ตอนโพสต์ FB แยก)
  - ไม่มี ref → `genImage` (imagen text-to-image) เดิม
  - ref read แบบ path-safe (validate .png + อยู่ใต้ repo) ; ref ไม่พบ → FAILED (ไม่ silently off-brand)
- brand asset: `content-creator/brand/mimi-reference.png` (committed) · ~$0.039/ภาพ (nano banana)
- **NOTE**: PR นี้ ref = หมอมี่ fixed ; upload ref เอง = follow-up

## 🚀 Publish to Facebook (S4a — manual)

ปุ่ม **เผยแพร่ (Publish)** ในหน้า approve สำหรับโพสต์ `APPROVED` → ยิงขึ้นเพจจริง
- `POST /content-creator/api/publish {id}` → `claimForPublish` (APPROVED→PUBLISHING atomic) →
  `uploadUnpublishedPhoto` (published=false) → `publishToFeed` → `markPosted` (POSTED + fbPostId)
- **path-safe image read** ผ่าน `lib/safe-path.ts` (`safeResolveUnderRoot`) — util เดียวที่ media route + brand ref + publish ใช้ร่วม (DRY, กัน symlink/traversal)
- **Carry-forward gates (ตู๋)**:
  - `publishToFeed` ล้ม = **ambiguous** (อาจโพสต์แล้ว) → คง `PUBLISHING` **ไม่ release** (กันโพสต์ซ้ำ) → reconcile มือ
  - ล้มก่อน publish (อ่าน image/upload) → release→`APPROVED` (retry ได้, ยังไม่โพสต์)
  - `mediaFbid` reuse → retry ไม่ upload ซ้ำ
- env: `CONTENT_FB_PAGE_ID`, `CONTENT_FB_PAGE_ACCESS_TOKEN`
- **NOTE**: manual trigger ใน S4a ; scheduler (pm2 + cron + schedule config จ/อ/พ) = **S4b** (ทีหลัง) ; stuck-PUBLISHING auto-reconcile = S4b

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
