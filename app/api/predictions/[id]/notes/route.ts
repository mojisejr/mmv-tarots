import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export const MAX_READING_NOTES_LENGTH = 5000;

type PredictionNotesRecord = {
  id: string;
  jobId: string | null;
  userIdentifier: string | null;
  notes: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function findPredictionByRouteId(
  id: string,
): Promise<PredictionNotesRecord | null> {
  return db.prediction.findFirst({
    where: {
      OR: [{ jobId: id }, ...(isUuid(id) ? [{ id }] : [])],
    },
    select: {
      id: true,
      jobId: true,
      userIdentifier: true,
      notes: true,
    },
  });
}

function serializePredictionNotes(prediction: PredictionNotesRecord) {
  return {
    prediction: {
      id: prediction.id,
      jobId: prediction.jobId,
      notes: prediction.notes ?? "",
    },
  };
}

async function getOwnedPrediction(
  request: NextRequest,
  id: string,
): Promise<
  | { ok: true; prediction: PredictionNotesRecord }
  | { ok: false; response: Response }
> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (!id?.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Prediction id is required" },
        { status: 400 },
      ),
    };
  }

  const prediction = await findPredictionByRouteId(id);
  if (!prediction) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 },
      ),
    };
  }

  if (prediction.userIdentifier !== session.user.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, prediction };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const owned = await getOwnedPrediction(request, id);
  if (!owned.ok) return owned.response;

  return NextResponse.json(serializePredictionNotes(owned.prediction));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const owned = await getOwnedPrediction(request, id);
  if (!owned.ok) return owned.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawNotes =
    payload && typeof payload === "object" && "notes" in payload
      ? (payload as { notes?: unknown }).notes
      : null;

  if (rawNotes != null && typeof rawNotes !== "string") {
    return NextResponse.json(
      { error: "notes must be a string or null" },
      { status: 400 },
    );
  }

  if (
    typeof rawNotes === "string" &&
    rawNotes.length > MAX_READING_NOTES_LENGTH
  ) {
    return NextResponse.json(
      {
        error: `notes must be ${MAX_READING_NOTES_LENGTH} characters or fewer`,
      },
      { status: 400 },
    );
  }

  const normalizedNotes =
    typeof rawNotes === "string" && rawNotes.trim().length > 0
      ? rawNotes
      : null;

  const updated = await db.prediction.update({
    where: { id: owned.prediction.id },
    data: { notes: normalizedNotes },
    select: {
      id: true,
      jobId: true,
      userIdentifier: true,
      notes: true,
    },
  });

  return NextResponse.json(serializePredictionNotes(updated));
}
