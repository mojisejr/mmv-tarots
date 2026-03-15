import { REWARD_POLICY_EVENTS, REFERRAL_REWARDS } from '@/constants/referral';
import { db } from '@/lib/server/db';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { referralService } from '@/lib/server/services/referral-service';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

async function grantFirstPredictionBonus(userId: string): Promise<void> {
  const externalRef = `first_prediction_bonus:${userId}`;

  try {
    await db.$transaction(async (tx) => {
      const alreadyGranted = await tx.creditTransaction.findUnique({
        where: { externalRef },
        select: { id: true },
      });

      if (alreadyGranted) {
        return;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });

      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + REFERRAL_REWARDS.FIRST_PREDICTION;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: REFERRAL_REWARDS.FIRST_PREDICTION,
          balanceAfter: newBalance,
          type: TransactionType.TOPUP,
          status: TransactionStatus.SUCCESS,
          externalRef,
          metadata: {
            event: REWARD_POLICY_EVENTS.FIRST_PREDICTION_BONUS,
            source: 'first_prediction_reward_engine',
            note: 'Universal first successful prediction bonus',
          },
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return;
    }

    throw error;
  }
}

export const firstPredictionRewardService = {
  async processFirstSuccessfulPrediction(userId: string): Promise<void> {
    await grantFirstPredictionBonus(userId);
    await referralService.grantReferralReward(userId);
  },
};
