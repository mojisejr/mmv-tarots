import { REWARD_POLICY_EVENTS, REFERRAL_REWARDS } from '@/constants/referral';
import { db } from '@/lib/server/db';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { referralService } from '@/lib/server/services/referral-service';
import {
  captureReferralException,
  emitReferralEvent,
} from '@/lib/server/referral-observability';

function isRewardEngineDisabled(): boolean {
  const raw = process.env.MMV_REFERRAL_REWARD_ENGINE_DISABLED;
  return raw === '1' || raw === 'true';
}

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
        emitReferralEvent('first_prediction_bonus.skipped_idempotent', {
          userId,
          externalRef,
        });
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

      emitReferralEvent('first_prediction_bonus.granted', {
        userId,
        externalRef,
        amount: REFERRAL_REWARDS.FIRST_PREDICTION,
        balanceAfter: newBalance,
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      emitReferralEvent('first_prediction_bonus.skipped_unique_constraint', {
        userId,
        externalRef,
      });
      return;
    }

    captureReferralException('first_prediction_bonus', error, { userId, externalRef });
    throw error;
  }
}

export const firstPredictionRewardService = {
  async processFirstSuccessfulPrediction(userId: string): Promise<void> {
    if (isRewardEngineDisabled()) {
      emitReferralEvent('reward_engine.disabled', {
        userId,
        gate: 'MMV_REFERRAL_REWARD_ENGINE_DISABLED',
      });
      return;
    }

    await grantFirstPredictionBonus(userId);
    await referralService.grantReferralReward(userId);

    emitReferralEvent('first_prediction_reward_flow.completed', {
      userId,
    });
  },
};
