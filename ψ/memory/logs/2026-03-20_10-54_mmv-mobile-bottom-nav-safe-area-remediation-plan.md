# Snapshot: MMV Mobile Bottom-Nav Safe-Area & Payment Modal Remediation

**Time**: 2026-03-20 10:54 +0700
**Context**: Detailed /ppp for mobile bottom-nav overlap, payment modal layering, QR save affordance, and billing/policy surface protection before production

---
type: plan
project: mmv-tarots
task_id: "#mmv-mobile-bottom-nav-safe-area-ppp-2026-03"
status: active
tags: [plan, blueprint, mmv-tarots, mobile, bottom-nav, safe-area, modal, payment, billing, policy, transactions]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/app/layout.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/layout/bottom-nav.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/ui/modal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/package/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/billing/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/transactions/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/policy/privacy/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/policy/refund/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/policy/terms/page.tsx
---

## Objective
- ปิดปัญหา mobile content overlap ก่อน production โดยทำให้ทุกหน้าที่ใช้ bottom navigation ปลอดภัยจากการถูกบัง, ทำให้ payment modal อยู่เหนือ navigation อย่างชัดเจน, และเพิ่มทางเลือกบันทึก QR สำหรับผู้ใช้ที่ทำรายการบนโทรศัพท์เครื่องเดียว

## Scope
- In Scope:
  - สร้าง canonical mobile bottom spacing contract สำหรับทุกหน้าที่อยู่ใต้ BottomNav
  - แก้ z-layer contract ระหว่าง BottomNav และ Modal/PaymentModal
  - เพิ่ม QR save/download affordance ใน payment flow
  - ตรวจ audit และแก้ surfaces ที่คุณนนท์ระบุชัด: policy, package/payment modal, billing, transactions
  - เพิ่ม regression coverage สำหรับ mobile viewport และ modal layering logic เท่าที่ stack ปัจจุบันรองรับ
- Out of Scope:
  - redesign visual language ครั้งใหญ่ของ package/billing/transactions
  - เปลี่ยน payment state machine, billing semantics, หรือ API contract หลัก
  - เปลี่ยน desktop navigation behavior นอกจากส่วนที่ถูกแตะโดย shared shell contract

## Grounded Findings
- `app/layout.tsx` กันพื้นที่ล่างใน `<main>` แค่ `pb-[env(safe-area-inset-bottom)]` ซึ่งกันเฉพาะ home indicator แต่ไม่กันความสูงจริงของ BottomNav ที่เป็น fixed floating bar
- `components/layout/bottom-nav.tsx` ใช้ `fixed bottom-0 ... z-50` พร้อม `mx-4 mb-4` และ safe-area spacer แยก ทำให้ความสูงรวมที่ content ต้องเผื่อจริงมากกว่า `pb-24` ที่หน้าต่าง ๆ ใช้กันแบบ manual
- `components/ui/modal.tsx` ใช้ `fixed inset-0 z-50` เท่ากับ BottomNav; ใน RootLayout `BottomNav` ถูก render หลัง `{children}` จึงมีโอกาสลอยทับ modal/content บน mobile เมื่ออยู่ใน stacking level เดียวกัน
- `components/features/payment/PaymentModal.tsx` มี body scroll ของตัวเอง แต่ไม่ได้ reserve พื้นที่สำหรับ mobile nav หรือ lock/hide nav; ถ้า nav ลอยทับจะกินพื้นที่ปุ่ม/ส่วนท้ายของ flow ทันที
- `components/features/payment/PromptPayQR.tsx` มี flow สแกน QR + upload slip แต่ยังไม่มี affordance สำหรับ `บันทึก QR` หรือ `ดาวน์โหลด QR` สำหรับผู้ใช้ one-device payment journey
- `app/package/page.tsx`, `app/billing/page.tsx`, `app/transactions/page.tsx` ใช้ `pb-24` แบบคงที่; policy pages (`app/policy/privacy/page.tsx`, `app/policy/refund/page.tsx`, `app/policy/terms/page.tsx`) ไม่มี bottom reserve เลย จึงเสี่ยงให้ paragraph/link ท้ายหน้าถูก nav บัง
- Oracle learning เดิมของ project ระบุชัดว่าระบบนี้เคยใช้ dynamic padding system สำหรับ mobile-first shell และเคยเจอ overlap ระหว่าง fixed UI กับ BottomNav มาแล้ว; รอบนี้จึงเป็น regression ของ shell contract มากกว่าจะเป็น bug เฉพาะหน้าจอเดียว

