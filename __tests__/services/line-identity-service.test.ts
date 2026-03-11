import { beforeEach, describe, expect, it, vi } from 'vitest';

const testMocks = vi.hoisted(() => {
  const mockInternalAdapter = {
    findAccountByProviderId: vi.fn(),
    findUserById: vi.fn(),
    findUserByEmail: vi.fn(),
    createOAuthUser: vi.fn(),
    linkAccount: vi.fn(),
  };

  const mockAuthContext = {
    internalAdapter: mockInternalAdapter,
  };

  return {
    mockInternalAdapter,
    mockAuthContext,
  };
});

vi.mock('@/lib/server/auth', () => ({
  auth: {
    $context: Promise.resolve(testMocks.mockAuthContext),
  },
}));

import {
  LineIdentityError,
  resolveOrCreateLineUser,
  verifyAndLoadLineIdentity,
} from '@/lib/server/services/line-identity-service';

describe('line-identity-service', () => {
  const identity = {
    lineUserId: 'line-user-123',
    displayName: 'LINE User',
    avatar: 'https://img.example/avatar.png',
    lineIdentityEmail: 'line-user-123@mimivibe.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockInternalAdapter.findAccountByProviderId.mockResolvedValue(null);
    testMocks.mockInternalAdapter.findUserById.mockResolvedValue(null);
    testMocks.mockInternalAdapter.findUserByEmail.mockResolvedValue(null);
    testMocks.mockInternalAdapter.createOAuthUser.mockResolvedValue({
      user: { id: 'new-user-id' },
    });
    testMocks.mockInternalAdapter.linkAccount.mockResolvedValue(undefined);
  });

  it('reuses user when line account already exists', async () => {
    testMocks.mockInternalAdapter.findAccountByProviderId.mockResolvedValue({
      userId: 'existing-user-id',
    });
    testMocks.mockInternalAdapter.findUserById.mockResolvedValue({
      id: 'existing-user-id',
    });

    const user = await resolveOrCreateLineUser(identity, 'access-token-1');

    expect(user.id).toBe('existing-user-id');
    expect(testMocks.mockInternalAdapter.createOAuthUser).not.toHaveBeenCalled();
    expect(testMocks.mockInternalAdapter.linkAccount).not.toHaveBeenCalled();
  });

  it('creates oauth user when no existing account and no email match', async () => {
    const user = await resolveOrCreateLineUser(identity, 'access-token-2');

    expect(user.id).toBe('new-user-id');
    expect(testMocks.mockInternalAdapter.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'line-user-123@mimivibe.com',
      }),
      expect.objectContaining({
        providerId: 'line',
        accountId: 'line-user-123',
      })
    );
  });

  it('links account when user exists by email but line account is not linked yet', async () => {
    testMocks.mockInternalAdapter.findUserByEmail.mockResolvedValue({
      user: { id: 'email-user-id' },
    });

    const user = await resolveOrCreateLineUser(identity, 'access-token-3');

    expect(user.id).toBe('email-user-id');
    expect(testMocks.mockInternalAdapter.linkAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'email-user-id',
        providerId: 'line',
        accountId: 'line-user-123',
      })
    );
  });

  it('throws 409 when line account links to a different user', async () => {
    testMocks.mockInternalAdapter.findAccountByProviderId.mockResolvedValue({
      userId: 'account-user-id',
    });
    testMocks.mockInternalAdapter.findUserById.mockResolvedValue(null);
    testMocks.mockInternalAdapter.findUserByEmail.mockResolvedValue({
      user: { id: 'email-user-id' },
    });

    await expect(resolveOrCreateLineUser(identity, 'access-token-4')).rejects.toMatchObject({
      name: 'LineIdentityError',
      status: 409,
      message: 'Conflicting LINE account link',
    } satisfies Partial<LineIdentityError>);
  });

  it('fails verification when line token endpoint returns non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    await expect(verifyAndLoadLineIdentity('bad-token', 'line-channel-1')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid LINE access token',
    } satisfies Partial<LineIdentityError>);
  });
});
