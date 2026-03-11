import { z } from 'zod';
import { auth } from '@/lib/server/auth';

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

export class LineIdentityError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LineIdentityError';
    this.status = status;
  }
}

export type LineIdentity = {
  lineUserId: string;
  displayName: string;
  avatar?: string;
  lineIdentityEmail: string;
};

export async function verifyAndLoadLineIdentity(
  accessToken: string,
  expectedChannelId?: string
): Promise<LineIdentity> {
  const verifyResponse = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  if (!verifyResponse.ok) {
    throw new LineIdentityError('Invalid LINE access token', 401);
  }

  const verifyJson = await verifyResponse.json();
  const verifyParsed = lineVerifyResponseSchema.safeParse(verifyJson);

  if (!verifyParsed.success || verifyParsed.data.expires_in <= 0) {
    throw new LineIdentityError('LINE token verification failed', 401);
  }

  if (expectedChannelId && verifyParsed.data.client_id !== expectedChannelId) {
    throw new LineIdentityError('LINE channel mismatch', 401);
  }

  const profileResponse = await fetch('https://api.line.me/v2/profile', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new LineIdentityError('Unable to fetch LINE profile', 401);
  }

  const profileJson = await profileResponse.json();
  const profile = lineProfileSchema.safeParse(profileJson);

  if (!profile.success) {
    throw new LineIdentityError('Invalid LINE profile payload', 401);
  }

  const lineUserId = profile.data.userId;

  return {
    lineUserId,
    displayName: profile.data.displayName || 'LINE User',
    avatar: profile.data.pictureUrl,
    lineIdentityEmail: `${lineUserId}@mimivibe.com`,
  };
}

export async function resolveOrCreateLineUser(identity: LineIdentity, accessToken: string) {
  const authContext = await auth.$context;
  const existingAccount = await authContext.internalAdapter.findAccountByProviderId(
    identity.lineUserId,
    'line'
  );

  let user = existingAccount
    ? await authContext.internalAdapter.findUserById(existingAccount.userId)
    : null;

  if (!user) {
    const foundByEmail = await authContext.internalAdapter.findUserByEmail(identity.lineIdentityEmail, {
      includeAccounts: true,
    });
    user = foundByEmail?.user ?? null;
  }

  if (!user) {
    const created = await authContext.internalAdapter.createOAuthUser(
      {
        email: identity.lineIdentityEmail,
        emailVerified: true,
        name: identity.displayName,
        image: identity.avatar,
      },
      {
        providerId: 'line',
        accountId: identity.lineUserId,
        accessToken,
      }
    );

    return created.user;
  }

  if (!existingAccount) {
    await authContext.internalAdapter.linkAccount({
      userId: user.id,
      providerId: 'line',
      accountId: identity.lineUserId,
      accessToken,
    });

    return user;
  }

  if (existingAccount.userId !== user.id) {
    throw new LineIdentityError('Conflicting LINE account link', 409);
  }

  return user;
}