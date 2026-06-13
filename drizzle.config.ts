import { defineConfig } from "drizzle-kit";

// content-creator DB only (SQLite) — แยกจาก Prisma/Postgres หลัก
export default defineConfig({
  dialect: "sqlite",
  schema: "./content-creator/db/schema.ts",
  out: "./content-creator/db/migrations",
});
