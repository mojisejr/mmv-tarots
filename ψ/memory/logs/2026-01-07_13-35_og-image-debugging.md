# Snapshot: 2026-01-07 13:35 - OG Image Debugging Saga

## Current State
- **Goal**: Render a branded OG Image for `mmv-tarots` using the "Warm Magic" theme.
- **Problem**: Encountering `TypeError: u2 is not iterable` during Satori rendering.
- **Assets**: 
  - Font: `NotoSansThai-Bold.ttf` (Verified valid TTF).
  - Logo: `logo.webp` (Potential compatibility risk).
- **Environment**: Next.js 16 (nodejs runtime for `/api/og`).

## Investigations
1. **Font Signature Error (Fixed)**: Previously, the font was downloaded as an HTML file from GitHub. User has manually uploaded the correct binary file. Verified with `file` command.
2. **Satori Render Error**: The `u2 is not iterable` error is a known artifact of Satori failing to parse certain CSS or when it crashes internally during SVG generation.
3. **Suspected Culprits**:
   - `radial-gradient`: Satori support is fragile.
   - `box-shadow`: Limited support.
   - `logo.webp`: Satori primarily supports PNG/JPG.
   - CSS shorthand `border`: Sometimes fails.

## Plan
1. Simplify `api/og/route.tsx` by:
   - Converting `radial-gradient` to a solid background circle (Satori often crashes on gradients).
   - Removing all `boxShadow` (Satori support is limited and buggy).
   - Switching CSS shorthand `border` to individual properties (`borderWidth`, `borderStyle`, `borderColor`).
   - Converting `fontData` from `Buffer` to `ArrayBuffer` (`Uint8Array`).
   - Temporarily disabling `logo.webp` (WebP support is questionable in Satori/resvg).
2. Verify if `TypeError` persists.

## Actions Taken
- Simplified background aura to a solid circle.
- Removed all `boxShadow` properties.
- Refactored `border` and `borderBottom` to separate properties.
- Wrapped `fontData` in `new Uint8Array(fontBuffer).buffer`.
- Commented out logo loading and injection logic.
- Simplified `fontFamily` declaration to match the font name exactly.

## Traceability
- Issue ID: #none
- Branch: copiloting
