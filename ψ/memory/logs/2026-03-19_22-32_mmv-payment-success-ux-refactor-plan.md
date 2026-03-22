# Snapshot: MMV Payment Success UX & Notification Refactor Blueprint

**Time**: 2026-03-19 22:32 +0700
**Context**: Detailed /ppp for payment success UX, LINE OA notification copy, and post-purchase navigation

---
type: plan
project: mmv-tarots
task_id: "#mmv-payment-success-ux-ppp-2026-03"
status: active
tags: [plan, blueprint, mmv-tarots, payment, ux, line-oa, receipt, post-purchase]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/line-oa-notification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentReceipt.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/package/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/billing/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx
---

## Objective
- Refactor post-payment success experience ของ MMV Tarots ให้เป็น product journey ที่มีประโยชน์จริง แทนการแจ้งผลแบบระบบล้วน โดยทำให้ web receipt, toast, และ LINE OA notification พูดภาษาเดียวกันและพาผู้ใช้ไปยัง next action ที่เหมาะกับ context.

## Scope
- In Scope:
  - ปรับ LINE OA success notification copy จาก operational text ไปเป็น human/product message พร้อม next action.
  - ปรับ payment receipt UI และ modal success handling ให้รองรับ actionable CTA มากกว่าเดิม.
  - ออกแบบ return-to / intended-action flow เพื่อพาผู้ใช้กลับไปยัง journey ที่ค้างอยู่หลังเติมดาว.
  - สร้าง shared success payload/presenter contract ระหว่าง server notification และ client receipt/toast.
  - เพิ่ม test coverage สำหรับ success copy contract, CTA logic, และ notification trigger behavior.
- Out of Scope:
  - เปลี่ยน payment verification state machine, SlipOK semantics, หรือ pricing logic.
  - redesign visual language ใหญ่ทั้งหน้า package/profile นอกเหนือจาก success surface.
  - เปลี่ยน auth, LIFF identity flow, หรือ transaction ledger schema.

## Grounded Findings
- LINE OA notification ปัจจุบันประกอบข้อความแบบ plain text 3 บรรทัดใน `line-oa-notification-service.ts` และถูกเรียกหลัง `submitSlip` credit สำเร็จ.
- Client success UX ปัจจุบันเกิดใน `PaymentModal` -> `PaymentReceipt` โดยมี toast ไทยสั้น ๆ และปุ่มหลักพาไป `/` แบบตายตัว.
- Billing surface มี reference และ payment history พร้อมใช้งานแล้ว จึงเหมาะเป็น secondary CTA มากกว่าสร้าง success page ใหม่ทันที.
- Current architecture มีแหล่ง truth ของ payment success ฝั่ง server ชัด (`paymentFulfillmentService`), แต่ presentation layer ยังแยกกันคนละสำนวนและไม่ใช้ shared contract.

## Dependencies & Dragons
- Dependencies:
  - `paymentFulfillmentService` ต้องคงเป็น domain truth ว่าเครดิตสำเร็จเมื่อใด.
  - LINE OA push ต้องยัง graceful เมื่อไม่มี LINE account หรือ access token.
  - Navigation shell / balance refresh ต้องสะท้อนดาวใหม่ทันทีหลัง credited.
- Dragons:
  - ถ้าแก้ copy แบบกระจายหลายไฟล์โดยไม่มี shared contract จะ drift ซ้ำอีก.
  - ถ้าเพิ่ม CTA แต่ไม่มี intended action state อาจพาผู้ใช้ผิดบริบทและทำให้ UX แย่ลง.
  - ถ้าใช้ LINE message rich เกินไปโดยไม่มี fallback text อาจเพิ่ม operational fragility โดยไม่จำเป็น.

## Architecture Direction
- Introduce `PaymentSuccessSummary` as a presentation-safe model, generated from credited order facts.
- Separate 3 output adapters:
  - Web toast copy
  - Web receipt/CTA content
  - LINE OA notification copy
- Introduce optional `returnTo` / `intent` metadata at payment entry so receipt CTA can continue the user journey instead of always sending user to home.
- Prefer incremental refactor over adding a brand new success page unless Phase 2 proves current modal is too constrained.

