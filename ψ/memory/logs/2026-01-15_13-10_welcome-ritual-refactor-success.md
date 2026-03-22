# Snapshot: Welcome Ritual UI Refactor (Restored)

**Time**: 2026-01-15 13:10
**Context**: Refactoring `WelcomeModal` to align with Design Tokens and User Journey.

## The Restoration (v1.1)

สิ่งที่ได้รับการแก้ไขและกู้คืน (Restored Values):

1.  **3-Step Ritual Logic**:
    - **Step 1: Greeting**: ใช้ `MimiLoadingAvatar` (3D) สร้าง First Impression ที่มีชีวิตชีวา
    - **Step 2: Rules**: อธิบายกฎการแลกเปลี่ยน (1 Star) และการรอคอย (Cooldown) อย่างชัดเจน
    - **Step 3: Gift**: มอบ "First Star" ด้วย Animation ที่น่าประทับใจ

2.  **Visual Harmony**:
    - **Tokens**: ใช้ `GlassCard`, `GlassButton` (System Components)
    - **Colors**: ใช้ `text-foreground` (Brown) บน `bg-surface-card` (Blur) อ่านง่ายและเข้ากับ Theme

3.  **Accessibility**:
    - แก้ไข Contrast Ratio ของตัวหนังสือทั้งหมด
    - ใช้ Step Indicator ด้านล่างเพื่อบอกสถานะ (Progress)

## Code Changes
- **Refactor**: Rewrite `components/features/onboarding/WelcomeModal.tsx` ทั้งหมด โดยใช้ `framer-motion` ควบคุม State Transition

## Tags
`refactor` `ui-restoration` `mmv-tarots` `success`
