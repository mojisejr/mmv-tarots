import { NextRequest, NextResponse } from 'next/server';
import { createInternalContext } from 'better-call';
import { getCookies } from 'better-auth/cookies';
import { auth } from '@/lib/server/auth';

export class AuthSessionError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthSessionError';
    this.status = status;
  }
}

export async function issueSessionResponse(request: NextRequest, userId: string): Promise<NextResponse> {
  const authContext = await auth.$context;
  const session = await authContext.internalAdapter.createSession(userId);

  if (!session?.token) {
    throw new AuthSessionError('Failed to create auth session', 500);
  }

  const response = NextResponse.json({ ok: true });
  const authCookies = getCookies(auth.options);
  const endpointContext = await createInternalContext(
    { request, headers: request.headers },
    { options: { method: 'POST' } }
  );

  const signedSessionCookie = await endpointContext.setSignedCookie(
    authCookies.sessionToken.name,
    session.token,
    authContext.secret,
    {
      ...authCookies.sessionToken.options,
      maxAge: authContext.sessionConfig.expiresIn,
    }
  );

  response.headers.append('set-cookie', signedSessionCookie);

  return response;
}