## Root Cause Summary
1. Shell contract drift: global layout ไม่ reserve พื้นที่ตามความสูงจริงของ BottomNav
2. Local page workarounds drift: หลายหน้าใช้ `pb-24` เอง แต่ไม่ canonical และไม่พอสำหรับ nav + safe area ทุกอุปกรณ์
3. Layering ambiguity: Modal กับ BottomNav ใช้ z-index ระดับเดียวกัน
4. Payment single-device gap: QR flow รองรับ scan แต่ไม่รองรับ save/share path สำหรับคนที่ไม่ได้ใช้สองอุปกรณ์

## Architecture Direction
- Preferred approach: สร้าง shared mobile shell spacing token เดียว แล้วให้ pages ใช้ผ่าน layout/page-shell utilities แทน hard-code `pb-24`
- Preferred layering rule: modal/overlay ทุกชนิดต้องอยู่เหนือ BottomNav อย่างเด็ดขาด และเมื่อ modal transactional เปิด ควรพิจารณาซ่อนหรือ inert BottomNav บน mobile เพื่อไม่ให้รบกวน flow
- Preferred payment UX rule: QR surface ต้องรองรับสอง use cases พร้อมกัน
  - two-device: scan QR ทันที
  - one-device: save QR image แล้วสลับไป mobile banking app

## System Token Contract
- Goal:
  - ทำให้ spacing, layering, และ mobile-safe behavior เป็นระบบเดียวกันทั้งแอป ไม่ใช่ logic ad hoc ตามหน้า
- Required token classes:
  - **Layout tokens**
    - `--mobile-bottom-nav-height`: ความสูงของ nav capsule จริง
    - `--mobile-bottom-nav-margin`: ระยะลอยจากขอบจอ
    - `--mobile-safe-bottom`: ค่า `env(safe-area-inset-bottom)` ที่ normalize แล้ว
    - `--mobile-bottom-clearance`: clearance สุดท้ายที่ content ต้อง reserve = nav height + margin + safe area
  - **Layer tokens**
    - `--z-content`
    - `--z-bottom-nav`
    - `--z-toast`
    - `--z-modal`
    - `--z-critical-overlay`
  - **Optional interaction token/state**
    - `data-bottom-nav-state="visible|hidden|inert"` สำหรับ shell state ระหว่าง transactional modal เปิด
- Ownership rules:
  - token definitions อยู่ใน shell/global layer เท่านั้น เช่น `app/globals.css` หรือ shared layout helper
  - feature components ใช้ token ได้ แต่ห้ามนิยามค่า spacing/layer ใหม่เองถ้าไม่เป็น shared concern
  - page files ห้ามใส่ numeric fallback เช่น `pb-24`, `z-50`, `bottom-24` เพื่อแก้ปัญหา shell แบบเฉพาะหน้า ยกเว้นมีเหตุผลเฉพาะที่ documented ใน plan
- Success definition:
  - ถ้าจะแก้ spacing/layering ในอนาคต ต้องแก้ที่ token/contract กลาง ไม่ใช่ไล่แก้หลายหน้า

## Page-Shell Contract
- Goal:
  - แยก concern ระหว่าง `page content` กับ `navigation-safe viewport management`
- Proposed abstraction:
  - สร้าง shared page-shell utility หรือ wrapper เช่น `PageShell`, `page-shell-mobile-safe`, หรือเทียบเท่า
  - wrapper นี้ต้องรับผิดชอบอย่างน้อย 4 เรื่อง:
    - horizontal content padding มาตรฐาน
    - top spacing ที่สอดคล้องกับ root layout/header
    - bottom clearance จาก `--mobile-bottom-clearance`
    - opt-out/hide behavior สำหรับ immersive pages ที่ไม่มี BottomNav
- Adoption rules:
  - หน้า standard surfaces เช่น package, billing, transactions, policy ต้องใช้ page-shell contract เดียวกัน
  - หน้า immersive เช่น submitted/result สามารถ opt out ได้ แต่ต้องประกาศชัดว่า nav hidden และไม่ใช้ bottom clearance
  - component list/card ภายในหน้าไม่ควรแบก concern เรื่อง bottom-nav overlap เอง ยกเว้นมี floating CTA ภายในตัว component จริง ๆ
