# Snapshot: Final Implementation Blueprint - Welcome Ritual Modal (v1.1 Phase 5)

**Time**: 2026-01-15 12:43
**Context**: แผนการพัฒนาจุดสุดท้ายของ v1.1 เพื่อสร้างระบบ Onboarding ที่นุ่มนวลและเป็นมืออาชีพสำหรับ mmv-tarots

## 🛡️ Mission Blueprint: The Welcome Ritual

**Objective**: สร้างความประทับใจแรกพบ (First Impression) พร้อมให้ความรู้ผู้ใช้เรื่องระบบ Star และพิธีกรรมการทำนาย โดยใช้ Mimi Avatar ที่มีชีวิตชีวา (Animate)

### Phase 1: Sacred Memory (Schema & Backend)
- **Database**: เพิ่ม `onboardingCompleted` (Boolean, default: false) ในรุ่น `User`
- **API**: สร้าง `PATCH /api/user/profile` หรือ endpoint เฉพาะเพื่อบันทึกสถานะเมื่อดูจบ
- **Service**: อัปเดต `lib/server/services/user-service.ts` ให้รองรับการตรวจสอบสถานะ

### Phase 2: The Presence (Mimi Animate Component)
- **UI**: ออกแบบ `WelcomeModal` โดยมี `MimiLoadingAvatar` (ตัวขยับได้) เป็นจุดศูนย์กลาง
- **Visual**: ใช้ Glassmorphism + Framer Motion สำหรับการเปิดตัวที่นุ่มนวล
- **Content**: 
    - Screen 1: "Greeting & 3 Steps Guide" (ตั้งจิต -> พัก -> รับ)
    - Screen 2: "Energy Exchange" (1 Prediction = 1 🌟) พร้อม Interactive Badges (Star, Cooldown, Privacy)

### Phase 3: Wisdom Bridge (Client Context)
- **State**: อัปเดต `NavigationProvider` ให้ดึงสถานะ `onboardingCompleted` มาจาก Session/DB
- **Trigger Logic**: ตรวจสอบ `isLoggedIn && !onboardingCompleted` และแสดง Modal เมื่อพร้อม
- **Persistence**: บันทึกสถานะลง DB ทันทีเมื่อผู้ใช้กด "开始 (Start)" หรือ "รับทราบ"

### Phase 4: Final Harmony (Integration & Cleanup)
- **Integration**: วาง `WelcomeModal` ใน `app/page.tsx` หรือระดับ `layout.tsx`
- **Polish**: ปรับแต่ง Animation ให้สอดคล้องกับ `SuggestedQuestions` ที่ทำเสร็จไปก่อนหน้า
- **Verification**: 100% Build Pass && Manual Test บน Mobile และ Desktop

## ⚡ CONSENSUS_SCHEMA
- **Avatar State**: Always use `MimiLoadingAvatar` (Animated) for welcoming.
- **Badge Strategy**: Use existing `FloatingBadge` pattern for secondary info.
- **Completion Key**: `onboarding_completed` in Database.

## Apply When
- เมื่อเริ่มขั้นตอนการโค้ด Phase 5 ของ v1.1
- ใช้เป็น Checklist ในการรันคำสั่ง Migration และการเขียน API

## Tags
`onboarding-ritual` `mimi-avatar` `db-migration` `ux-design` `mmv-tarots` `blueprint`
