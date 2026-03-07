import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { serializeSignedCookie } from 'better-call';
import { db } from '@/lib/server/db';

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

const SESSION_COOKIE_NAME = 'mmv_auth.session_token';

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

    const lineUserId = profile.data.userId;
    const fallbackEmail = `${lineUserId}@mimivibe.com`;
    const displayName = profile.data.displayName || 'LINE User';
    const avatar = profile.data.pictureUrl;

    let user = await db.user.findFirst({
      where: {
        OR: [
          {
            accounts: {
              some: {
                providerId: 'line',
                accountId: lineUserId,
              },
            },
          },
          { email: fallbackEmail },
        ],
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: fallbackEmail,
          emailVerified: true,
          name: displayName,
          image: avatar,
        },
      });
    }

    const linkedAccount = await db.account.findFirst({
      where: {
        providerId: 'line',
        accountId: lineUserId,
      },
    });

    if (!linkedAccount) {
      await db.account.create({
        data: {
          userId: user.id,
          providerId: 'line',
          accountId: lineUserId,
          accessToken,
        },
      });
    } else if (linkedAccount.userId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Conflicting LINE account link' }, { status: 409 });
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
    const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

    await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      },
    });

    const authSecret = process.env.BETTER_AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json({ ok: false, error: 'Missing BETTER_AUTH_SECRET' }, { status: 500 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      secure: isProduction,
      maxAge: sessionMaxAgeSeconds,
    };

    const response = NextResponse.json({ ok: true });
    const signedCookie = await serializeSignedCookie(
      SESSION_COOKIE_NAME,
      sessionToken,
      authSecret,
      cookieOptions
    );

    response.headers.append('set-cookie', signedCookie);

    if (isProduction) {
      const secureSignedCookie = await serializeSignedCookie(
        `__Secure-${SESSION_COOKIE_NAME}`,
        sessionToken,
        authSecret,
        { ...cookieOptions, secure: true }
      );
      response.headers.append('set-cookie', secureSignedCookie);
    }

    return response;
  } catch (error) {
    console.error('[LIFF Verify] Unexpected error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}