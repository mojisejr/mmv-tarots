import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  LineIdentityError,
  resolveOrCreateLineUser,
  verifyAndLoadLineIdentity,
} from '@/lib/server/services/line-identity-service';
import { AuthSessionError, issueSessionResponse } from '@/lib/server/services/auth-session-service';

const requestSchema = z.object({
  accessToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const accessToken = parsed.data.accessToken;
    // Step 1: Verify LINE identity payload
    const identity = await verifyAndLoadLineIdentity(accessToken, process.env.LINE_CHANNEL_ID);

    // Step 2: Resolve or create app identity linked to LINE account
    const user = await resolveOrCreateLineUser(identity, accessToken);

    // Step 3: Issue Better-Auth session cookie
    return await issueSessionResponse(request, user.id);
  } catch (error) {
    if (error instanceof LineIdentityError || error instanceof AuthSessionError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    console.error('[LIFF Verify] Unexpected error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}