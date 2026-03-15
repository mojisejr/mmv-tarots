import { beforeEach, describe, expect, it, vi } from 'vitest';

const testMocks = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockReferralHistoryFindFirst: vi.fn(),
  mockProcessReferralSignup: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    user: {
      findUnique: testMocks.mockUserFindUnique,
    },
    referralHistory: {
      findFirst: testMocks.mockReferralHistoryFindFirst,
    },
  },
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    processReferralSignup: testMocks.mockProcessReferralSignup,
  },
}));

import { referralClaimService } from '@/lib/server/services/referral-claim-service';
import { ReferralSource } from '@/constants/referral';

describe('referralClaimService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockReferralHistoryFindFirst.mockResolvedValue(null);

    testMocks.mockUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'SELF123',
        referredById: null,
        onboardingCompleted: false,
      })
      .mockResolvedValueOnce({ id: 'referrer-2' })
      .mockResolvedValueOnce({ referredById: 'referrer-2' });
  });

  it('rejects manual claim when user already consumed link attribution', async () => {
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue({
      source: ReferralSource.LINK,
      status: 'PENDING',
      eligibilityState: 'PENDING_FIRST_PREDICTION',
    });

    const result = await referralClaimService.claimReferralCode({
      userId: 'user-1',
      code: 'FRIEND777',
      ipAddress: '1.2.3.4',
    });

    expect(result).toEqual({
      status: 409,
      body: { error: 'Manual claim is blocked for link-attributed users' },
    });
    expect(testMocks.mockProcessReferralSignup).not.toHaveBeenCalled();
  });

  it('rejects when referral entitlement already exists', async () => {
    testMocks.mockReferralHistoryFindFirst.mockResolvedValue({
      source: ReferralSource.MANUAL_CODE,
      status: 'PENDING',
      eligibilityState: 'PENDING_FIRST_PREDICTION',
    });

    const result = await referralClaimService.claimReferralCode({
      userId: 'user-1',
      code: 'FRIEND777',
      ipAddress: '1.2.3.4',
    });

    expect(result).toEqual({
      status: 409,
      body: { error: 'Referral already claimed' },
    });
    expect(testMocks.mockProcessReferralSignup).not.toHaveBeenCalled();
  });

  it('claims code successfully for eligible non-link user', async () => {
    testMocks.mockUserFindUnique.mockReset();
    testMocks.mockUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'SELF123',
        referredById: null,
        onboardingCompleted: false,
      })
      .mockResolvedValueOnce({ id: 'referrer-2' })
      .mockResolvedValueOnce({ referredById: 'referrer-2' });

    testMocks.mockReferralHistoryFindFirst.mockResolvedValue(null);

    const result = await referralClaimService.claimReferralCode({
      userId: 'user-1',
      code: 'FRIEND777',
      ipAddress: '1.2.3.4',
    });

    expect(result).toEqual({
      status: 200,
      body: {
        success: true,
        referredById: 'referrer-2',
        message: 'Referral code claimed successfully',
      },
    });
    expect(testMocks.mockProcessReferralSignup).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'FRIEND777',
      '1.2.3.4',
      { source: ReferralSource.MANUAL_CODE }
    );
  });
});