## Phases
### Phase 1: Success Contract & Copy Foundation
- Deliverables:
  - Define a shared `PaymentSuccessSummary` type with fields like `referenceCode`, `starsGranted`, `packageName`, `amountTHB`, `creditedAt`, `primaryAction`, and optional `returnTo`/`intent`.
  - Extract copy-building helpers for LINE OA and web surfaces into a dedicated presenter/helper module.
  - Rewrite LINE OA copy to be user-facing Thai/brand-aligned, concise, and action-oriented.
- Exit Criteria:
  - ไม่มี hard-coded success copy สำคัญกระจายหลายจุดโดยไร้ contract.
  - LINE OA message สามารถสร้างจาก summary object เดียวกันได้.
- Critical Test Cases:
  - success summary from credited order contains correct stars/reference/package data.
  - LINE fallback message renders deterministic Thai copy when only required fields exist.
  - missing optional action link/intent does not break message generation.

### Phase 2: Receipt UX & CTA Refactor
- Deliverables:
  - Refactor `PaymentReceipt` ให้แสดง hierarchy ใหม่: success confirmation, stars received, optional updated balance, and two useful CTAs.
  - Replace single hard-coded home redirect with configurable CTA model.
  - Reduce prominence of technical reference while still keeping it accessible in receipt details.
- Exit Criteria:
  - Receipt component supports at least primary CTA + secondary CTA.
  - Primary CTA ไม่เป็น hard-coded `/` อีกต่อไป.
- Critical Test Cases:
  - default success receipt shows stars/package/amount/reference correctly.
  - primary CTA route varies correctly by supplied action.
  - secondary CTA can open billing/history without breaking modal close flow.

### Phase 3: Intended Journey / Return-To Flow
- Deliverables:
  - Add payment entry context metadata from purchase origin, such as `sourcePage` and optional `intendedAction`.
  - Persist enough success context so that users who topped up because they were blocked can continue the original journey.
  - Define routing rules such as:
    - paywall/interrupted reading -> continue to question/prediction path
    - profile/package self-initiated top-up -> go to home or billing
- Exit Criteria:
  - Success navigation becomes context-aware instead of globally static.
  - Resume path remains safe if original target is unavailable.
- Critical Test Cases:
  - package-page direct purchase -> primary CTA resolves to default browsing path.
  - interrupted paywall purchase -> primary CTA returns user to intended action.
  - stale/invalid returnTo metadata falls back safely to home.

### Phase 4: Integration, Observability, and Compatibility
- Deliverables:
  - Wire route/service/client layers so credited event produces one success summary consumed by notification + UI.
  - Preserve existing `emitPaymentEvent` and billing history compatibility.
  - Add analytics/observability hooks only if they support product questions, not debug noise.
- Exit Criteria:
  - Success UI and notification are semantically aligned.
  - No regression to billing page, polling, or credited event emission.
- Critical Test Cases:
  - credited event still triggers LINE notify attempt and success UI.
  - notification failure does not block payment success response.
  - billing page continues to show reference and credited timestamp correctly after refactor.

### Phase 5: Hard Gate, Smoke, and Rollout Safety
- Deliverables:
  - Update/add unit tests for presenters and component behavior.
  - Run full hard gate and targeted smoke scenarios.
  - Document rollout assumptions and fallback strategy if context-aware CTA causes confusion.
- Exit Criteria:
  - `build`, `lint`, `test` pass.
  - Manual smoke confirms both normal top-up and interrupted-journey top-up paths.
- Critical Test Cases:
  - happy path: upload slip -> credited -> receipt shows useful CTAs -> correct route reached.
  - LINE OA message content looks human-readable and includes recognizable next action.
  - fallback path works when no LINE account or no intended action metadata exists.

## UX Recommendations to Preserve in Execution
- Keep receipt modal instead of immediately adding a standalone success page.
- Prioritize usefulness over ornament:
  - show what user gained
  - show what they can do next
  - keep reference/billing access nearby but secondary
- Suggested CTA pattern:
  - Primary: `ไปอ่านคำทำนายต่อ` or context-specific continuation
  - Secondary: `ดูรายการชำระเงิน`
