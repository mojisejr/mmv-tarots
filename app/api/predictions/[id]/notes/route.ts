import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export const MAX_READING_NOTES_LENGTH = 5000;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      { error: "Prediction id is required" },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const notes = (payload as { notes?: unknown }).notes;
  if (typeof notes !== "string") {
    return NextResponse.json(
      { error: "notes must be a string" },
      { status: 400 },
    );
  }

  if (notes.length > MAX_READING_NOTES_LENGTH) {
    return NextResponse.json(
      {
        error: `notes must be ${MAX_READING_NOTES_LENGTH} characters or fewer`,
      },
      { status: 422 },
    );
  }

  const prediction = await db.prediction.findFirst({
    where: {
      OR: [{ jobId: id }, ...(isUuid(id) ? [{ id }] : [])],
    },
    select: {
      id: true,
      jobId: true,
      userIdentifier: true,
    },
  });

  if (!prediction) {
    return NextResponse.json(
      { error: "Prediction not found" },
      { status: 404 },
    );
  }

  if (prediction.userIdentifier !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalizedNotes = notes.trim().length > 0 ? notes : null;
  const updated = await db.prediction.update({
    where: { id: prediction.id },
    data: { notes: normalizedNotes },
    select: {
      id: true,
      jobId: true,
      notes: true,
    },
  });

  return NextResponse.json({
    prediction: {
      id: updated.id,
      jobId: updated.jobId,
      notes: updated.notes ?? "",
    },
  });
}
