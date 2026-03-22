# Snapshot: Phase 1 API Contract Reframe — Direct File Upload

**Time**: 2026-03-18 23:48 +0700
**Context**: Phase 1 of the MMV direct file upload plan. Reframed the slip submission route from JSON `slipImageUrl` to `multipart/form-data` with `slipFile` field.

---

## Evidence

- **Route** (`app/api/payment/orders/[id]/slip/route.ts`): Now parses `multipart/form-data`, validates file MIME (JPEG/PNG/WEBP) + extension + size (max 10MB), extracts buffer and passes `SlipFileInput { buffer, filename, mimeType }` to fulfillment service.
- **Fulfillment service**: `SubmitSlipInput` uses `slipFile: SlipFileInput` replacing `slipImageUrl`. Stores `direct-upload://<filename>` in DB `slipImageUrl` field for auditability.
- **Verification service**: `VerifySlipInput` accepts either `slipFile` (buffer → base64 `data` mode) or `slipImageUrl` (legacy URL mode). Phase 2 will switch to multipart `files` mode.
- **Error mapping**: Added `VALIDATION_ERROR → 422` in `createErrorResponse` — was missing, defaulted to 500.
- **Pre-existing fix**: Verification service test had `SLIPOK_API_URL` env leakage from `.env` overriding test config. Fixed with `delete process.env.SLIPOK_API_URL`.
- **Test robustness**: `instanceof File` unreliable across Node.js realms (undici vs global). Changed to `typeof file === 'string'` guard. FormData round-trip in Node.js doesn't preserve filename (`name: "blob"` default) — test assertions adjusted.
- **Hard Gate**: 232/232 tests pass, build clean, lint clean.
- **Commit**: `8fb63c7` on `staging` branch.

## Apply When

- Continuing Phase 2 (SlipOK Direct Upload Adapter): The verify service currently uses base64 `data` mode as bridge. Phase 2 should switch to multipart `files` mode for production efficiency.
- When other routes need file upload parsing: Use the same `typeof file === 'string'` pattern instead of `instanceof File`.

## Next Actions

- Phase 2: Switch verification service from base64 `data` mode to multipart `files` mode (proper SlipOK `files` payload).
- Phase 3: Update `PromptPayQR.tsx` UI from URL input to file picker.

## Tags

`snapshot` `sss` `mmv-tarots` `payment` `phase1` `api-contract` `multipart` `direct-upload`
