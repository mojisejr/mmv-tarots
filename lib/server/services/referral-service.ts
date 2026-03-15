import { db } from '../db';
import {
  REFERRAL_REWARDS,
  ReferralEligibilityState,
  ReferralSource,
  ReferralStatus,
} from '@/constants/referral';
import { User, TransactionType, TransactionStatus } from '@prisma/client';

export const referralService = {
  async processReferralSignup(
    user: User,
    referralCode?: string,
    ipAddress: string = 'unknown',
    options?: { source?: ReferralSource }
  ) {
    if (!referralCode) {
      // Just record IP
      await db.user.update({
        where: { id: user.id },
        data: { signupIp: ipAddress },
      });
      return;
    }

    const referrer = await db.user.findUnique({
      where: { referralCode },
    });

    if (!referrer || referrer.id === user.id) {
      // Invalid referral code or self-referral
      await db.user.update({
        where: { id: user.id },
        data: { signupIp: ipAddress },
      });
      return;
    }

    // Check for existing referrals from same IP (Simple anti-fraud check)
    const existingReferralsFromIp = await db.referralHistory.count({
      where: {
        referrerId: referrer.id,
        ipAddress: ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Idempotency: Check if this user has already been processed for referral (Prevent double recording)
    const existingHistory = await db.referralHistory.findFirst({
        where: { refereeId: user.id }
    });

    if (existingHistory) {
        // Already recorded, skip to prevent duplicate logic
        return; 
    }

    const isSuspicious = existingReferralsFromIp >= 3; // Limit 3 referrals per IP per day
    const initialStatus = isSuspicious ? ReferralStatus.BLOCKED : ReferralStatus.PENDING;
    const initialEligibilityState = isSuspicious
      ? ReferralEligibilityState.BLOCKED
      : ReferralEligibilityState.PENDING_FIRST_PREDICTION;
    const source = options?.source ?? ReferralSource.LINK;

    // Phase 2: Record Intent ONLY (No reward granting here)
    // We just link the user and create the history record.
    // The actual reward for the referee will be granted at the Ritual Gate (Onboarding API).
    await db.$transaction([
      // Link user to referrer
      db.user.update({
        where: { id: user.id },
        data: { 
          referredById: referrer.id,
          signupIp: ipAddress,
        },
      }),
      // Create History Log
      db.referralHistory.create({
        data: {
          referrerId: referrer.id,
          refereeId: user.id,
          ipAddress: ipAddress,
          status: initialStatus,
          source,
          eligibilityState: initialEligibilityState,
          // Calculate expected reward but don't give it yet
          rewardAmount: REFERRAL_REWARDS.REFERRER, 
        },
      }),
    ]);
  },

  async grantReferralReward(refereeId: string) {
    const history = await db.referralHistory.findFirst({
      where: { 
        refereeId, 
        status: ReferralStatus.PENDING 
      },
      include: { referrer: true, referee: true },
    });

    if (!history) return;

    await db.$transaction([
      // 1. Give stars to Referrer
      db.user.update({
        where: { id: history.referrerId },
        data: { stars: { increment: REFERRAL_REWARDS.REFERRER } },
      }),
      // Create Transaction Log for Referrer
      db.creditTransaction.create({
        data: {
          userId: history.referrerId,
          amount: REFERRAL_REWARDS.REFERRER,
          balanceAfter: history.referrer.stars + REFERRAL_REWARDS.REFERRER,
          type: TransactionType.TOPUP,
          status: TransactionStatus.SUCCESS,
          metadata: {
            source: 'referral_reward',
            refereeId: history.refereeId,
            note: 'Reward for referring a new user (first usage)',
          },
        },
      }),

      // 2. Give stars to Referee (Bonus)
      db.user.update({
        where: { id: history.refereeId },
        data: { stars: { increment: REFERRAL_REWARDS.REFEREE } },
      }),
      // Create Transaction Log for Referee
      db.creditTransaction.create({
        data: {
          userId: history.refereeId,
          amount: REFERRAL_REWARDS.REFEREE,
          balanceAfter: history.referee.stars + REFERRAL_REWARDS.REFEREE,
          type: TransactionType.TOPUP,
          status: TransactionStatus.SUCCESS,
          metadata: {
            source: 'referral_bonus',
            referrerId: history.referrerId,
            note: 'Welcome bonus for using referral link (first usage)',
          },
        },
      }),

      // 3. Update History Status
      db.referralHistory.update({
        where: { id: history.id },
        data: {
          status: ReferralStatus.GRANTED,
          eligibilityState: ReferralEligibilityState.GRANTED,
        },
      }),
    ]);
  }
};
