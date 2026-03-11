import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createInternalContext } from 'better-call';
import { getCookies } from 'better-auth/cookies';
import { auth } from '@/lib/server/auth';

const requestSchema = z.object({
  accessToken: z.string().min(1),
});

const lineVerifyResponseSchema = z.object({
  client_id: z.string(),
  expires_in: z.number(),
  scope: z.string().optional(),
});

const lineProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string().optional(),
  pictureUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const accessToken = parsed.data.accessToken;
    const verifyResponse = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ ok: false, error: 'Invalid LINE access token' }, { status: 401 });
    }

    const verifyJson = await verifyResponse.json();
    const verifyParsed = lineVerifyResponseSchema.safeParse(verifyJson);

    if (!verifyParsed.success || verifyParsed.data.expires_in <= 0) {
      return NextResponse.json({ ok: false, error: 'LINE token verification failed' }, { status: 401 });
    }

    const expectedChannelId = process.env.LINE_CHANNEL_ID;
    if (expectedChannelId && verifyParsed.data.client_id !== expectedChannelId) {
      return NextResponse.json({ ok: false, error: 'LINE channel mismatch' }, { status: 401 });
    }

    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ ok: false, error: 'Unable to fetch LINE profile' }, { status: 401 });
    }

    const profileJson = await profileResponse.json();
    const profile = lineProfileSchema.safeParse(profileJson);

    if (!profile.success) {
      return NextResponse.json({ ok: false, error: 'Invalid LINE profile payload' }, { status: 401 });
    }

    // Step 1: Verify LINE identity payload
    const lineUserId = profile.data.userId;
    const lineIdentityEmail = `${lineUserId}@mimivibe.com`;
    const displayName = profile.data.displayName || 'LINE User';
    const avatar = profile.data.pictureUrl;

    // Step 2: Resolve or create app identity linked to LINE account
    const authContext = await auth.$context;
    const existingAccount = await authContext.internalAdapter.findAccountByProviderId(lineUserId, 'line');

    let user = existingAccount
      ? await authContext.internalAdapter.findUserById(existingAccount.userId)
      : null;

    if (!user) {
      const foundByEmail = await authContext.internalAdapter.findUserByEmail(lineIdentityEmail, {
        includeAccounts: true,
      });
      user = foundByEmail?.user ?? null;
    }

    if (!user) {
      const created = await authContext.internalAdapter.createOAuthUser(
        {
          email: lineIdentityEmail,
          emailVerified: true,
          name: displayName,
          image: avatar,
        },
        {
          providerId: 'line',
          accountId: lineUserId,
          accessToken,
        }
      );
      user = created.user;
    } else if (!existingAccount) {
      await authContext.internalAdapter.linkAccount({
        userId: user.id,
        providerId: 'line',
        accountId: lineUserId,
        accessToken,
      });
    } else if (existingAccount.userId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Conflicting LINE account link' }, { status: 409 });
    }

    // Step 3: Issue Better-Auth session cookie
    const session = await authContext.internalAdapter.createSession(user.id);
    if (!session?.token) {
      return NextResponse.json({ ok: false, error: 'Failed to create auth session' }, { status: 500 });
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
  } catch (error) {
    console.error('[LIFF Verify] Unexpected error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}