- Anti-patterns ที่ห้ามเพิ่มใน implementation:
  - ใส่ `pb-24`, `pb-28`, `pb-32` รายหน้าเพื่อแก้ทับเฉพาะจุด
  - ให้ card/list component รู้เรื่องความสูง BottomNav โดยตรง
  - แก้ z-index ชนะกันแบบกระจัดกระจายระหว่าง features
- Success definition:
  - เมื่อสร้างหน้าใหม่ที่อยู่ใต้ mobile nav, นักพัฒนาต้องใช้ page-shell เดียวและได้ safe spacing ทันทีโดยไม่ต้องจำ magic number

## Options Considered
### Option A: เพิ่ม padding รายหน้าอย่างเดียว
- Pros:
  - แก้เร็ว
- Cons:
  - regression ง่ายมาก
  - modal layering ยังไม่หาย
  - หน้าที่จะสร้างใหม่ในอนาคตยังมีโอกาสพลาด
- Verdict:
  - ไม่พอสำหรับ pre-production hardening

### Option B: แก้ที่ shell contract + z-layer + payment affordance พร้อม targeted page audit
- Pros:
  - แก้ root cause
  - ลด drift ของหน้าที่จะเพิ่มในอนาคต
  - ครอบคลุม pain point ที่ผู้ใช้เจอจริง
- Cons:
  - ต้องแตะ shared layout หลายจุด
- Verdict:
  - แนะนำใช้แนวทางนี้

## Phases
### Phase 1: Ground Truth Shell Contract ✅ DONE (commit 6e9a9c1)
- Deliverables:
  - ระบุ token set ขั้นต่ำของ shell ให้ครบ: `--mobile-bottom-nav-height`, `--mobile-bottom-nav-margin`, `--mobile-safe-bottom`, `--mobile-bottom-clearance`
  - นิยาม z-layer token set ขั้นต่ำ: `--z-content`, `--z-bottom-nav`, `--z-toast`, `--z-modal`, `--z-critical-overlay`
  - นิยาม rule ว่าหน้า mobile content ต้อง reserve เท่าไรเมื่อ BottomNav แสดงผล ผ่าน `--mobile-bottom-clearance`
  - ตรวจว่าหน้าไหน hide nav อยู่แล้ว (`/submitted`, result) และ mapping นี้กระทบ spacing อย่างไร
- Exit Criteria:
  - มี source of truth เดียวสำหรับ bottom reserve แทน `pb-24` กระจัดกระจาย
  - มี source of truth เดียวสำหรับ z-index hierarchy ของ shell overlays
  - ระบุได้ชัดว่าหน้าใดใช้ reserve, หน้าใดไม่ใช้
- Critical Test Cases:
  - shell token คำนวณรวม nav height + visual margin + `env(safe-area-inset-bottom)`
  - bottom nav, toast, modal ใช้ layer order เดียวกันทุกที่
  - immersive pages ที่ซ่อน nav ไม่โดน reserve เกินจำเป็น

### Phase 2: Layering & Modal Safety ✅ DONE (commit 6e9a9c1)
- Deliverables:
  - ปรับ `Modal` ให้มี z-layer สูงกว่า BottomNav อย่างชัดเจน
  - ตัดสินใจว่าจะ hide/inert BottomNav ระหว่าง payment modal เปิดหรือไม่ แล้วทำให้เป็น policy เดียวผ่าน shell state ไม่ใช่ feature-local hack
  - เพิ่ม bottom-safe padding ภายใน modal body สำหรับ mobile transactional content ถ้าจำเป็น
- Exit Criteria:
  - ไม่มีกรณีที่ BottomNav ทับ payment modal หรือ action buttons ใน mobile
  - interaction กับ nav ถูกปิดหรือไม่รบกวนขณะ modal เปิด
- Critical Test Cases:
  - เปิด payment modal บน mobile viewport แล้ว nav ไม่ลอยทับ content
  - close/open modal หลายครั้งไม่ทำให้ body scroll หรือ nav state เพี้ยน
  - modal ที่ hideCloseButton ยังอ่าน/scroll ได้สุดจนถึง action สุดท้าย