- Suggested LINE OA copy direction:
  - warm, short, recognizable
  - mention stars gained and order reference
  - optionally include a direct action link if environment/config is ready

## Risks & Countermeasures
- Risk: Context-aware routing introduces edge cases and stale targets
  - Countermeasure: enforce route whitelist + fallback to `/`
- Risk: Presenter abstraction becomes over-engineered for a small flow
  - Countermeasure: keep contract minimal and focused only on success surfaces
- Risk: LINE copy and web copy diverge later
  - Countermeasure: keep one summary model and adapter tests for each output surface
- Risk: Balance shown in receipt can drift if hydration lags
  - Countermeasure: either use confirmed delta-only copy first or refresh balance before rendering final CTA state

## Rollback Strategy
- Trigger:
  - success CTA sends users to wrong place, receipt breaks modal flow, or LINE notification content degrades comprehension
- Steps:
  - rollback presenter/CTA refactor as one phase-scoped commit set
  - keep existing credited event and fulfillment logic untouched
  - revert to current single CTA receipt and current notification text if necessary

## Verification Strategy (Hard Gate)
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Focused suites to add/update:
  - `__tests__/api/payment-order-slip-route.test.ts`
  - presenter/helper tests for payment success copy
  - component tests for `PaymentReceipt` CTA behavior
  - any route or UI test that covers intended-action fallback routing

## Suggested File Strategy
- Likely touch points:
  - `lib/server/services/line-oa-notification-service.ts`
  - `app/api/payment/orders/[id]/slip/route.ts`
  - `components/features/payment/PaymentModal.tsx`
  - `components/features/payment/PaymentReceipt.tsx`
  - optional shared helper such as `lib/shared/payment-success-presenter.ts`
- Avoid touching:
  - payment verification parser/state machine
  - billing API contract except if secondary CTA needs an explicit route helper only

## Handoff Notes for ggg
- Execute phase-scoped commits only.
- Start with Phase 1 and Phase 2 together only if presenter contract is small and testable.
- Do not introduce a new success page by default; prove modal limitations first.
- Keep LINE notification fallback text even if richer message format is added later.

## Tags
`plan` `ppp` `mmv-tarots` `payment-success` `receipt-ux` `line-oa` `post-purchase`

---

## Revision Addendum
- Timestamp: 2026-03-19 22:54 +0700
- Reason:
  - ขยายแผนเดิมให้ครอบคลุม pain point ที่เชื่อมตรงกับ post-purchase flow: active order ซ้ำ, billing history visibility ที่ทำให้ user สับสน, และ billing support escalation ไป Discord ticket flow
  - ใช้ไฟล์แผนเดิมเป็น single source of truth ต่อเนื่อง ไม่แตก plan ใหม่

## Revision Decision
- Keep one plan file:
  - เหตุผลคือปัญหาชุดนี้ยังอยู่ใน payment journey เดียวกัน ตั้งแต่ create order -> upload slip -> credited -> receipt -> billing follow-up -> support escalation
  - ถ้าแยกเป็น plan ใหม่ จะทำให้ contract ระหว่าง payment success summary, billing visibility policy, และ support escalation drift ได้ง่าย
- Revised objective:
  - Refactor post-payment success experience ให้ครอบคลุมทั้ง success surfaces และ payment-aftercare surfaces โดยลดความกำกวมของรายการชำระเงิน, ซ่อน noise ที่ user ยังไม่ได้เริ่มชำระจริง, และทำให้ escalation จาก billing history ไปสู่ support ticket ใช้งานได้จริงในระบบเดียว

## Additional Grounded Findings
- Payment order duplication risk:
  - `POST /api/payment/orders` สร้าง `payment_orders` ใหม่ทุกครั้งโดยไม่มี idempotency key หรือ reuse policy
  - `paymentOrderService.createOrder()` เรียก `db.paymentOrder.create()` ตรง ทำให้การเปิด payment flow ซ้ำสร้าง order ใหม่ได้ทันที
  - `PaymentModal` เรียก `createOrder()` ทุกครั้งเมื่อเปิด modal แล้วไม่มี `resumeOrderId`
  - หน้า package มี local restore แค่ snapshot ล่าสุด แต่ยังไม่ enforce ว่า user จะมี active order ได้เพียงใบเดียวในระบบ
