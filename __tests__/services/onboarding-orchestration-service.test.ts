import { beforeEach, describe, expect, it, vi } from 'vitest';

const testMocks = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockGrantOnboardingBonus: vi.fn(),
  mockProcessReferralSignup: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    user: {
      findUnique: testMocks.mockUserFindUnique,
    },
    $transaction: testMocks.mockDbTransaction,
  },
}));

vi.mock('@/services/credit-service', () => ({
  CreditService: {
    grantOnboardingBonus: testMocks.mockGrantOnboardingBonus,
  },
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    processReferralSignup: testMocks.mockProcessReferralSignup,
  },
}));

import { onboardingOrchestrationService } from '@/lib/server/services/onboarding-orchestration-service';
import { ReferralSource } from '@/constants/referral';

describe('onboardingOrchestrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockUserFindUnique.mockResolvedValue({
      onboardingCompleted: false,
      referredById: null,
    });

    testMocks.mockDbTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        user: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });
  });

  it('returns already_completed when onboarding was already done', async () => {
    testMocks.mockUserFindUnique.mockResolvedValue({
      onboardingCompleted: true,
      referredById: null,
    });

    const result = await onboardingOrchestrationService.completeOnboarding({
      userId: 'user-1',
    });

    expect(result).toEqual({ status: 'already_completed', reward: 0 });
    expect(testMocks.mockDbTransaction).not.toHaveBeenCalled();
  });

  it('grants onboarding bonus once and returns completed reward', async () => {
    const result = await onboardingOrchestrationService.completeOnboarding({
      userId: 'user-1',
      ipAddress: '1.2.3.4',
    });

    expect(result).toEqual({ status: 'completed', reward: 1 });
    expect(testMocks.mockGrantOnboardingBonus).toHaveBeenCalledTimes(1);
  });

  it('attempts link self-healing from cookie context before completing onboarding', async () => {
    testMocks.mockUserFindUnique
      .mockResolvedValueOnce({ onboardingCompleted: false, referredById: null })
      .mockResolvedValueOnce({ referredById: 'referrer-healed' });

    await onboardingOrchestrationService.completeOnboarding({
      userId: 'user-1',
      referralCodeFromCookie: 'FRIEND777',
      ipAddress: '2.3.4.5',
    });

    expect(testMocks.mockProcessReferralSignup).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'FRIEND777',
      '2.3.4.5',
      { source: ReferralSource.LINK }
    );
  });

  it('returns already_completed when transaction lock update count is zero', async () => {
    testMocks.mockDbTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        user: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return callback(tx);
    });

    const result = await onboardingOrchestrationService.completeOnboarding({
      userId: 'user-1',
    });

    expect(result).toEqual({ status: 'already_completed', reward: 0 });
    expect(testMocks.mockGrantOnboardingBonus).not.toHaveBeenCalled();
  });
});
