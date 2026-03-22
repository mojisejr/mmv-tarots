---
type: snapshot
project: mmv-tarots
task_id: "#mmv-slipok-payment-flow-grounding-2026-03-18"
status: active
tags: [snapshot, grounding, slipok, payment, billing, mmv-tarots]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/project_map.md
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/me/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx
  - /Users/non/dev/opilot/.tmp/mmv/slip-ok-api-guide.md
---

# Snapshot: MMV SlipOK Payment Flow Deep Grounding vs Guide

**Time**: 2026-03-18 15:21 +0700  
**Context**: Deep grounding ของ mmv-tarots เพื่อเทียบ PromptPay + SlipOK payment flow กับ official SlipOK API guide และประเมินความสอดคล้องของ billing history (payment-centric surface)

## Insight
- โครงสร้าง billing แยกจาก transaction ledger ได้ถูกแนวคิด (dual-ledger separation) และ owner isolation ใน API อยู่ในระดับดี
- แต่ชั้น integration กับ SlipOK มี contract drift สำคัญในระดับ endpoint/header/payload/response-shape
- ถ้าไม่แก้ drift จะมีความเสี่ยง false reject, amount validation ไม่ทำงานบางเคส, และ support load สูงขึ้นโดยไม่จำเป็น

## Evidence
- Map และ architecture ระบุ payment subsystem ชัดเจน: `payment_orders`, `payment_verification_logs`, billing route
- Payment verify call ปัจจุบันใช้ `SLIPOK_API_URL` default เป็น `https://api.slipok.com/api/v1/verify` และส่ง `Authorization: Bearer ...`
- SlipOK guide ระบุ endpoint หลักเป็น `https://api.slipok.com/api/line/apikey/<BRANCH_ID>` และใช้ header `x-authorization`
- โค้ด normalize response จาก top-level (`success`, `amount`) ขณะที่ guide ส่งข้อมูลหลักภายใต้ `data.success`, `data.amount`, `data.transRef`
- payment-fulfillment ทำ amount check เฉพาะเมื่อ parse `verifiedAmount` ได้เป็น number เท่านั้น
- UI ฝั่ง PromptPay รับและส่งเฉพาะ `slipImageUrl` (URL) และไม่ได้ expose mode `data`/`files` ตาม guide
- Billing API (`/api/payment/orders/me`) มี deterministic schema, pagination/filter, latestVerificationLog, และ verificationError fields

## Abnormal Findings
1. **Critical**: SlipOK request contract ไม่ตรง guide
- endpoint mismatch (`/api/v1/verify` vs `/api/line/apikey/<branchId>`)
- auth header mismatch (`Authorization: Bearer` vs `x-authorization`)
- request body mismatch (custom `paymentOrderId/slipImageUrl` only vs `data/files/url` + `log/amount`)

2. **Critical**: Response parsing shape ไม่ตรงกับ guide
- parser อ่าน top-level มากกว่า nested `data`
- external reference mapping ยังไม่ครอบคลุม `data.transRef` ตาม guide
- amount check อาจถูกข้ามในบาง response shape

3. **High**: Delay/retry semantics ของ SlipOK error code ยังไม่ครบ
- guide ระบุ code 1010 (delay bank) ให้รอแล้วตรวจซ้ำ
- guide ระบุ code 1009 เป็น temporary outage
- flow ปัจจุบัน map verify fail ไป REJECTED ค่อนข้างเร็ว

4. **High**: ยังไม่ได้ใช้ความสามารถ `log: true`/duplicate-check/receiver-check ตาม guide อย่างชัดเจน
- โดยเฉพาะ handling สำหรับ 1012/1014 และ policy เมื่อไม่ส่ง `log: true`

5. **Medium**: Billing history ใช้งานได้ แต่ยังไม่ลึกพอในมุม ops
- ตอนนี้ดึงหน้าแรก fixed 20 รายการ
- มี error code/message แล้ว แต่ยังไม่ map เป็น user guidance เฉพาะเคส (เช่น 1010/1012/1014)

## Risk Matrix
- **R1 Contract Drift**: ความน่าจะเป็นสูง / ผลกระทบสูง
- **R2 False Reject**: ความน่าจะเป็นกลาง-สูง / ผลกระทบสูง
- **R3 Support Load Spike**: ความน่าจะเป็นกลาง / ผลกระทบกลาง-สูง
- **R4 Observability Gap**: ความน่าจะเป็นกลาง / ผลกระทบกลาง

## Apply When
- ใช้ snapshot นี้ทันทีเมื่อจะวางแผน refactor payment verification layer ของ mmv-tarots
- ใช้เป็น baseline ก่อนเขียนแผน phase-based (A/B/C) เพื่อคุม regression ใน billing surface

## Guardrails
- ห้ามแก้แบบ big-bang: แยก phase และ lock test contract ทีละชั้น
- ต้อง preserve owner isolation + deterministic schema ของ `/api/payment/orders/me`
- ต้องไม่แตะความลับจริงในเอกสาร/โค้ด snapshot
- ทุกการเปลี่ยนแปลง verify layer ต้องมี test สำหรับ code-path: success, amount mismatch, duplicate, delayed, temporary outage

## Next Actions
1. Phase A: Align SlipOK request contract (endpoint/header/body/env)
2. Phase B: Rewrite response normalization + error code mapping (1009/1010/1012/1013/1014)
3. Phase C: Upgrade billing UX (error semantics + pagination/filter UX + support context)
4. Hard Gate: build/lint/test + focused payment suites + manual smoke with real-like payload matrix

## Search Insight Check
- Oracle search query: `mmv-tarots decision OR blocker OR consensus OR vow`
- Result: ไม่พบ blocker ล่าสุดที่ชี้มาที่ SlipOK โดยตรง (เจอ log เชิงธีม LIFF เป็นหลัก)
- Interpretation: ใช้ code+guide evidence เป็นหลักในการวางแผนรอบถัดไป

## Tags
`snapshot` `deep-grounding` `slipok` `promptpay` `billing-history` `contract-drift` `mmv-tarots`
