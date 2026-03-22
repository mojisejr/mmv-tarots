# Snapshot: LIFF Domain Mismatch Silent Failure (www vs non-www)

**Time**: 2026-03-08 16:17 (+07)
**Context**: `projects/mmv-tarots` - Production manual testing revealed a silent failure causing a black screen during the LIFF login flow.

## 🎯 Insight
LINE LIFF SDK strict domain validation causes `liff.init()` to reject if the current browser URL uses a `www.` prefix (e.g., `https://www.maemormimi.com`) while the LINE Developer Console only registers the root domain (`https://maemormimi.com`). Since we lacked an Error Boundary/try-catch for `liff.init()` in our auth gateway, the UI stays stuck on the loading state (black screen) indefinitely without redirecting or notifying the user.

## 🔍 Evidence
- **Console Warn/Error**: `[WARN] liff.init() was called with a current URL that is not related to the endpoint URL. https://www.maemormimi.com/ is not under https://maemormimi.com`
- **User behavior**: Clicking login passes through `/liff?liff.state=%2F` which then hangs with the native visual loader.

## 🛡️ Guardrails / Apply When
- **Domain Normalization**: When using LINE LIFF, always enforce domain normalization (stripping or enforcing `www.`) either at the infrastructure level (Vercel Domain Settings/Redirects) or via Next.js `middleware.ts`.
- **Initialization Safety Net**: Always wrap `liff.init()` inside a `try/catch` and provide a fallback UI or auto-redirect handler to prevent silent failure lockups.

## 📝 Next Actions (Deferred)
- [ ] DECISION REQUIRED: Implement Vercel domain redirect rule (www -> non-www) OR add NextUrl normalization directly in `middleware.ts`.
- [ ] Add an Error Boundary or Fallback UI to `app/liff/page.tsx` for `liff.init()` exceptions to gracefully handle Edge Cases like this.

## Tags
#mmv-tarots #liff #production-bug #domain-normalization #silent-failure #sss