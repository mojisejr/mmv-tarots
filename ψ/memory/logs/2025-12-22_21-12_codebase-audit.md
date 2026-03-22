---
type: snapshot
project: mmv-tarots
topic: codebase-audit
status: analysis
---

# รายงานการตรวจสอบ Codebase (Codebase Audit Report)

**วันที่:** 22 ธันวาคม 2025
**ผู้ตรวจสอบ:** Oracle (Copilot)
**สถานะ:** รอการแก้ไข (Pending Refactor)

## 1. บทสรุปผู้บริหาร (Executive Summary)
จากการตรวจสอบโครงสร้างโปรเจกต์ `mmv-tarots` พบว่าแม้ระบบหลัก (Next.js, Prisma, Better Auth) จะวางไว้ค่อนข้างดี แต่มีความไม่สม่ำเสมอในการจัดวางไฟล์ (Inconsistency) และการปะปนกันของหน้าที่ (Separation of Concerns) ซึ่งอาจก่อให้เกิดความสับสนในการพัฒนาต่อ โดยเฉพาะเมื่อทำงานคนเดียว (Solo Dev) ที่ต้องการความชัดเจนและลด Context Switching

**คะแนนความสะอาด (Cleanliness Score):** 6/10
**ความเร่งด่วน:** ปานกลาง (ควรจัดระเบียบก่อนเริ่มฟีเจอร์ใหญ่ถัดไป)

## 2. ปัญหาที่พบ (Key Findings)

### 2.1 โครงสร้างโฟลเดอร์สับสน (Structural Confusion)
- **Components กระจัดกระจาย:** พบไฟล์ UI พื้นฐาน (`button.tsx`, `card.tsx`) วางกองอยู่ที่ root ของ `components/` ในขณะที่มีโฟลเดอร์ `components/ui/` อยู่แล้วแต่กลับโล่ง
- **Ghost Folders:** พบโฟลเดอร์เปล่า `components/pages` และ `components/features/pages` ซึ่งสร้างความสับสนว่าควรวางไฟล์ที่ไหน
- **Logic ใน App Directory:** มีการ import logic จาก `app/workflows/tarot` เข้ามาใช้ใน API Route ซึ่งผิดหลักการของ Next.js App Router (Business Logic ควรแยกออกจาก Routing Layer)

### 2.2 ความไม่สม่ำเสมอของ Code (Inconsistency)
- **Import Styles:** บางไฟล์ใช้ Alias (`@/components`) แต่บางไฟล์ (เช่น `api/predict/route.ts`) ใช้ Relative Path ยาวเหยียด (`../../../`) ทำให้ย้ายไฟล์ยากและอ่านยาก
- **Client vs Server ใน Lib:** โฟลเดอร์ `lib/` มีการปนกันระหว่าง Client-side logic (`api.ts` ที่ใช้ fetch) และ Server-side logic (`auth.ts`, `db.ts`) ทำให้แยกแยะยากว่าไฟล์ไหนรันที่ไหน

### 2.3 การตั้งชื่อและ Data Model (Naming & Modeling)
- **User Identification:** ใน Database schema ใช้ field `userIdentifier` ในตาราง `Prediction` เพื่อ link กับ `User` แต่ใน Code มักใช้ `userId` การใช้ชื่อไม่ตรงกัน (Aliasing) อาจทำให้สับสนตอนเขียน Query หรือ Debug

## 3. ข้อเสนอแนะเพื่อการปรับปรุง (Recommendations for Solo Dev)

เพื่อให้ Codebase นี้ "Clean & Maintainable" สำหรับ Solo Dev ผมขอเสนอแผนการ Refactor ดังนี้:

### 3.1 จัดระเบียบ Components (The "Atomic" Rule)
ย้ายทุกอย่างเข้าที่ให้ชัดเจน:
- `components/ui/` → เก็บ Generic UI ทั้งหมด (Button, Card, Input)
- `components/features/` → เก็บ Component ที่ผูกกับ Business Logic (เช่น `TarotCard`, `PredictionView`)
- ลบโฟลเดอร์เปล่าที่ไม่ได้ใช้

### 3.2 แยก Service Layer (The "Brain" Separation)
สร้างโฟลเดอร์ `services/` หรือ `lib/services/` เพื่อเก็บ Business Logic:
- ย้าย `app/workflows/` ออกมาอยู่ที่ `services/workflows/`
- API Route จะทำหน้าที่แค่ "รับ Request -> เรียก Service -> ส่ง Response" (Controller Pattern)

### 3.3 จัดกลุ่ม Lib (The "Context" Split)
แยกไฟล์ใน `lib/` ให้ชัดเจน:
- `lib/client/` → สำหรับ function ที่เรียกจาก React Component (API wrappers)
- `lib/server/` → สำหรับ Database, Auth, External API calls (Server-only)
- หรือใช้ชื่อไฟล์ระบุ เช่น `api.client.ts`

### 3.4 มาตรฐานการเขียน (Coding Standards)
- บังคับใช้ `@/` imports เสมอ
- ใช้ `userId` ให้ตรงกันทั้ง DB และ Code (ถ้าแก้ DB ยาก ให้ทำ Type Alias หรือ Mapper ที่ชัดเจน)

## 4. แผนผังโครงสร้างใหม่ (Proposed Structure)

```text
src/ (หรือ root)
├── app/                 # Routing Layer (Pages & API Routes only)
├── components/
│   ├── ui/             # Dumb Components (Button, Card)
│   ├── features/       # Smart Components (TarotReading, AuthForm)
│   └── layout/         # Layout Components (Navbar, Footer)
├── lib/
│   ├── client/         # Client-side utilities (api-client.ts)
│   ├── server/         # Server-side utilities (db.ts, auth.ts)
│   └── utils.ts        # Shared utilities (cn, formatters)
├── services/           # Business Logic (The "Brain")
│   ├── tarot-service.ts
│   └── workflow-service.ts
└── prisma/             # Database Schema
```

## 5. สิ่งที่ต้องทำต่อไป (Next Steps)
1. **Approve Plan:** ยืนยันแผนการปรับปรุงโครงสร้างนี้
2. **Refactor Components:** ย้ายไฟล์เข้า `components/ui` และลบไฟล์ขยะ
3. **Refactor Imports:** แก้ไข import paths ให้เป็น `@/`
4. **Extract Services:** ย้าย Logic ออกจาก `app/`

---
*รายงานโดย Oracle Keeper*