### Phase 3: One-Device Payment UX ✅ DONE (commit 6e9a9c1)
- Deliverables:
  - เพิ่มปุ่ม `บันทึก QR` หรือ `ดาวน์โหลด QR` จาก `PromptPayQR`
  - ถ้ารองรับได้บน browser/LIFF ปัจจุบัน เพิ่ม fallback copy เช่น long-press save หรือ open image in new tab เมื่อ download API ใช้ไม่ได้
  - ทบทวน copy ให้บอกชัดว่าผู้ใช้สามารถบันทึกรูปไปเปิดในแอปธนาคารได้
- Exit Criteria:
  - user one-device สามารถเก็บ QR ไปใช้ต่อได้โดยไม่ติด dead end
  - fallback behavior ชัดเจนเมื่อ browser จำกัดการดาวน์โหลด
- Critical Test Cases:
  - QR save action สร้างไฟล์รูปหรือเปิดทางเลือกที่ใช้งานได้จริงบน mobile browser
  - ยังอัปโหลด slip ต่อได้ตามปกติหลัง save/open image
  - credited/revive flow เดิมไม่ regress

### Phase 4: Surface Audit for Policy, Billing, Transactions, Package ✅ DONE (commit a81efbd)
- Deliverables:
  - สร้างหรือ adopt shared page-shell class/helper ให้ surfaces เหล่านี้ inherit bottom spacing เดียวกัน
  - migrate standard surfaces ไปใช้ page-shell contract เดียว แทนการคง `pb-24` รายหน้า
  - ตรวจ end-of-page readability โดยเฉพาะ policy links/footer copy/card actions ท้ายลิสต์
  - ตรวจ billing/transactions card stacks ใน viewport 667h, 740h, 844h โดยเฉพาะ CTA support และ pagination/filter area
- Exit Criteria:
  - policy/billing/transactions/package ไม่ถูก BottomNav บังบน mobile viewports เป้าหมาย
  - standard pages กลุ่มนี้ไม่เหลือ magic-number spacing สำหรับแก้ bottom-nav overlap
  - ไม่มีหน้าใหม่ในกลุ่มนี้ที่ยัง hard-code spacing แบบ drift
- Critical Test Cases:
  - policy pages scroll ถึง paragraph และ cross-links ท้ายหน้าได้เต็ม
  - billing page filter + support CTA ของ card สุดท้ายยังแตะได้
  - transactions card สุดท้ายและ balance info ไม่ถูก nav ทับ
  - package consent block + purchase CTA + modal trigger flow ยังอ่านง่ายบน mobile

### Phase 5: Hard Gate, Device Smoke, and Rollback Readiness ✅ DONE (commit a81efbd)
- Deliverables:
  - เพิ่มหรืออัปเดต tests ตาม stack ที่มีอยู่
  - รัน build, lint, test
  - จัด manual smoke checklist สำหรับ iPhone-class mobile browser + LIFF/webview ถ้ามี
  - ระบุ rollback surface ให้ชัดว่า revert shell token, modal layer, QR save แยกกันได้อย่างไร
- Exit Criteria:
  - hard gate ผ่าน
  - manual smoke ผ่านในอย่างน้อย 3 mobile heights ที่ครอบคลุม small, normal, tall
- Critical Test Cases:
  - 375x667: policy tail content ไม่ถูกบัง
  - 390x844: payment modal action area ไม่ถูก nav บัง
  - 430x932: billing/transactions last card ยัง scroll past nav ได้
  - payment one-device path: save QR -> switch app conceptually -> กลับมา upload slip ได้

## Implementation Strategy
- Preferred shared solution:
  - เพิ่ม system tokens ใน global layout/theme layer ก่อน แล้วค่อยให้ page-shell consume token เหล่านั้น
  - เพิ่ม mobile page-shell utility หรือ wrapper ที่อ่าน `--mobile-bottom-clearance` โดยตรง
  - ใช้ page-shell กับ standard pages แทน `pb-24`
- Preferred z-index hierarchy:
  - background < content < BottomNav < toast < modal/overlay < system-critical loading
  - หรือซ่อน BottomNav ระหว่าง modal เปิดถ้าพบว่าง่ายและปลอดภัยกว่า
