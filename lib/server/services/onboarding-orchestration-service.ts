import { db } from '@/lib/server/db';
import { CreditService } from '@/services/credit-service';
import { referralService } from '@/lib/server/services/referral-service';
import { ReferralSource } from '@/constants/referral';

type CompleteOnboardingInput = {
  userId: string;
  referralCodeFromCookie?: string;
  ipAddress?: string;
};

type CompleteOnboardingResult =
  | { status: 'already_completed'; reward: 0 }
  | { status: 'completed'; reward: 1 };

export const onboardingOrchestrationService = {
  async completeOnboarding(input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
    const ipAddress = input.ipAddress ?? 'unknown';

    let currentUser = await db.user.findUnique({
      where: { id: input.userId },
      select: { onboardingCompleted: true, referredById: true },
    });

    if (currentUser?.onboardingCompleted) {
      return { status: 'already_completed', reward: 0 };
    }

    if (!currentUser?.referredById && input.referralCodeFromCookie) {
      await referralService.processReferralSignup(
        { id: input.userId } as any,
        input.referralCodeFromCookie,
        ipAddress,
        { source: ReferralSource.LINK }
      );

      const healedUser = await db.user.findUnique({
        where: { id: input.userId },
        select: { referredById: true },
      });

      if (healedUser?.referredById) {
        currentUser = currentUser
          ? { ...currentUser, referredById: healedUser.referredById }
          : { onboardingCompleted: false, referredById: healedUser.referredById };
      }
    }

    const result = await db.$transaction(async (tx) => {
      const updateResult = await tx.user.updateMany({
        where: {
          id: input.userId,
          onboardingCompleted: false,
        },
        data: { onboardingCompleted: true },
      });

      if (updateResult.count === 0) {
        return { completed: false };
      }

      await CreditService.grantOnboardingBonus(input.userId, tx);
      return { completed: true };
    });

    if (!result.completed) {
      return { status: 'already_completed', reward: 0 };
    }

    return { status: 'completed', reward: 1 };
  },
};
