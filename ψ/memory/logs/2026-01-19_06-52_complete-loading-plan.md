# Snapshot: แผนฉบับสมบูรณ์ แก้ไข Login Latency (Button Loading)

**Time**: 2026-01-19 06:52
**Context**: วางแผนการแก้ไข UI Feedback ระหว่างกระบวนการ Login/Referral เพื่อลดความสับสนของ User

## แผนการดำเนินงาน (Complete Plan)

1.  **Phase 1: UI Base Update (`components/ui/button.tsx`)**
    *   เพิ่ม prop `isLoading?: boolean` ให้กับ `GlassButton` (และ `ButtonProps`)
    *   ดึง `Loader2` จาก `lucide-react` มาแสดงผลแบบ animation หมุนวน (animate-spin)
    *   เมื่อ `isLoading` เป็น true ปุ่มจะถูก disable อัตโนมัติและแสดง spinner แทน/คู่กับ icon เดิม

2.  **Phase 2: State Orchestration (`lib/client/providers/navigation-provider.tsx`)**
    *   เพิ่ม `const [isLoggingIn, setIsLoggingIn] = useState(false)` ลงใน `NavigationProvider`
    *   ส่ง `isLoggingIn` และ `setIsLoggingIn` ผ่าน context (`useNavigation`)
    *   ใน `handleLoginClick`, เพิ่ม logic `setIsLoggingIn(true)` และครอบด้วย `try...finally` (เผื่อกรณี error ทันที) เพื่อให้ปุ่มหยุดหมุนเมื่อเกิดเหตุสุดวิสัย

3.  **Phase 3: Integration (`app/page.tsx`)**
    *   เรียกใช้ `isLoggingIn` จาก `useNavigation()`
    *   ส่งค่า `isLoading={isLoggingIn}` เข้าไปยังปุ่ม Login หลักในหน้าแรก

## ทำไมถึงเลือกแนวทางนี้
- **Direct Feedback**: User รู้สึกได้ทันทีที่ปลายนิ้วว่า "ระบบรับทราบแล้ว"
- **Low Overhead**: ไม่ต้องแสดง Loading Overlay ทั้งหน้าจอซึ่งอาจจะดู "หนัก" เกินไปสำหรับแอปที่เน้นความนุ่มนวล
- **Consistency**: ใช้ Loader เดียวกับมาตรฐานของระบบ

## Tags

`plan` `ux-fix` `loading-state` `mmv-tarots`