- Billing history semantics:
  - หน้า billing ดึงจาก `payment_orders` โดยตรงและเปิดให้ทุกสถานะเป็น default surface
  - default experience ปัจจุบันจึงทำให้ user เห็นทั้ง order ที่ยังไม่เริ่มจ่ายจริงและ order ที่จ่ายสำเร็จอยู่พร้อมกัน
  - ใน schema ปัจจุบัน ระบบกันเครดิตซ้ำที่ระดับ `credit_transactions.paymentOrderId @unique` แล้ว ดังนั้นปัญหาที่ user รับรู้มีแนวโน้มเป็น order duplication / surface duplication มากกว่า double credit
- Billing support escalation:
  - หน้า profile มี support flow ที่ยิงเข้า `/api/support` และส่ง Discord webhook แล้ว
  - หน้า billing ยังใช้ `mailto:` พร้อมข้อมูลรายการ แปลว่า support escalation ยังไม่ reuse infrastructure เดิม
  - `payment-observability` มี Discord alert channel อยู่แล้ว จึงสามารถใช้ร่วมกับ billing support ได้ แต่ควรแยกประเภท signal ระหว่าง system alert กับ user-raised ticket

## Scope Revision
- Added In Scope:
  - ลดการสร้าง active payment order ซ้ำโดยไม่จำเป็น ผ่าน server-side reuse / idempotent create policy
  - ปรับ default billing history visibility ให้แสดงเฉพาะรายการที่มีความหมายต่อ user และซ่อน noise ของ order ที่ยังไม่เริ่มชำระจริง
  - ย้าย billing support CTA จาก `mailto:` ไปใช้ Discord-backed support ticket flow แบบเดียวกับ profile พร้อม enrich payment context
  - เพิ่ม regression coverage สำหรับ active-order reuse, history filtering, และ billing support payload
- Still Out of Scope:
  - แก้ payment verification parser/state machine
  - เปลี่ยน credit ledger model ใหญ่ หรือแยก billing ไปอีก domain ใหม่
  - เปลี่ยน LINE identity / auth / LIFF architecture

## Architecture Revision
- Add `ActivePaymentOrderPolicy`:
  - ก่อนสร้าง order ใหม่ ให้ query หา active order เดิมของ user + package + channel ที่ยังไม่ terminal และยังไม่หมดอายุ
  - ถ้าเจอ ให้ return order เดิมแทนการ create ใหม่
- Add `BillingHistoryVisibilityPolicy`:
  - Default billing list ควรโชว์เฉพาะ meaningful attempts เช่น `SLIP_UPLOADED`, `VERIFYING`, `VERIFIED`, `REJECTED`, `CREDITED`
  - `PENDING_PAYMENT` และ `EXPIRED` ที่ไม่มีหลักฐานว่าเริ่ม payment attempt จริง ควรถูกซ่อนจาก default view แต่ยังเปิดผ่าน filter ได้
- Add `BillingSupportTicketAdapter`:
  - reuse `/api/support` หรือแตก helper กลางสำหรับ Discord payload เพื่อให้ billing CTA ส่ง ticket พร้อม order context ได้
- Keep `PaymentSuccessSummary` direction:
  - summary model เดิมยังเป็นแกนหลักสำหรับ success receipt / toast / LINE OA
  - แต่แผนนี้ต้องเพิ่ม relation กับ order lifecycle policy เพื่อให้ success surface และ billing surface ไม่ขัดกันเอง

## Revised Phase Map
- Phase 0: Active Order Reuse and Idempotent Create ✅ DONE (commit 38917be)
- Phase 1: Success Contract & Copy Foundation ✅ DONE (commit 38917be)
- Phase 2: Receipt UX & CTA Refactor ✅ DONE (commit 38917be)
- Phase 3: Intended Journey / Return-To Flow ✅ DONE (commit 4827035)
- Phase 3.5: Billing History Visibility and Meaningful Attempt Filter ✅ DONE (commit 4827035)
- Phase 4: Integration, Observability, and Compatibility ✅ DONE (commit 4827035)
- Phase 4.5: Billing Support Ticket and Error Context Routing ✅ DONE (commit 4827035)
- Phase 5: Hard Gate, Smoke, and Rollout Safety

