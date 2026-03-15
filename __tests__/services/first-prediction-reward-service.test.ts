import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERRAL_REWARDS, REWARD_POLICY_EVENTS } from '@/constants/referral';

const testMocks = vi.hoisted(() => ({
  mockDbTransaction: vi.fn(),
  mockCreditFindUnique: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockCreditCreate: vi.fn(),
  mockGrantReferralReward: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    $transaction: testMocks.mockDbTransaction,
  },
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    grantReferralReward: testMocks.mockGrantReferralReward,
  },
}));

import { firstPredictionRewardService } from '@/lib/server/services/first-prediction-reward-service';

describe('firstPredictionRewardService', () => {
  const previousKillSwitch = process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED;

    testMocks.mockDbTransaction.mockImplementation(async (cb: any) =>
      cb({
        creditTransaction: {
          findUnique: testMocks.mockCreditFindUnique,
          create: testMocks.mockCreditCreate,
        },
        user: {
          findUnique: testMocks.mockUserFindUnique,
          update: testMocks.mockUserUpdate,
        },
      })
    );

    testMocks.mockCreditFindUnique.mockResolvedValue(null);
    testMocks.mockUserFindUnique.mockResolvedValue({ stars: 5 });
    testMocks.mockUserUpdate.mockResolvedValue({});
    testMocks.mockCreditCreate.mockResolvedValue({});
    testMocks.mockGrantReferralReward.mockResolvedValue(undefined);
  });

  afterAll(() => {
    if (previousKillSwitch === undefined) {
      delete process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED;
      return;
    }

    process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED = previousKillSwitch;
  });

  it('grants universal first prediction bonus once and then triggers referral payout flow', async () => {
    await firstPredictionRewardService.processFirstSuccessfulPrediction('user-1');

    expect(testMocks.mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { stars: 6 },
    });

    expect(testMocks.mockCreditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        amount: REFERRAL_REWARDS.FIRST_PREDICTION,
        balanceAfter: 6,
        externalRef: 'first_prediction_bonus:user-1',
        metadata: expect.objectContaining({
          event: REWARD_POLICY_EVENTS.FIRST_PREDICTION_BONUS,
        }),
      }),
    });

    expect(testMocks.mockGrantReferralReward).toHaveBeenCalledWith('user-1');
  });

  it('is idempotent for universal first prediction bonus and still evaluates referral payout', async () => {
    testMocks.mockCreditFindUnique.mockResolvedValue({ id: 'existing-first-prediction-tx' });

    await firstPredictionRewardService.processFirstSuccessfulPrediction('user-1');

    expect(testMocks.mockUserUpdate).not.toHaveBeenCalled();
    expect(testMocks.mockCreditCreate).not.toHaveBeenCalled();
    expect(testMocks.mockGrantReferralReward).toHaveBeenCalledWith('user-1');
  });

  it('skips reward engine when kill-switch is enabled', async () => {
    process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED = '1';

    await firstPredictionRewardService.processFirstSuccessfulPrediction('user-1');

    expect(testMocks.mockDbTransaction).not.toHaveBeenCalled();
    expect(testMocks.mockGrantReferralReward).not.toHaveBeenCalled();
  });
});
