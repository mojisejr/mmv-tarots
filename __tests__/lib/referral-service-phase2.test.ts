import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERRAL_REWARDS, ReferralStatus } from '@/constants/referral';

const testMocks = vi.hoisted(() => ({
  mockUserUpdate: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockReferralHistoryCount: vi.fn(),
  mockReferralHistoryFindFirst: vi.fn(),
  mockReferralHistoryCreate: vi.fn(),
  mockReferralHistoryUpdate: vi.fn(),
  mockCreditTransactionCreate: vi.fn(),
  mockDbTransaction: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    user: {
      update: testMocks.mockUserUpdate,
      findUnique: testMocks.mockUserFindUnique,
    },
    referralHistory: {
      count: testMocks.mockReferralHistoryCount,
      findFirst: testMocks.mockReferralHistoryFindFirst,
      create: testMocks.mockReferralHistoryCreate,
      update: testMocks.mockReferralHistoryUpdate,
    },
    creditTransaction: {
      create: testMocks.mockCreditTransactionCreate,
    },
    $transaction: testMocks.mockDbTransaction,
  },
}));

import { referralService } from '@/lib/server/services/referral-service';

describe('referralService phase 2 safety net', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockUserUpdate.mockResolvedValue({});
    testMocks.mockUserFindUnique.mockResolvedValue({ id: 'referrer-1' });
    testMocks.mockReferralHistoryCount.mockResolvedValue(0);
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue(null);
    testMocks.mockReferralHistoryCreate.mockResolvedValue({ id: 'history-1' });
    testMocks.mockReferralHistoryUpdate.mockResolvedValue({});
    testMocks.mockCreditTransactionCreate.mockResolvedValue({});
    testMocks.mockDbTransaction.mockResolvedValue([]);
  });

  it('processReferralSignup is idempotent when referee already has referral history', async () => {
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue({ id: 'existing-history' });

    await referralService.processReferralSignup(
      { id: 'user-1' } as any,
      'FRIEND001',
      '1.2.3.4'
    );

    expect(testMocks.mockDbTransaction).not.toHaveBeenCalled();
    expect(testMocks.mockReferralHistoryCreate).not.toHaveBeenCalled();
  });

  it('processReferralSignup records only signupIp when referral code is missing', async () => {
    await referralService.processReferralSignup(
      { id: 'user-1' } as any,
      undefined,
      '9.9.9.9'
    );

    expect(testMocks.mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { signupIp: '9.9.9.9' },
    });
    expect(testMocks.mockDbTransaction).not.toHaveBeenCalled();
  });

  it('processReferralSignup creates pending history for normal traffic', async () => {
    await referralService.processReferralSignup(
      { id: 'user-1' } as any,
      'FRIEND123',
      '3.4.5.6'
    );

    expect(testMocks.mockReferralHistoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        referrerId: 'referrer-1',
        refereeId: 'user-1',
        ipAddress: '3.4.5.6',
        status: ReferralStatus.PENDING,
        rewardAmount: REFERRAL_REWARDS.REFERRER,
      }),
    });
    expect(testMocks.mockDbTransaction).toHaveBeenCalledTimes(1);
  });

  it('processReferralSignup marks history as BLOCKED when ip threshold is suspicious', async () => {
    testMocks.mockReferralHistoryCount.mockResolvedValue(3);

    await referralService.processReferralSignup(
      { id: 'user-1' } as any,
      'FRIEND123',
      '3.4.5.6'
    );

    expect(testMocks.mockReferralHistoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: ReferralStatus.BLOCKED,
      }),
    });
  });

  it('grantReferralReward is no-op when no pending history exists', async () => {
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue(null);

    await referralService.grantReferralReward('referee-1');

    expect(testMocks.mockUserUpdate).not.toHaveBeenCalled();
    expect(testMocks.mockCreditTransactionCreate).not.toHaveBeenCalled();
    expect(testMocks.mockReferralHistoryUpdate).not.toHaveBeenCalled();
  });

  it('grantReferralReward writes deterministic ledger entries and marks GRANTED', async () => {
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue({
      id: 'history-777',
      referrerId: 'referrer-9',
      refereeId: 'referee-9',
      referrer: { stars: 10 },
      referee: { stars: 4 },
    });

    await referralService.grantReferralReward('referee-9');

    expect(testMocks.mockCreditTransactionCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'referrer-9',
          amount: REFERRAL_REWARDS.REFERRER,
          balanceAfter: 12,
          metadata: expect.objectContaining({
            source: 'referral_reward',
            refereeId: 'referee-9',
          }),
        }),
      })
    );

    expect(testMocks.mockCreditTransactionCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'referee-9',
          amount: REFERRAL_REWARDS.REFEREE,
          balanceAfter: 5,
          metadata: expect.objectContaining({
            source: 'referral_bonus',
            referrerId: 'referrer-9',
          }),
        }),
      })
    );

    expect(testMocks.mockReferralHistoryUpdate).toHaveBeenCalledWith({
      where: { id: 'history-777' },
      data: { status: ReferralStatus.GRANTED },
    });
    expect(testMocks.mockDbTransaction).toHaveBeenCalledTimes(1);
  });
});
