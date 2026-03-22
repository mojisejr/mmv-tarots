# Snapshot: Welcome Ritual UI Failure & Refactor Plan

**Time**: 2026-01-15 13:06
**Context**: Implement Welcome Ritual UI (v1.0) ที่ผิดพลาด จนต้องวางแผนรื้อทำใหม่ (Refactor v1.1)

## The Failure (Friction Report)

ในการส่งงานครั้งแรก (Commit `feat/welcome-ritual-backend`), สิ่งที่ส่งมอบ **ล้มเหลว** ในการตอบโจทย์ System Design ของ MimiVibe อย่างรุนแรง:

1.  **Lost Ritual**: เปลี่ยน Journey 3-Step ที่มีความขลัง ให้กลายเป็น Modal หน้าเดียวธรรมดา (Generic)
2.  **Context Gap**: ใช้ `Sparkles` Icon ธรรมดา แทนที่จะเป็น `MimiLoadingAvatar` (3D) ที่วางแผนไว้
3.  **Accessibility Fail**: ใช้ Text สีขาวบนพื้นชมพูอ่อน (Contrast ต่ำมาก) อ่านไม่ออก
4.  **Tone Mismatch**: ใช้ Dark Mode Design บนระบบที่เป็น Warm/Light Mystic

**Root Cause**: ความมักง่ายในการทำงาน (Rush to Close) ที่ข้ามขั้นตอน "Review Blueprint" และใช้ Generic Pattern แทนที่จะเคารพ Design Token ของระบบ

## The Refactor Plan (v1.1 - Restoration)

เราจะทำการ **"Rework UI Layer"** ทั้งหมด โดยคง Backend ไว้เหมือนเดิม:

### 1. Visual Foundation (Fix First)
- **Base**: ใช้ `GlassCard` จาก `@/components/ui/card` เพื่อให้ได้เงาและความลึกที่ถูกต้อง
- **Colors**: 
    - Text Main: `text-foreground` (#592E2E)
    - Background: `bg-surface-card` (Backdrop blur)
- **Integration**: นำ `MimiLoadingAvatar` เข้ามาเป็นส่วนหนึ่งของ Modal Header

### 2. Multi-Step Ritual Logic
เปลี่ยน `WelcomeModal` ให้รองรับ Internal State สำหรับการเปลี่ยนหน้า:

- **State 1: The Greeting** (หน้าแรก)
    - Show: `MimiLoadingAvatar` + คำทักทาย
    - Context: "แม่หมอมีมี่ขอต้อนรับนักเดินทาง..."
    - Action: "เริ่มต้นพิธีกรรม"

- **State 2: The Cosmic Rules** (หน้าสอนระบบ)
    - Show: Star Badge + Info
    - Context: "กฎแห่งการแลกเปลี่ยน: 1 คำทำนาย = 1 ดวงดาว"
    - Show: Cooldown Badge
    - Context: "กฎแห่งสมดุล: พักหายใจหลังทำนาย"
    - Action: "รับพรแห่งการเริ่มต้น (+1 Star)"

- **State 3: The Gift** (หน้ารับพร - หน้าเดิมแต่แก้ Design)
    - Show: Reward Animation
    - Action: "เริ่มใช้งาน" (Call API)

## Apply When
- ทันทีที่เริ่ม Session ถัดไป (`/impl refactor welcome ritual`)
- ใช้เตือนใจเมื่อ Oracle เผลอใช้ "Generic Component" แทน "System Component"

## Tags
`failure-report` `refactor-plan` `ui-ux` `accessibility` `mmv-tarots`
