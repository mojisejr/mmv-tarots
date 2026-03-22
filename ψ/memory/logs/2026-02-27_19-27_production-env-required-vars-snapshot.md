# Snapshot: Production ENV Required Variables (Names Only)

**Local Time**: 2026-02-27 19:27:40 +07
**Project**: `projects/mmv-tarots`
**Scope**: Production environment variables required by runtime code (no secret values included)

---

## ✅ Required (Critical for Production)

### Database
- `DATABASE_URL`

### Authentication / LINE
- `BETTER_AUTH_SECRET`
- `LINE_CLIENT_ID`
- `LINE_CLIENT_SECRET`
- `LINE_REDIRECT_URI`
- `NEXT_PUBLIC_BETTER_AUTH_URL`

### Omise Payments
- `OMISE_SECRET_KEY`
- `NEXT_PUBLIC_OMISE_PUBLIC_KEY`
- `OMISE_CONFIG_MODE`  *(should be `live` in production)*

### Stripe Payments
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Security / Telemetry
- `PROMPT_ENCRYPTION_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## 🟨 Optional (Feature/Operational)
- `DISCORD_WEBHOOK_URL`  *(payment alert notifications)*
- `MODEL_NAME`  *(AI model override; has code default if missing)*
- `PAYMENT_DEBUG`  *(debug mode switch, normally off in production)*

---

## 🔎 Source Anchors (Code)
- `lib/server/auth.ts`
- `lib/client/auth-client.ts`
- `lib/server/omise.ts`
- `app/api/checkout/stripe/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/checkout/omise/route.ts`
- `prisma/schema.prisma`
- `lib/server/security/encryption.ts`
- `sentry.client.config.ts`
- `lib/server/payment-observability.ts`
- `lib/server/ai/agents/*`

---

## Notes
- This snapshot intentionally stores **variable names only** to avoid secret leakage.
- Before go-live, verify all Required vars exist in Vercel **Production** scope and that key mode prefixes match (`live` vs `test`).