- Preferred touch points:
  - shared shell: `app/layout.tsx`, `components/layout/bottom-nav.tsx`, `app/globals.css`
  - modal safety: `components/ui/modal.tsx`, อาจรวม `PaymentModal.tsx`
  - payment UX: `PromptPayQR.tsx`
  - page audit: `app/package/page.tsx`, `app/billing/page.tsx`, `app/transactions/page.tsx`, `app/policy/*/page.tsx`

## Design-System Guardrails
- DRY rule:
  - spacing/layer constants ต้องอยู่ใน token หรือ shared shell abstraction เท่านั้น
  - ถ้าพบเลขซ้ำเพื่อแก้ bottom-nav overlap มากกว่า 1 จุด ให้ย้ายขึ้น abstraction กลางทันที
- Separation of concern rule:
  - `BottomNav` รับผิดชอบแค่ navigation presentation/state
  - `Modal` รับผิดชอบ overlay contract
  - `PageShell` รับผิดชอบ viewport-safe spacing
  - `PromptPayQR` รับผิดชอบ payment-specific actions ไม่รับผิดชอบ global shell spacing
- Design token rule:
  - ใช้ semantic token names เสมอ หลีกเลี่ยงชื่อที่ผูกกับ implementation detail เกินไป ยกเว้น token ที่ตั้งใจเป็น shell metric เช่น `--mobile-bottom-clearance`
  - ถ้า token ใดจะถูกใช้เกิน 1 feature หรือเกิน 1 page ให้ประกาศใน global contract ก่อนใช้งานจริง

## Risks & Countermeasures
- Risk: เพิ่ม bottom spacing global แล้ว desktop หรือ immersive pages ดูโปร่งเกินจำเป็น
  - Countermeasure: ผูก rule กับ mobile breakpoint และ nav visibility เท่านั้น
- Risk: ซ่อน BottomNav ตอน modal เปิดแล้วกระทบ mental model/navigation state
  - Countermeasure: ใช้เฉพาะ transactional modal และคืน state ทันทีเมื่อปิด
- Risk: download QR ไม่ทำงานบาง browser/LIFF
  - Countermeasure: มี fallback เป็น open image หรือ long-press guidance และ test ใน environment จริง
- Risk: แก้ shared shell แล้วไปชนกับหน้า home หรือ pages ที่เคย optimize ไว้ก่อนหน้า
  - Countermeasure: จำกัด rollout กับ surfaces ที่ใช้ standard page wrapper ก่อน และ smoke หน้า home/result แถมอีกหนึ่งรอบ

## Rollback Strategy
- Trigger:
  - spacing ใหม่ทำให้ layout เพี้ยนหลายหน้า, modal close behavior เสีย, หรือ QR save ใช้งานไม่ได้ใน production browser สำคัญ
- Steps:
  - revert shell spacing commit ก่อนถ้า regression กว้าง
  - revert modal layering commit แยกได้ถ้าปัญหาอยู่เฉพาะ overlay behavior
  - revert QR save affordance แยกได้โดยไม่แตะ payment lifecycle logic
- Safe fallback:
  - คง root payment/billing logic เดิมไว้ทั้งหมด; รอบนี้แตะเฉพาะ presentation/shell contracts

## Verification Strategy
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Suggested focused checks:
  - component/UI tests for modal layering และ QR save affordance ถ้า current test setup รองรับ
  - visual/manual viewport smoke for 375x667, 390x844, 430x932
  - live flow smoke: package -> open modal -> save QR -> upload slip -> billing/transactions tail visibility

## Suggested Commit Strategy
- Commit 1: shell spacing + z-layer contract
- Commit 2: payment QR save affordance + modal polish
- Commit 3: page audit fixes + tests/docs checklist

## Handoff Notes for ggg
- เริ่มจาก Phase 1 + 2 ก่อน เพราะเป็น root cause ของ `content ถูกบัง` ทั้งระบบ
- อย่าเริ่มจากเติม `pb-24` รายหน้าเพิ่มอีก ถ้ายังไม่ล็อก shared shell token
- ถ้า LIFF/download path มีข้อจำกัด ให้เลือก fallback ที่จริงที่สุดแทน API download ที่สวยแต่ไม่ work
- ก่อน merge/deploy ต้องมี mobile manual smoke evidence อย่างน้อยหนึ่งรอบ

## Tags
`plan` `ppp` `mmv-tarots` `mobile-shell` `bottom-nav` `safe-area` `payment-modal` `qr-save` `billing` `transactions` `policy`