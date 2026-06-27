import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    prediction: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import {
  GET,
  PATCH,
  MAX_READING_NOTES_LENGTH,
} from "@/app/api/predictions/[id]/notes/route";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

describe("PATCH /api/predictions/[id]/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user_001" },
    } as any);
    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      userIdentifier: "user_001",
    } as any);
    vi.mocked(db.prediction.update).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      notes: "จำไว้ว่ารอบนี้เน้นงาน",
    } as any);
  });

  it("updates notes for the owner", async () => {
    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "จำไว้ว่ารอบนี้เน้นงาน" }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.prediction.notes).toBe("จำไว้ว่ารอบนี้เน้นงาน");
    expect(db.prediction.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ jobId: "job-123-abcdefghi" }],
      },
      select: {
        id: true,
        jobId: true,
        userIdentifier: true,
        notes: true,
      },
    });
    expect(db.prediction.update).toHaveBeenCalledWith({
      where: { id: "prediction_uuid" },
      data: { notes: "จำไว้ว่ารอบนี้เน้นงาน" },
      select: {
        id: true,
        jobId: true,
        userIdentifier: true,
        notes: true,
      },
    });
  });

  it("returns 403 for non-owner predictions", async () => {
    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      userIdentifier: "other_user",
    } as any);

    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "ห้ามแก้ของคนอื่น" }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });

    expect(response.status).toBe(403);
    expect(db.prediction.update).not.toHaveBeenCalled();
  });

  it("validates notes length", async () => {
    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "x".repeat(MAX_READING_NOTES_LENGTH + 1),
        }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });

    expect(response.status).toBe(400);
    expect(db.prediction.update).not.toHaveBeenCalled();
  });

  it("clears missing or null notes without crashing", async () => {
    vi.mocked(db.prediction.update).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      userIdentifier: "user_001",
      notes: null,
    } as any);

    for (const body of [{}, { notes: null }]) {
      vi.mocked(db.prediction.update).mockClear();

      const request = new Request(
        "http://localhost/api/predictions/job-123-abcdefghi/notes",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const response = await PATCH(request as any, {
        params: Promise.resolve({ id: "job-123-abcdefghi" }),
      });
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.prediction.notes).toBe("");
      expect(db.prediction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { notes: null },
        }),
      );
    }
  });

  it("returns 400 for non-string note values", async () => {
    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: 123 }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });

    expect(response.status).toBe(400);
    expect(db.prediction.update).not.toHaveBeenCalled();
  });

  it("clears whitespace-only notes to null", async () => {
    vi.mocked(db.prediction.update).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      notes: null,
    } as any);

    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "   " }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.prediction.notes).toBe("");
    expect(db.prediction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { notes: null },
      }),
    );
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "anything" }),
      },
    );

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });

    expect(response.status).toBe(401);
    expect(db.prediction.findFirst).not.toHaveBeenCalled();
  });

  it("returns owner notes through authenticated GET", async () => {
    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      userIdentifier: "user_001",
      notes: "โน้ตส่วนตัว",
    } as any);

    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      { method: "GET" },
    );

    const response = await GET(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.prediction.notes).toBe("โน้ตส่วนตัว");
  });

  it("returns 403 for non-owner notes GET", async () => {
    vi.mocked(db.prediction.findFirst).mockResolvedValue({
      id: "prediction_uuid",
      jobId: "job-123-abcdefghi",
      userIdentifier: "other_user",
      notes: "ห้ามหลุด",
    } as any);

    const request = new Request(
      "http://localhost/api/predictions/job-123-abcdefghi/notes",
      { method: "GET" },
    );

    const response = await GET(request as any, {
      params: Promise.resolve({ id: "job-123-abcdefghi" }),
    });

    expect(response.status).toBe(403);
  });
});
