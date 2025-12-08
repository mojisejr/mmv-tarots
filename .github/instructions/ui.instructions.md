---
applyTo: '**'
---

# UI/UX Documentation
## Jaothui ID-Trace System

### Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Color Theme](#color-theme)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Layout & Navigation](#layout--navigation)
7. [Page Designs](#page-designs)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Mobile Optimization](#mobile-optimization)
11. [User Journey Flows](#user-journey-flows)
12. [Interaction Patterns](#interaction-patterns)

### Design Philosophy

#### Core Principles
1. **Mobile-First Design**: Optimized for mobile devices with progressive enhancement for desktop
2. **Elderly-Friendly**: Large touch targets, clear typography, and simple navigation
3. **Thai Language Native**: Full Thai localization with culturally appropriate design
4. **Accessibility First**: WCAG 2.1 AA compliance with focus on screen reader support
5. **Glassmorphic Modern**: Modern card-based UI with depth and visual hierarchy

#### Design Goals
- Reduce cognitive load for elderly farmers
- Ensure successful task completion on mobile devices
- Provide clear visual feedback for all interactions
- Maintain consistent patterns across all screens
- Support both LINE OAuth and traditional login flows

### Design System

#### Technology Stack
- **Framework**: Next.js 14.x with App Router
- **UI Library**: shadcn-ui components
- **Styling**: Tailwind CSS v4 with oklch color system
- **Icons**: Lucide React icons
- **Forms**: react-hook-form with zod validation
- **Animations**: Framer Motion for subtle micro-interactions

#### Design Tokens

```css
:root {
  /* Spacing System */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */

  /* Border Radius */
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */

  /* Minimum Touch Target */
  --touch-target: 2.75rem; /* 44px */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### Color Theme

#### Light Theme (Primary)
```css
:root {
  /* Background Colors */
  --background: oklch(0 0 0);
  --surface: oklch(0.98 0.005 240);
  --card: oklch(1 0.008 240 / 0.8);
  --border: oklch(0.85 0.005 240);

  /* Text Colors */
  --foreground: oklch(0.12 0.015 240);
  --muted: oklch(0.45 0.02 240);
  --muted-foreground: oklch(0.55 0.015 240);

  /* Primary Colors */
  --primary: oklch(0.7198 0.1329 81.7135);
  --primary-foreground: oklch(0.98 0.01 81.7135);

  /* Secondary Colors */
  --secondary: oklch(0.95 0.01 240);
  --secondary-foreground: oklch(0.15 0.015 240);

  /* Accent Colors */
  --accent: oklch(0.85 0.02 240);
  --accent-foreground: oklch(0.2 0.015 240);

  /* Status Colors */
  --success: oklch(0.68 0.15 142);
  --warning: oklch(0.75 0.15 65);
  --destructive: oklch(0.65 0.15 15);
  --info: oklch(0.65 0.15 220);

  /* LINE Green */
  --line-green: #00C300;
  --line-green-foreground: oklch(1 0 0);
}
```

#### Dark Theme
```css
.dark {
  /* Background Colors */
  --background: oklch(0.12 0.015 240);
  --surface: oklch(0.15 0.02 240);
  --card: oklch(0.18 0.025 240 / 0.8);
  --border: oklch(0.25 0.02 240);

  /* Text Colors */
  --foreground: oklch(0.98 0.01 240);
  --muted: oklch(0.65 0.02 240);
  --muted-foreground: oklch(0.55 0.015 240);

  /* Component Colors */
  --primary: oklch(0.72 0.15 81.7135);
  --primary-foreground: oklch(0.08 0.02 81.7135);
  --secondary: oklch(0.22 0.02 240);
  --secondary-foreground: oklch(0.9 0.01 240);
}
```

### Typography

#### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
             'Helvetica Neue', sans-serif;
```

#### Type Scale
```css
/* Text Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Typography Guidelines
- **Headings**: Use Inter font weights 600-700 for clear hierarchy
- **Body Text**: Regular weight (400) with adequate line height (1.5-1.75)
- **Touch Elements**: Minimum 16px font size for buttons and links
- **Thai Characters**: Ensure proper rendering with Inter's Thai support

### Component Library

#### Button Variants

##### Primary Button
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90
                   px-6 py-3 rounded-lg font-medium min-h-[44px]
                   transition-colors duration-200
                   focus:outline-hidden focus:ring-2 focus:ring-primary/50">
  ยืนยัน
</button>
```

##### Secondary Button
```tsx
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80
                   px-6 py-3 rounded-lg font-medium min-h-[44px]
                   border border-border">
  ยกเลิก
</button>
```

##### Ghost Button
```tsx
<button className="text-muted-foreground hover:text-foreground
                   px-6 py-3 rounded-lg font-medium min-h-[44px]
                   transition-colors duration-200">
  หน้าหลัก
</button>
```

##### LINE Login Button
```tsx
<button className="bg-[#00C300] text-white hover:bg-[#00A000]
                   px-6 py-3 rounded-lg font-medium min-h-[44px]
                   flex items-center gap-2 transition-colors duration-200">
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    {/* LINE Logo SVG */}
  </svg>
  เข้าสู่ระบบด้วย LINE
</button>
```

#### Form Components

##### Input Field
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    หมายเลขแท็ก
  </label>
  <input
    type="text"
    className="flex h-11 w-full rounded-md border border-input bg-background
             px-3 py-2 text-sm ring-offset-background file:border-0
             file:bg-transparent file:text-sm file:font-medium
             placeholder:text-muted-foreground focus-visible:outline-hidden
             focus-visible:ring-2 focus-visible:ring-ring
             focus-visible:ring-offset-2 disabled:cursor-not-allowed
             disabled:opacity-50"
    placeholder="กรอกหมายเลขแท็ก"
    aria-label="หมายเลขแท็ก"
  />
</div>
```

##### Form with Validation
```tsx
<form className="space-y-4">
  <FormField
    name="name"
    render={({ field, fieldState }) => (
      <FormItem>
        <FormLabel>ชื่อกระบือ</FormLabel>
        <FormControl>
          <Input
            {...field}
            placeholder="กรอกชื่อกระบือ"
            aria-invalid={fieldState.invalid}
            className="min-h-[44px]"
          />
        </FormControl>
        <FormDescription>
          กรุณากรอกชื่อที่ใช้เรียกกระบือ
        </FormDescription>
        {fieldState.error && (
          <FormMessage>{fieldState.error.message}</FormMessage>
        )}
      </FormItem>
    )}
  />
</form>
```

#### Card Components

##### Floating Glass Card
```tsx
<div className="bg-card/80 backdrop-blur-xs border border-border
                   rounded-2xl shadow-lg p-6 max-w-lg mx-auto">
  <div className="space-y-4">
    {/* Card content */}
  </div>
</div>
```

##### Animal List Card
```tsx
<div className="bg-card/80 backdrop-blur-xs border border-border
                   rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
  <div className="flex items-start gap-4">
    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
      <span className="text-xl font-bold text-muted-foreground">001</span>
    </div>
    <div className="flex-1 space-y-1">
      <h3 className="font-semibold text-foreground">นาเดีย</h3>
      <p className="text-sm text-muted-foreground">วันเกิด: 12 มีนาคม 2562</p>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs
                       bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ใช้งาน
        </span>
        {hasDueActivities && (
          <div className="w-2 h-2 bg-red-500 rounded-full" aria-label="กิจกรรมค้างอยู่" />
        )}
      </div>
    </div>
    <Button variant="ghost" size="sm" aria-label="ดูรายละเอียด">
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
</div>
```

### Layout & Navigation

#### Transparent Navbar
```tsx
<nav className="fixed top-0 left-0 right-0 z-50
                bg-background/80 backdrop-blur-xs border-b border-border">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center">
        <span className="text-lg font-semibold text-foreground">
          ระบบ ID-Trace
        </span>
      </div>
      <div className="flex items-center">
        <img src="/logo.png" alt="Jaothui" className="w-8 h-8" />
      </div>
    </div>
  </div>
</nav>
```

#### Main Container Layout
```tsx
<div className="min-h-screen bg-linear-to-br from-background to-surface">
  <main className="pt-16 pb-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-2xl mx-auto">
      {/* Page content */}
    </div>
  </main>
</div>
```

#### Bottom Navigation (Mobile)
```tsx
<div className="fixed bottom-0 left-0 right-0 z-40
                bg-background/90 backdrop-blur-xs border-t border-border
                safe-area-inset-bottom">
  <div className="grid grid-cols-3 h-16">
    <button className="flex flex-col items-center justify-center gap-1
                   text-muted-foreground hover:text-foreground transition-colors">
      <Home className="w-5 h-5" />
      <span className="text-xs">หน้าหลัก</span>
    </button>
    <button className="flex flex-col items-center justify-center gap-1
                   text-muted-foreground hover:text-foreground transition-colors">
      <Users className="w-5 h-5" />
      <span className="text-xs">กระบือ</span>
    </button>
    <button className="flex flex-col items-center justify-center gap-1
                   text-muted-foreground hover:text-foreground transition-colors relative">
      <Bell className="w-5 h-5" />
      <span className="text-xs">แจ้งเตือน</span>
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive
                       text-destructive-foreground rounded-full text-xs
                       flex items-center justify-center">
          {badgeCount}
        </span>
      )}
    </button>
  </div>
</div>
```

### Page Designs

#### 1. Home Page (Hero)
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [JAOTHUI Logo]                           │
│                                                             │
│                 ยินดีต้อนรับเข้าสู่ระบบ                  │
│                     ข้อมูลควาย                           │
│                 (Inter 28px, center)                       │
│                                                             │
│               powered by JAOTHUI (small, muted)            │
│                                                             │
│                                                             │
│                                                             │
│         [เข้าสู่ระบบ] (Primary Button, full width)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Login Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    เข้าสู่ระบบ                           │
│               (Inter 24px, bold, center)                   │
│                                                             │
│         [Login with LINE] (Green, full width, LINE logo)    │
│                                                             │
│             ──── หรือเข้าสู่ระบบสำหรับพนักงาน ─────           │
│                                                             │
│  Username: [_______________]                                 │
│  Password: [_______________]                                 │
│                                                             │
│        [Staff Login] (Primary button, full width)          │
│                                                             │
│                     ลืมรหัสผ่าน?                         │
│               (small, right-aligned, muted)                │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Profile Page (Owner View)
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ สวัสดี! ชื่อผู้ใช้               [🔔 3]                │ │
│ │ ────────────────────────────────────────────────       │ │
│ │ [Profile Image] ฟาร์มของฉัน ▼ นนทบุรี              │ │
│ │                                                         │ │
│ │ [+เพิ่มพนักงาน]  [ข้อมูลกระบือ]  [+เพิ่มกระบือ]    │ │
│ │ [ข้อมูลพนักงาน]    [ค้นหา tag-id ▸]                │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│                [ออกจากระบบ] (Ghost button)                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Animal List Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [ข้อมูลกระบือในฟาร์ม <badge>]                        │ │
│ │ ────────────────┬───────────────────────────────        │ │
│ │ กระบือปัจจุบัน | รายการแจ้งเตือน (Tabs)          │ │
│ │ ────────────────┴───────────────────────────────        │ │
│ │ [Status ▼] [Search: tag-id ▸]                        │ │
│ │ ────────────────────────────────────────────────        │ │
│ │                                                         │ │
│ │ ▸ 001 [นาเดีย] status-badge [🔔]                     │ │
│ │ ▸ 002 [ทองดี] status-badge                            │ │
│ │ ▸ 003 [สมศรี] status-badge [🔔 RED]                   │ │
│ │ ...                                                    │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│                [หน้าหลัก] (Ghost button, centered)         │
└─────────────────────────────────────────────────────────────┘
```

#### 5. Animal Detail Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  [Animal Image (160x160)]                   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ชื่อกระบือ: นาเดีย                                   │ │
│ │ หมายเลขแท็ก: 001                                     │ │
│ │ วันเดือนปีเกิด: 12 มีนาคม 2562                       │ │
│ │ เพศ: เมีย                                           │ │
│ │ แม่: M001, พ่อ: F001                                 │ │
│ │ จีโนม: -                                             │ │
│ │                                                         │ │
│ │ [อัพเดทข้อมูลกระบือ] (Ghost button)                   │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [กลับสู่หน้าหลัก] [ข้อมูลกระบือ] (Ghost buttons)       │
└─────────────────────────────────────────────────────────────┘
```

#### 6. Create Animal Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Transparent Navbar: ระบบ ID-Trace | Logo]                │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐ │
│ │ เพิ่มข้อมูลกระบือในระบบ                              │ │
│ │ โปรดกรอกข้อมูลให้ครบถ้วน                             │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ 1. หมายเลขแท็ก [_______________] (required)             │
│ 2. ประเภทสัตว์ [● กระบือ ○ โค ○ หมู ○ ไก่]           │
│ 3. ชื่อกระบือ [_______________]                        │
│ 4. เพศ [● ผู้ ○ เมีย]                                   │
│ 5. วันเดือนปีเกิด [__/__/____]                           │
│ 6. สี [_______________]                                  │
│ 7. น้ำหนัก (กก.) [_______________]                       │
│ 8. แม่ (หมายเลขแท็ก) [_______________]                    │
│ 9. พ่อ (หมายเลขแท็ก) [_______________]                    │
│ 10. รูปกระบือ [ เลือกไฟล์/อัพโหลด ]                   │
│                                                             │
│ [ยืนยันเพิ่มกระบือ] (Primary button, full width)          │
│                                                             │
│                [กลับสู่หน้าหลัก] (Ghost button)             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design

#### Breakpoints
```css
/* Mobile First Approach */
/* Small phones */
@media (max-width: 640px) {
  .container { padding-left: 1rem; padding-right: 1rem; }
}

/* Tablets and large phones */
@media (min-width: 641px) {
  .container { max-width: 640px; margin-left: auto; margin-right: auto; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

/* Large desktop */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

#### Responsive Patterns

##### Navigation
- **Mobile**: Bottom navigation with icons and labels
- **Desktop**: Top navigation with full text labels

##### Forms
- **Mobile**: Full-width inputs, stacked layout
- **Desktop**: Two-column layout where appropriate

##### Cards
- **Mobile**: Single column, full-width cards
- **Desktop**: Two or three column grid layout

##### Tables
- **Mobile**: Card-based layout for data tables
- **Desktop**: Traditional table layout

### Accessibility

#### WCAG 2.1 AA Compliance

##### Color Contrast
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast ratio

##### Keyboard Navigation
```tsx
// Focus visible states
button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

// Skip links
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}
```

##### Screen Reader Support
```tsx
// ARIA labels
<button aria-label="เข้าสู่ระบบด้วย LINE">
  <LineIcon /> Login with LINE
</button>

// Descriptive headings
<h1>
  <span className="sr-only">ระบบ </span>
  ID-Trace
</h1>

// Live regions for notifications
<div aria-live="polite" aria-atomic="true">
  {notification && <p>{notification}</p>}
</div>
```

#### Touch Target Sizes
- **Minimum**: 44px × 44px (11mm × 11mm)
- **Recommended**: 48px × 48px (12mm × 12mm)
- **Spacing**: Minimum 8px between touch targets

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Mobile Optimization

#### Touch-Friendly Design
- Large tap targets (minimum 44px)
- Adequate spacing between interactive elements
- No hover-only interactions
- Touch feedback (visual and haptic when available)

#### Performance Optimization
- Optimized images with WebP format
- Lazy loading for below-the-fold content
- Minimal JavaScript bundle size
- Efficient CSS with critical CSS inlined

#### Platform-Specific Features

##### iOS Safari
```css
/* Safe area support */
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Prevent zoom on input focus */
input[type="text"],
input[type="password"],
textarea {
  font-size: 16px !important;
}
```

##### Android Chrome
```css
/* Theme color for address bar */
<meta name="theme-color" content="#oklch(0.7198 0.1329 81.7135)" />

/* Prevent text selection on long press */
.user-select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

### User Journey Flows

#### Owner Login Flow
1. **Home Page** → "เข้าสู่ระบบ" button
2. **Login Page** → LINE OAuth button
3. **LINE Redirect** → Back to app with token
4. **Profile Page** → Access to all farm management features

#### Staff Login Flow
1. **Home Page** → "เข้าสู่ระบบ" button
2. **Login Page** → Username/password form
3. **Profile Page** → Limited access based on permissions

#### Animal Registration Flow
1. **Profile Page** → "+เพิ่มข้อมูลกระบือ" button
2. **Create Animal Page** → Fill required fields
3. **Image Upload** → Optional photo capture/upload
4. **Confirmation** → Animal added to system
5. **Animal List** → New animal appears in list

#### Activity Logging Flow
1. **Animal List** → Select animal
2. **Animal Detail** → "อัพเดทข้อมูลกระบือ" button
3. **Management Panel** → Activity form
4. **Activity Creation** → Fill activity details
5. **Confirmation** → Activity logged successfully

### Interaction Patterns

#### Form Validation
- **Real-time validation**: Immediate feedback on input
- **Error states**: Clear error messages with inline display
- **Success states**: Confirmation messages and navigation
- **Disabled states**: Prevent duplicate submissions

#### Loading States
```tsx
// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Button loading
<Button disabled={loading}>
  {loading ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
  {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
</Button>
```

#### Error Handling
```tsx
// Error boundary
<ErrorBoundary
  fallback={
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold text-destructive mb-2">
        เกิดข้อผิดพลาด
      </h2>
      <p className="text-muted-foreground mb-4">
        กรุณาลองใหม่ภายหลัง
      </p>
      <Button onClick={() => window.location.reload()}>
        ลองใหม่
      </Button>
    </div>
  }
>
  <App />
</ErrorBoundary>
```

#### Success Feedback
```tsx
// Toast notification
<Toast open={showToast}>
  <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
    ✓ บันทึกข้อมูลสำเร็จแล้ว
  </div>
</Toast>

// Confirmation modal
<Dialog open={showConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>ยืนยันการดำเนินการ</DialogTitle>
    </DialogHeader>
    <p>คุณต้องการลบกระบือนี้ใช่หรือไม่?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        ยกเลิก
      </Button>
      <Button variant="destructive" onClick={confirmDelete}>
        ลบ
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

**Document Version**: 1.0
**Last Updated**: November 12, 2025

