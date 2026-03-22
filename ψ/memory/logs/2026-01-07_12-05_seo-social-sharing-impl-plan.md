# Implementation Plan: SEO & Social Sharing (mmv-tarots)
**Timestamp**: 2026-01-07 12:05
**Status**: Ready for Implementation
**Branch Target**: `feat/seo-social-sharing`

## Phase 1: The Public Share Page (`/share/[id]`)
**Goal**: Create a lightweight, high-performance page for public viewing.

1.  **Route**: Create `app/share/[id]/page.tsx` (Server Component).
2.  **Logic**:
    - Fetch prediction by UUID (`jobId`).
    - Filter out sensitive user data.
    - Render a "Reader-only" view using existing `ReadingHeader`, `CardSpread`, and `FinalSummary` components.
3.  **CTA**: Add a dedicated `ConversionCard` at the bottom with a primary button linking to `/` (Home).

## Phase 2: Dynamic Social Preview (OG Image)
**Goal**: Viral preview cards with real tarot data.

1.  **API**: Create `app/api/og/route.tsx`.
2.  **Tech**: Use `next/og` (Satori).
3.  **Layout**:
    - **Container**: 1200x630px, Mimivibe bg gradient.
    - **Left**: Tarot Card Image (fetched from `prediction.selectedCards[0]`).
    - **Right**: Title ("วันนี้คุณได้รับไพ่..."), Card Name (TH), and a short summary excerpt.
4.  **Integration**: Link this API in the `generateMetadata` of the share page.

## Phase 3: Share Component & Integration
**Goal**: Intuitive mobile-first sharing.

1.  **Component**: Create `components/reading/share-actions.tsx` (Client Component).
    - **Props**: `predictionId`, `title`, `summary`.
    - **Feature**: `navigator.share()` for mobile, Clipboard fallback for Desktop.
2.  **UI 1 (Subtle)**: Add a small share icon button in the `QuestionCard` header in `app/history/[id]/page.tsx`.
3.  **UI 2 (CTA)**: Insert a `ShareResultCard` between `FinalSummary` and `Disclaimer` in the history detail view.

## Phase 4: SEO & Metadata
**Goal**: Ensure search engines and crawlers see the right info.

1.  **GenerateMetadata**: Implement `generateMetadata` in `app/share/[id]/page.tsx`:
    - `title`: "ผลการทำนายไพ่ยิปซี: [ไพ่ที่ได้] | MimiVibe"
    - `description`: "ลองมาดูผลการทำนายดวงของฉัน และเปิดไพ่ของคุณเองได้ที่นี่"
    - `openGraph`: Points to `/api/og?id=[id]`.
2.  **Canonical Tags**: Ensure each share page point to itself.

## Phase 5: Verification & Cleanup
1.  **Testing**:
    - Verify OG Image renders correctly (using Vercel OG debugger).
    - Mobile sharing test (simulated).
    - SEO check (Meta tags validation).
2.  **Log & Retro**: Finalize with `rrr`.

---
**Oracle Note**: Every change must adhere to the **Universal Oracle Coding Standard**. Functional-first approach and strict typing are mandatory.
