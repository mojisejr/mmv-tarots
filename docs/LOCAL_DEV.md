# Local Development

This guide boots mmv-tarots against a disposable local Postgres database.
Do not use production Neon URLs or real provider secrets in `.env.local`.

## 1. Start Postgres

```bash
npm run db:up
```

The Compose service exposes:

- host: `localhost`
- port: `5432`
- database: `mmv_tarots_dev`
- user/password: `postgres` / `postgres`

## 2. Create `.env.local`

```bash
cp .env.example .env.local
```

Confirm this exact safety property before running migrations or seed:

```bash
grep '^DATABASE_URL=' .env.local
```

The URL must point to `localhost`, `127.0.0.1`, or `::1`.

## 3. Apply migrations

```bash
node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy
```

Use `migrate deploy` for local bootstrap so the database matches committed migrations.

## 4. Seed local data

The seed preserves master seed behavior and still expects the private local master config:

```bash
.tmp/master-seed-config.json
```

Then run:

```bash
npm run seed:dev
```

The seed refuses to run when:

- `NODE_ENV=production`
- `VERCEL_ENV=production`
- `DATABASE_URL` host is not local

It seeds master data, then adds a local dev user and a completed reading:

- user: `dev-reading-notes@localhost.test`
- reading: `/history/job-1700000000000-devnotes1`

## 5. Run the app

```bash
npm run dev
```

## 6. Issue a dev session

Open this route in the same browser:

```text
http://localhost:3000/api/auth/dev-session
```

The route creates/finds the local dev user and issues a Better Auth session cookie.
It returns `403` unless `NODE_ENV=development` and `DATABASE_URL` points to a local DB.

## 7. Open history

```text
http://localhost:3000/history/job-1700000000000-devnotes1
```

Use this reading for local Reading Notes browser-truth checks.
