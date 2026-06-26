import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/server/services/auth-session-service", () => {
  class AuthSessionError extends Error {
    status = 500;
  }
  return {
    AuthSessionError,
    issueSessionResponse: vi.fn().mockImplementation((_req, userId) => {
      return new Response(JSON.stringify({ ok: true, userId }));
    }),
  };
});

vi.mock("@/lib/server/db", () => ({
  db: {
    user: {
      upsert: vi.fn(),
    },
  },
}));

import { GET } from "../../app/api/auth/dev-session/route";
import { db } from "@/lib/server/db";
import { issueSessionResponse } from "@/lib/server/services/auth-session-service";

describe("GET /api/auth/dev-session", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 403 Forbidden when NODE_ENV is not development", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/db";

    const request = new Request("http://localhost/api/auth/dev-session");
    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Dev session is only available in development");
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("returns 403 Forbidden when VERCEL_ENV is production", async () => {
    process.env.NODE_ENV = "development";
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/db";

    const request = new Request("http://localhost/api/auth/dev-session");
    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Dev session is only available in development");
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("returns 403 Forbidden when DATABASE_URL host is not local", async () => {
    process.env.NODE_ENV = "development";
    process.env.VERCEL_ENV = "development";
    process.env.DATABASE_URL = "postgresql://user:pass@neon.tech/db";

    const request = new Request("http://localhost/api/auth/dev-session");
    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Dev session requires a local DATABASE_URL");
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("creates user and issues session when all environment checks pass", async () => {
    process.env.NODE_ENV = "development";
    process.env.VERCEL_ENV = "development";
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/db";

    vi.mocked(db.user.upsert).mockResolvedValue({
      id: "dev-reading-notes-user",
    } as any);
    vi.mocked(issueSessionResponse).mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, userId: "dev-reading-notes-user" }),
      ) as any,
    );

    const request = new Request("http://localhost/api/auth/dev-session");
    const response = await GET(request as any);

    expect(response).toBeDefined();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("dev-reading-notes-user");

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "dev-reading-notes-user" },
      update: expect.objectContaining({
        email: "dev-reading-notes@localhost.test",
      }),
      create: expect.objectContaining({
        id: "dev-reading-notes-user",
        email: "dev-reading-notes@localhost.test",
      }),
    });
    expect(issueSessionResponse).toHaveBeenCalledWith(
      expect.any(Request),
      "dev-reading-notes-user",
    );
  });
});
