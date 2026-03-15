import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERRAL_REWARDS } from '@/constants/referral';

const testMocks = vi.hoisted(() => ({
  mockDbTransaction: vi.fn(),
  mockReferralProcessSignup: vi.fn(),
}));

const txMocks = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockCreditFindFirst: vi.fn(),
  mockCreditCreate: vi.fn(),
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    processReferralSignup: testMocks.mockReferralProcessSignup,
  },
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    $transaction: testMocks.mockDbTransaction,
  },
}));

import { CreditService } from '@/services/credit-service';

describe('CreditService phase 2 idempotency and ledger contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    txMocks.mockUserFindUnique.mockResolvedValue({ stars: 5 });
    txMocks.mockUserUpdate.mockResolvedValue({});
    txMocks.mockCreditFindFirst.mockResolvedValue(null);
    txMocks.mockCreditCreate.mockResolvedValue({});

    testMocks.mockDbTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        user: {
          findUnique: txMocks.mockUserFindUnique,
          update: txMocks.mockUserUpdate,
        },
        creditTransaction: {
          findFirst: txMocks.mockCreditFindFirst,
          create: txMocks.mockCreditCreate,
        },
      };
      return callback(tx);
    });
  });

  it('grantOnboardingBonus is idempotent when ONBOARDING transaction already exists', async () => {
    txMocks.mockCreditFindFirst.mockResolvedValue({ id: 'existing-onboarding' });

    await CreditService.grantOnboardingBonus('user-1');

    expect(txMocks.mockUserUpdate).not.toHaveBeenCalled();
    expect(txMocks.mockCreditCreate).not.toHaveBeenCalled();
  });

  it('grantOnboardingBonus writes deterministic amount and balanceAfter', async () => {
    await CreditService.grantOnboardingBonus('user-1');

    expect(txMocks.mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { stars: 5 + REFERRAL_REWARDS.ONBOARDING },
    });

    expect(txMocks.mockCreditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        amount: REFERRAL_REWARDS.ONBOARDING,
        balanceAfter: 5 + REFERRAL_REWARDS.ONBOARDING,
        type: 'ONBOARDING',
        metadata: expect.objectContaining({
          note: 'Welcome bonus for new user',
        }),
      }),
    });
  });

  it('grantReferralEntryBonus is idempotent when REFERRAL transaction already exists', async () => {
    txMocks.mockCreditFindFirst.mockResolvedValue({ id: 'existing-referral' });

    await CreditService.grantReferralEntryBonus('user-1', 'referrer-1');

    expect(txMocks.mockUserUpdate).not.toHaveBeenCalled();
    expect(txMocks.mockCreditCreate).not.toHaveBeenCalled();
  });

  it('grantReferralEntryBonus writes deterministic amount and metadata source linkage', async () => {
    await CreditService.grantReferralEntryBonus('user-1', 'referrer-9');

    expect(txMocks.mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { stars: 5 + REFERRAL_REWARDS.REFEREE },
    });

    expect(txMocks.mockCreditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        amount: REFERRAL_REWARDS.REFEREE,
        balanceAfter: 5 + REFERRAL_REWARDS.REFEREE,
        type: 'REFERRAL',
        metadata: expect.objectContaining({
          referrerId: 'referrer-9',
          note: 'Bonus for signing up via referral link',
        }),
      }),
    });
  });
});