## New Phase 0: Active Order Reuse and Idempotent Create
- Objective:
  - ปิด root cause ที่ทำให้ user เห็น payment order ซ้ำโดยไม่จำเป็น
- Deliverables:
  - เพิ่ม server-side lookup ก่อน create order ใหม่ โดยพิจารณา active order ของ user ใน channel `PROMPTPAY_QR`
  - กำหนด reusable statuses ชุดแรก เช่น `PENDING_PAYMENT`, `SLIP_UPLOADED`, `VERIFYING`, `VERIFIED`
  - ตัด order ที่หมดอายุหรือ terminal ออกจาก reuse path
  - ปรับ API response/metadata ให้ client รู้ว่า response เป็น `reused` หรือ `created`
  - harden package/payment modal bootstrap เพื่อลด create race ระหว่าง restore flow กับ open flow
- Exit Criteria:
  - การเปิด payment modal ซ้ำในบริบทเดิมไม่สร้าง order ใหม่ถ้ายังมี active order ที่ใช้ต่อได้
  - history ไม่โตจากการเปิด flow ซ้ำเฉย ๆ ใน normal path
- Critical Test Cases:
  - same user + same package + active pending order -> `POST /api/payment/orders` returns existing order
  - expired order -> create new order
  - credited order -> create new order
  - stale local snapshot but reusable server order -> modal resumes existing order safely
- Likely touch points:
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-order-service.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx`
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/package/page.tsx`

## Revised Phase 3.5: Billing History Visibility and Meaningful Attempt Filter
- Objective:
  - ทำให้ billing history เป็น user-facing ledger ที่อ่านแล้วเข้าใจว่ารายการไหน “เกี่ยวข้องจริง” โดยไม่ปะปนกับ QR/order ที่ยังไม่ถูกเริ่มใช้จริง
- Deliverables:
  - นิยาม default visibility policy ของ billing history ใหม่
  - ซ่อน `PENDING_PAYMENT` จาก default list
  - ซ่อน `EXPIRED` ที่ไม่มี slip image / verification log / meaningful attempt evidence จาก default list
  - ปรับ filter UX ให้ user เลือกดู hidden statuses ได้เมื่อจำเป็น เช่น “ดูรายการทั้งหมด” หรือ “ดูรายการที่ยังไม่เริ่มชำระ”
  - พิจารณา label/filter wording ใหม่ให้ user เข้าใจว่ากำลังดู “รายการชำระเงินจริง” ไม่ใช่ทุก QR draft
- Exit Criteria:
  - default billing page ไม่โชว์ order draft/noise ที่ทำให้ user สับสน
  - user ยังสามารถเข้าถึง hidden statuses ผ่าน filter ที่ชัดเจนได้
- Critical Test Cases:
  - default query excludes `PENDING_PAYMENT`
  - expired order without slip evidence hidden by default
  - verifying/rejected/credited still visible by default
  - explicit filter can reveal hidden draft statuses
- Likely touch points:
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/me/route.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx`
  - optional helper for visibility policy if logic grows beyond route readability

## Revised Phase 4.5: Billing Support Ticket and Error Context Routing
- Objective:
  - แปลง billing support CTA จาก mail client handoff ไปเป็น in-product escalation ที่ส่งข้อมูลครบเข้า Discord ticket flow ได้ทันที
- Deliverables:
  - เปลี่ยน CTA ใน billing history จาก `mailto:` ไปเรียก support API แบบเดียวกับ profile
  - เพิ่ม billing-specific support payload builder ที่แนบ order context เช่น status, reference, package, amount, error category, verification details, latest log timestamp
  - ปรับ Discord embed ให้แยกประเภท ticket เป็น `Billing Support Ticket` และทำให้ team อ่านได้เร็ว
  - ถ้าจำเป็น แยก helper กลางสำหรับ support payload เพื่อไม่ให้ profile/billing drift
  - กำหนด relationship ระหว่าง user-raised ticket กับ `notifyPaymentAlert` ให้ไม่ส่งข้อมูลซ้ำแบบ noisy เกินไป
- Exit Criteria:
  - user สามารถกดขอความช่วยเหลือจาก billing history แล้ว ticket ถูกส่งเข้า Discord โดยไม่ต้องออกไป mail app
  - ticket มีข้อมูลเพียงพอให้ทีม support triage ได้ทันที
- Critical Test Cases:
  - rejected/verifying/expired billing item can submit support ticket successfully
  - support payload includes reference and payment diagnostics
  - missing webhook config still fails gracefully with actionable UI error
  - payment observability alert path remains independent from manual ticket path
- Likely touch points:
  - `/Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx`
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/api/support/route.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/profile/page.tsx`
  - optional shared support payload helper under `lib/shared/` or `lib/server/`

