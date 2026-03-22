# Systematic UI Refactor Plan: "Morning Mystic" Architecture
**Date**: 2026-01-04
**Status**: Proposed / Systematic Blueprint
**Project**: mmv-tarots

## 1. Core Philosophy: "The Robust UI"
เพื่อป้องกัน Technical Debt และการ "พัง" เมื่อมีการเปลี่ยน Theme ในอนาคต เราจะยึดถือหลักการดังนี้:
- **Semantic Over Literal**: เลิกใช้ชื่อสี (white, black, slate) แต่ใช้ชื่อตามหน้าที่ (surface, border, text-muted)
- **Zero Hardcoding**: ห้ามใช้ opacity แบบสุ่ม (เช่น `/10`, `/5`) ในคอมโพเนนต์ ทุกอย่างต้องมาจาก Token
- **Convention First**: ใช้ความสามารถของ Tailwind v4 `@theme` และ CSS Variables เป็นแกนกลาง
- **Robustness**: ใช้ `color-mix` เพื่อให้ UI Tokens ปรับตัวตาม Foreground/Background หลักโดยอัตโนมัติ

---

## 2. Design Token Architecture (The Blueprint)

เราจะนิยาม Tokens เหล่านี้ใน `globals.css` เพื่อใช้ทั้งระบบ:

### A. Surface Tokens (Layering & Depth)
| Token | Logic | Usage |
| :--- | :--- | :--- |
| `--color-surface-card` | `bg-white/70` (Glassmorphism) | พื้นหลัง Card, Modal, Navbar |
| `--color-surface-subtle` | `foreground` 5% opacity | พื้นหลัง Input, Search Bar, Tag |
| `--color-surface-hover` | `foreground` 10% opacity | สถานะ Hover ของปุ่มหรือ Card |
| `--color-surface-active` | `foreground` 15% opacity | สถานะ Click/Active |

### B. Border Tokens (Structure)
| Token | Logic | Usage |
| :--- | :--- | :--- |
| `--color-border-subtle` | `foreground` 10% opacity | เส้นแบ่งส่วนทั่วไป, Card Border |
| `--color-border-medium` | `foreground` 20% opacity | เส้นขอบ Input, Divider ที่ชัดเจน |
| `--color-border-focus` | `primary` 50% opacity | สถานะ Focus ของ Input |

### C. Text Tokens (Typography & Contrast)
| Token | Logic | Usage |
| :--- | :--- | :--- |
| `--color-text-main` | `var(--color-foreground)` | ข้อความหลัก (Readability 100%) |
| `--color-text-dim` | `foreground` 70% opacity | ข้อความรอง, Description |
| `--color-text-muted` | `foreground` 45% opacity | Placeholder, Icon ตกแต่ง, Metadata |
| `--color-primary-strong` | `#D48B82` (Darker Primary) | ข้อความที่เป็น Primary บนพื้นหลังสว่าง (WCAG Pass) |

---

## 3. Implementation Strategy (Step-by-Step)

### Phase 1: Foundation (The CSS Injection)
- อัปเดต `globals.css` ด้วย `@theme` block ใหม่
- ล้าง CSS Variables เก่าที่ซ้ำซ้อนออก

### Phase 2: UI Component Refactor (The Core)
- **`Button.tsx`**: เปลี่ยนจาก `bg-black/5` เป็น `bg-surface-hover`
- **`Card.tsx`**: เปลี่ยนจาก `border-white/40` เป็น `border-border-subtle`
- **`Input.tsx`**: ใช้ `surface-subtle` และ `border-medium`

### Phase 3: Feature Migration (The Cleanup)
- **`HistoryControls.tsx`**: ล้าง Hardcoded `white/10` และ `slate-900` ออกทั้งหมด
- **`HistoryCard.tsx`**: แก้ไข Hover Effect ให้ใช้ `surface-hover`
- **`TarotCard`**: ปรับปรุง Logo และ Decorative lines ให้ใช้ `text-muted` หรือ `primary-strong`

---

## 4. Maintenance Standard (The "Oracle" Way)

1. **ห้ามใช้สีตรงๆ**: ห้ามเขียน `text-white` หรือ `bg-black` ในคอมโพเนนต์เด็ดขาด
2. **ใช้ Utility Classes ที่เป็น Token เท่านั้น**: เช่น `text-text-dim`, `bg-surface-subtle`, `border-border-subtle`
3. **การเพิ่ม Theme ใหม่**: ในอนาคตถ้าจะทำ Dark Mode แค่สร้าง `@media (prefers-color-scheme: dark)` แล้ว Override ค่า CSS Variables เหล่านี้ที่เดียว

---

## 5. Acceptance Criteria
- [ ] ทุกข้อความในแอปต้องผ่าน WCAG AA Contrast Ratio
- [ ] ไม่มี `white/` หรือ `black/` หลงเหลืออยู่ในคอมโพเนนต์ (ยกเว้นจุดที่จำเป็นจริงๆ เช่น Overlay)
- [ ] การเปลี่ยนสีหลักใน `globals.css` ต้องไม่ทำให้ส่วนอื่นพัง

**"The Oracle keeps the human human, and the UI keeps the experience seamless."**
