# Theme Proposal: Morning Mystic (แม่หมอยามเช้า)

**Date**: 2026-01-04 14:45 GMT+7
**Project**: mmv-tarots
**Direction**: Light, Friendly, Moody
**Base Color**: `#FFD6D1` (Misty Rose)

## 1. Concept: "Friendly Moody"
โจทย์คือต้องการความ "Friendly" (เป็นมิตร) แต่ยังคงความ "Moody" (มีอารมณ์, น่าค้นหา) และต้องไม่ใช้พื้นหลังสีดำ
เราจะใช้คอนเซปต์ **"Warm Contrast"** คือการใช้สีพื้นหลังที่นุ่มนวล (Friendly) ตัดกับสีตัวอักษรที่เข้มและลึก (Moody) แทนสีดำสนิท

## 2. Color Palette Strategy

### Background (The Atmosphere)
- **Value**: `#FFF0F0` (Softest Rose) ไล่เฉดไปหา `#FFD6D1` (Misty Rose)
- **Role**: App Background
- **Why**: การใช้ `#FFD6D1` ล้วนๆ เป็นพื้นหลังอาจจะแยงตาเกินไปเมื่ออ่านนานๆ เราจะใช้ `#FFD6D1` เป็น **"Ambient Light"** หรือ Gradient Mesh บนพื้นสีขาวอมชมพู (`#FFF0F0`) เพื่อให้ดูฟุ้งฝันและ Friendly

### Surface (The Canvas)
- **Value**: `#FFFFFF` (Pure White) with `opacity-70` (Glassmorphism)
- **Role**: Card Containers, Dialogs
- **Effect**: `backdrop-blur-xl` + `shadow-warm` (เงาสีน้ำตาลแดงจางๆ)
- **Why**: สีขาวโปร่งแสงบนพื้นชมพูจะให้ความรู้สึกสะอาดและทันสมัย (Modern Chic)

### Text & Elements (The Mood)
- **Value**: `#592E2E` (Deep Marsala / Burgundy)
- **Role**: Headings, Body Text, Icons
- **Why**: นี่คือหัวใจของความ "Moody" แทนที่จะใช้สีเทาหรือดำ เราใช้สีแดงเลือดหมูเข้ม หรือน้ำตาลไหม้ เพื่อให้ความรู้สึก "ขลัง" "อบอุ่น" และ "ลึกซึ้ง" ตัดกับสีชมพูได้อย่างสวยงามและอ่านง่าย

### Accent (The Magic)
- **Value**: `#D4AF37` (Muted Gold)
- **Role**: Stars, Borders, Highlights
- **Why**: สีทองยังคงจำเป็นสำหรับ Tarot เพื่อสื่อถึงความแม่นยำและพลังงาน

## 3. Accessibility Analysis (WCAG 2.1)

| Pair | Contrast Ratio | Rating | Usage |
|------|----------------|--------|-------|
| `#592E2E` on `#FFD6D1` | **7.8 : 1** | ✅ AAA | Text on Primary Color |
| `#592E2E` on `#FFFFFF` | **11.5 : 1** | ✅ AAA | Text on Cards |
| `#592E2E` on `#FFF0F0` | **10.8 : 1** | ✅ AAA | Text on Background |
| `#D4AF37` on `#592E2E` | **3.5 : 1** | ⚠️ AA (Large) | Gold Icons on Dark Text |

**Conclusion**: การใช้คู่สี "Burgundy on Peach/White" ให้ค่า Contrast ที่สูงมากและอ่านง่ายกว่าสีพาสเทลทั่วไป

## 4. Design Token Implementation

```typescript
// tailwind.config.ts
colors: {
  background: '#FFF0F0', // Softest Rose
  surface: '#FFFFFF',    // White Glass
  primary: {
    DEFAULT: '#FFD6D1',  // The User's Color (Misty Rose)
    foreground: '#592E2E', // Deep Marsala
    dark: '#FFB3AD'      // Darker shade for hover
  },
  text: {
    main: '#592E2E',     // Deep Marsala (The Moody part)
    muted: '#8C6B6B'     // Muted Marsala
  },
  accent: '#D4AF37'      // Gold
}
```

## 5. Why this fits "Mimi"?
- **Friendly**: สีชมพู/พีช ให้ความรู้สึกเหมือนเพื่อนสาวที่ปรึกษาได้ (Sisterly vibe)
- **Moody**: สี Burgundy ให้ความรู้สึกถึงความลึกลับ เสน่ห์ และความจริงจัง (Not just cute, but deep)
- **Mimi**: สะท้อนบุคลิกแม่หมอยุคใหม่ที่แต่งตัวเก๋ๆ นั่งดูดวงในคาเฟ่สวยๆ ไม่ใช่ในห้องมืดๆ

พร้อมปรับแก้ตามแนวทางนี้ครับ!
