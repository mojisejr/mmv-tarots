import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { isLocalDatabaseUrl } from "@/lib/server/dev-local-db";
import {
  AuthSessionError,
  issueSessionResponse,
} from "@/lib/server/services/auth-session-service";

const DEV_USER_ID = "dev-reading-notes-user";
const DEV_USER_EMAIL = "dev-reading-notes@localhost.test";

async function issueDevSession(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return NextResponse.json(
      { ok: false, error: "Dev session is only available in development" },
      { status: 403 },
    );
  }

  if (!isLocalDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, error: "Dev session requires a local DATABASE_URL" },
      { status: 403 },
    );
  }

  const user = await db.user.upsert({
    where: { id: DEV_USER_ID },
    update: {
      name: "MimiVibe Local Dev",
      email: DEV_USER_EMAIL,
      emailVerified: true,
      stars: 25,
      onboardingCompleted: true,
    },
    create: {
      id: DEV_USER_ID,
      name: "MimiVibe Local Dev",
      email: DEV_USER_EMAIL,
      emailVerified: true,
      stars: 25,
      onboardingCompleted: true,
      signupIp: "127.0.0.1",
    },
  });

  return issueSessionResponse(request, user.id);
}

export async function GET(request: NextRequest) {
  try {
    return await issueDevSession(request);
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("[Dev Session] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
