import { db } from '@/lib/server/db';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { REFERRAL_REWARDS } from '@/constants/referral';
import { referralService } from '@/lib/server/services/referral-service';

export const CreditService = {
  /**
   * Get user's current star balance
   */
  async getUserStars(userId: string): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stars: true },
    });
    return user?.stars ?? 0;
  },

  /**
   * Check if user has enough stars for a prediction
   */
  async hasEnoughStars(userId: string): Promise<boolean> {
    const stars = await this.getUserStars(userId);
    return stars > 0;
  },

  /**
   * Deduct 1 star from user's balance with transaction log
   * Should be called only when prediction is successfully completed
   */
  async deductStar(userId: string, metadata?: any): Promise<void> {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });

      if (!user || user.stars < 1) {
        throw new Error('Insufficient stars');
      }

      const newBalance = user.stars - 1;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -1,
          balanceAfter: newBalance,
          type: TransactionType.PREDICTION,
          status: TransactionStatus.SUCCESS,
          metadata: metadata ?? {},
        },
      });
    });
  },

  /**
   * Add stars to user's balance with transaction log
   * Used for package purchases
   */
  async addStars(userId: string, amount: number, metadata?: any): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.TOPUP,
          status: TransactionStatus.SUCCESS,
          stripeSessionId: metadata?.stripeSessionId ?? null,
          metadata: metadata ?? {},
        },
      });
    });
  },

  /**
   * Refund stars to user with transaction log
   * Used when system error occurs after deduction
   */
  async refundStar(userId: string, amount: number, reason: string, metadata?: any): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.REFUND,
          status: TransactionStatus.SUCCESS,
          metadata: { ...metadata, reason },
        },
      });
    });
  },

  /**
   * Grant base onboarding stars to new user (Universal)
   */
  async grantOnboardingBonus(userId: string): Promise<void> {
    const amount = REFERRAL_REWARDS.ONBOARDING;
    
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.ONBOARDING,
          status: TransactionStatus.SUCCESS,
          metadata: {
            note: 'Welcome bonus for new user',
          },
        },
      });
    });
  },

  /**
   * Grant bonus stars for signing up with referral (Referral Entry Bonus)
   */
  async grantReferralEntryBonus(userId: string, referrerId: string): Promise<void> {
    const amount = REFERRAL_REWARDS.REFEREE;

    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await tx.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.REFERRAL,
          status: TransactionStatus.SUCCESS,
          metadata: {
            referrerId,
            note: 'Bonus for signing up via referral link',
          },
        },
      });
    });
  },

  /**
   * Get transaction history for a user
   */
  async getHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      db.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.creditTransaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Apply referral rewards (Robust Version)
   * This method now uses the referralService to ensure anti-fraud and delayed rewards.
   * Rewards are no longer granted immediately but are marked as PENDING until first usage.
   */
  async applyReferralReward(referralCode: string, newUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await db.user.findUnique({ where: { id: newUserId } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check if already referred to avoid duplicate processing
      if (user.referredById) {
        return { success: false, message: 'User already referred' };
      }

      await referralService.processReferralSignup(user, referralCode, 'unknown');
      
      return { 
        success: true, 
        message: 'Referral processed. Rewards will be granted after the first prediction.' 
      };
    } catch (error) {
      console.error('Error applying referral reward:', error);
      return { success: false, message: 'Failed to process referral' };
    }
  }
};
