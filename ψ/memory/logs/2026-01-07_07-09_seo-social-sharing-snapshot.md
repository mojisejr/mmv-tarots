# Snapshot: SEO & Social Sharing Ideas for mmv-tarots
**Timestamp**: 2026-01-07 07:09
**Context**: User requested ideas for SEO and Social Sharing features.

### Proposed Ideas:
1.  **Persistent Share Page (`/share/[id]`)**:
    - A dedicated public page for each prediction.
    - Optimized for mobile and SEO.
    - Clear Call-to-Action (CTA) to drive traffic back to the app.

2.  **Dynamic Social Preview (OG Image)**:
    - Use Next.js `ImageResponse` (Satori) to generate dynamic preview images.
    - Show the main tarot card and a brief summary in the preview.

3.  **Mobile-First Sharing Experience**:
    - Use Web Share API for native sharing on mobile.
    - Fallback to Copy Link for other environments.
    - Pre-defined viral message templates.

4.  **Implementation Goals**:
    - Simple + Robust + Consistent with Universal Oracle Coding Standard.
    - Functional-first approach.
    - Proper Service Layer for metadata and sharing logic.

### Next Steps:
- Design the OG Image template.
- Implement the `/share/[id]` route.
- Set up `generateMetadata` for dynamic SEO.