## Phase Dependency Notes
- Phase 0 should precede Phase 3.5:
  - ถ้าไม่หยุด order duplication ก่อน การปรับ history visibility จะกลายเป็นแค่การซ่อนอาการ
- Phase 1 and Phase 2 can still proceed after Phase 0:
  - เพราะ success copy/receipt contract ไม่ขัดกับ active-order reuse
- Phase 3 depends on Phase 2 contract stability:
  - CTA model ต้องนิ่งก่อนจึงจะต่อ intended journey ได้ง่าย
- Phase 4.5 should land after Phase 3.5 or together with it only if shared payload shape is already stable

## Additional Risks & Countermeasures
- Risk: server-side reuse policy คืน order ผิด package หรือผิด context
  - Countermeasure: lock lookup by `userId + packagePriceId + channel` และ exclude terminal/expired states อย่างชัดเจน
- Risk: default billing visibility ซ่อนรายการที่ user บางคนยังอยากใช้ตาม
  - Countermeasure: ทำ explicit filter/preset สำหรับ `ดูทั้งหมด` และให้ hidden statuses เปิดดูได้เสมอ
- Risk: support ticket volume เพิ่มจน channel noisy
  - Countermeasure: แยก embed title/type ระหว่าง manual billing ticket กับ automated payment alert และส่งเฉพาะ fields ที่จำเป็น

## Implementation Update
- Timestamp: 2026-03-19 23:44 +0700
- Completed by `ggg` run:
  - Phase 3: threaded `returnTo` from package entry into receipt CTA with allowlisted route guard
  - Phase 3.5: default billing visibility now hides noise orders unless user explicitly opts into full list
  - Phase 4: preserved credited success flow compatibility while adding regression coverage for notification-failure tolerance
  - Phase 4.5: billing support CTA now submits Discord-backed tickets with order diagnostics instead of `mailto:` handoff
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅ (`49` files, `258` tests)
- Commit:
  - `4827035` `#mmv-payment-success-ux-ppp-2026-03 complete phases 3-4.5`
- Risk: mailto removal ทำให้ fallback หายเมื่อ webhook ล่ม
  - Countermeasure: เก็บ graceful fallback ไว้ เช่นแจ้ง error พร้อมทางติดต่อสำรองใน UI แทนการ hard-fail

## Verification Strategy Addendum
- Add focused suites:
  - order create reuse/idempotency route tests
  - billing history default visibility tests
  - billing support submission tests with Discord webhook mocked
- Manual smoke additions:
  - เปิด payment modal ซ้ำหลายครั้งใน package เดิม -> ได้ active order เดิมใบเดียว
  - billing default page ไม่โชว์ QR draft/no-payment-attempt noise
  - กด support จาก billing item ที่ rejected -> Discord ticket ได้ context ครบ

## Execution Recommendation
- Recommended implementation order:
  1. Phase 0
  2. Phase 1 + Phase 2
  3. Phase 3
  4. Phase 3.5
  5. Phase 4 + Phase 4.5
  6. Phase 5
- Rationale:
  - เรียงจาก root-cause order lifecycle -> success surfaces -> context-aware continuation -> billing cleanup -> support ops -> final hard gate

## Updated Handoff Notes for ggg
- Start with Phase 0 before any success-copy/UI polish work
- Treat billing visibility policy as product semantics, not just UI filtering
- Reuse existing `/api/support` infrastructure where possible; do not fork a second billing-only support backend unless payload complexity forces it
- Keep phase-scoped commits and avoid mixing payment duplication fixes with support-ticket refactor in the same commit

