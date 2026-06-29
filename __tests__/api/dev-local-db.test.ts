import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  isLocalDatabaseUrl,
  assertLocalDatabaseUrl,
  assertNonProductionLocalSeedTarget,
} from "../../lib/server/dev-local-db";

describe("Local DB Safety Guards", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isLocalDatabaseUrl", () => {
    it("returns true for local hostnames", () => {
      expect(
        isLocalDatabaseUrl("postgresql://postgres:postgres@localhost:5432/db"),
      ).toBe(true);
      expect(
        isLocalDatabaseUrl("postgresql://postgres:postgres@127.0.0.1:5432/db"),
      ).toBe(true);
      expect(
        isLocalDatabaseUrl("postgresql://postgres:postgres@[::1]:5432/db"),
      ).toBe(true);
    });

    it("returns false for non-local hostnames", () => {
      expect(
        isLocalDatabaseUrl(
          "postgresql://user:pass@ep-cool-pool-123.us-east-2.aws.neon.tech/db",
        ),
      ).toBe(false);
      expect(
        isLocalDatabaseUrl("postgresql://user:pass@192.168.1.50:5432/db"),
      ).toBe(false);
      expect(isLocalDatabaseUrl("")).toBe(false);
      expect(isLocalDatabaseUrl(undefined)).toBe(false);
    });
  });

  describe("assertLocalDatabaseUrl", () => {
    it("does not throw for local hostnames", () => {
      expect(() =>
        assertLocalDatabaseUrl(
          "postgresql://postgres:postgres@localhost:5432/db",
        ),
      ).not.toThrow();
    });

    it("throws for non-local hostnames", () => {
      expect(() =>
        assertLocalDatabaseUrl("postgresql://user:pass@neon.tech/db"),
      ).toThrow("Refusing to run against non-local DATABASE_URL host");
    });
  });

  describe("assertNonProductionLocalSeedTarget", () => {
    it("throws when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL =
        "postgresql://postgres:postgres@localhost:5432/db";
      expect(() => assertNonProductionLocalSeedTarget()).toThrow(
        "Refusing to seed when NODE_ENV=production",
      );
    });

    it("throws when VERCEL_ENV is production", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL_ENV = "production";
      process.env.DATABASE_URL =
        "postgresql://postgres:postgres@localhost:5432/db";
      expect(() => assertNonProductionLocalSeedTarget()).toThrow(
        "Refusing to seed when VERCEL_ENV=production",
      );
    });

    it("throws when DATABASE_URL points to a remote server", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL_ENV = "development";
      process.env.DATABASE_URL =
        "postgresql://user:pass@ep-cool-pool-123.neon.tech/db";
      expect(() => assertNonProductionLocalSeedTarget()).toThrow(
        "Refusing to run against non-local DATABASE_URL host",
      );
    });

    it("passes when environment and DATABASE_URL are both local and development", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL_ENV = "development";
      process.env.DATABASE_URL =
        "postgresql://postgres:postgres@localhost:5432/db";
      expect(() => assertNonProductionLocalSeedTarget()).not.toThrow();
    });
  });
});
