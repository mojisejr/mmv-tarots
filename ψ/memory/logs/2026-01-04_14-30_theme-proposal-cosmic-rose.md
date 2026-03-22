# Theme Proposal: Cosmic Rose (กุหลาบจักรวาล)

**Date**: 2026-01-04 14:30 GMT+7
**Project**: mmv-tarots
**Base Color**: `#FFD6D1` (Misty Rose / Light Peach)

## 1. Concept & Persona Alignment
**Persona**: "แม่หมอมีมี่" (Modern Mystic)
- **Character**: ทันสมัย, เข้าถึงง่าย, ฟันธง, มีเวทมนตร์แต่อยู่ในโลกความเป็นจริง
- **Vibe**: "Cosmic Comfort" - ความลึกลับที่ดูอบอุ่นและปลอดภัย

**Why `#FFD6D1`?**
สีชมพูพีชอ่อนนี้ให้ความรู้สึก "อ่อนโยน" และ "เปล่งประกาย" (Glowing) ท่ามกลางความมืด เหมือนแสงดาวหรือแสงจันทร์สีนวล มันลดความน่ากลัวของไพ่ยิปซีแบบดั้งเดิมลง ทำให้ผู้ใช้รู้สึกผ่อนคลาย (Relaxed) และเปิดใจรับคำทำนายได้ง่ายขึ้น

## 2. Color Palette Strategy

### Primary (The Glow)
- **Value**: `#FFD6D1`
- **Role**: Main Brand Color, Headings, Active States, Glow Effects.
- **Psychology**: Hope, Warmth, Intuition.

### Background (The Void)
- **Value**: `#1A1625` (Deep Cosmic Purple)
- **Role**: App Background.
- **Why**: แทนที่จะใช้สีดำสนิทหรือเทาเดิม (`#2a2a2e`) การใช้สีม่วงเข้มเกือบดำจะช่วยขับให้สี `#FFD6D1` ดู "แพง" และ "ขลัง" ขึ้น เป็นคู่สีที่ Complement กันอย่างลงตัว (Warm Peach vs Cool Deep Purple).

### Surface (The Card)
- **Value**: `#2D2438` (Mystic Charcoal)
- **Role**: Card Backgrounds, Modals, Inputs.
- **Why**: สว่างกว่าพื้นหลังเล็กน้อยเพื่อให้เกิด Depth แต่ยังคุมโทนลึกลับ

### Accent (The Magic)
- **Value**: `#D4AF37` (Muted Gold)
- **Role**: Stars, High-value actions (Pay), Special Cards.
- **Why**: สีทองคือสัญลักษณ์ของ Tarot และความศักดิ์สิทธิ์ ตัดกับสีพีชและม่วงได้อย่างหรูหรา

## 3. Accessibility Analysis (WCAG 2.1)

| Pair | Contrast Ratio | Rating | Usage |
|------|----------------|--------|-------|
| `#FFD6D1` on `#1A1625` | **13.6 : 1** | ✅ AAA | Headings, Icons, Buttons (Outline) |
| `#FFD6D1` on `#2D2438` | **10.8 : 1** | ✅ AAA | Card Titles, Highlights |
| `#FFFFFF` on `#1A1625` | **16.8 : 1** | ✅ AAA | Body Text |
| `#B0A8B9` on `#1A1625` | **8.6 : 1** | ✅ AAA | Secondary Text |
| `#1A1625` on `#FFD6D1` | **13.6 : 1** | ✅ AAA | Text inside Primary Button |

**Conclusion**: สีนี้ **Safe** มากๆ สำหรับ Dark Mode และผ่านเกณฑ์ Accessibility ระดับสูงสุด (AAA) เมื่อใช้คู่กับพื้นหลังโทนเข้มที่เราเลือก

## 4. Design Token Implementation Plan

เราจะไม่อิงกับชื่อสี (Red/Blue) แต่จะอิงกับ **Semantic Function** เพื่อให้เปลี่ยน Theme ได้ง่ายในอนาคต:

```typescript
// tailwind.config.ts
colors: {
  background: '#1A1625', // Deep Cosmic Purple
  surface: '#2D2438',    // Mystic Charcoal
  primary: {
    DEFAULT: '#FFD6D1',  // The Base Color
    foreground: '#1A1625', // Text on primary
    glow: 'rgba(255, 214, 209, 0.5)' // For liquid effects
  },
  secondary: {
    DEFAULT: '#D4AF37',  // Gold
    foreground: '#1A1625'
  },
  text: {
    main: '#FFFFFF',
    muted: '#B0A8B9'
  }
}
```

## 5. Why this is the "Right" Choice?
1.  **Modern Spiritualism**: เทรนด์แอปดูดวงยุคใหม่ (เช่น Co-Star, Sanctuary) จะไม่ใช้สีแดง/ดำแบบเก่า แต่จะใช้สีพาสเทลตัดกับพื้นเข้ม เพื่อให้ดู "Science-based" และ "Psychological" มากกว่า "Supernatural"
2.  **Eye Comfort**: การอ่านคำทำนายยาวๆ บนพื้นหลังสีเข้มด้วยตัวหนังสือสีนวล (Off-white/Peach) จะสบายตากว่าสีขาวล้วน
3.  **Brand Differentiation**: สี `#FFD6D1` จะทำให้ MimiVibe โดดเด่นออกมาจากแอปดูดวงทั่วไปที่มักใช้สีม่วงสดหรือทองเป็นหลัก

พร้อมสำหรับการเริ่ม Refactor ตามแนวทางนี้ครับ!
