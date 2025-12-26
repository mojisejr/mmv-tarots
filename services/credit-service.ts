import { db } from '@/lib/server/db';
import { TransactionType, TransactionStatus } from '@prisma/client';

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
   * Apply referral rewards to both referrer and referee
   * Referrer gets 2 stars, Referee gets 1 star
   * This is an atomic operation - both succeed or both fail
   */
  async applyReferralReward(referralCode: string, newUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await db.$transaction(async (tx) => {
        // Find the referrer by referral code
        const referrer = await tx.user.findUnique({
          where: { referralCode },
          select: { id: true, stars: true, name: true },
        });

        if (!referrer) {
          return { success: false, message: 'Invalid referral code' };
        }

        // Check if trying to refer themselves
        if (referrer.id === newUserId) {
          return { success: false, message: 'Cannot refer yourself' };
        }

        // Check if the new user has already been referred
        const newUser = await tx.user.findUnique({
          where: { id: newUserId },
          select: { referredById: true, stars: true },
        });

        if (!newUser) {
          return { success: false, message: 'User not found' };
        }

        if (newUser.referredById) {
          return { success: false, message: 'User has already been referred' };
        }

        // Update the new user's referredById
        await tx.user.update({
          where: { id: newUserId },
          data: { referredById: referrer.id },
        });

        // Give 2 stars to referrer
        const referrerNewBalance = referrer.stars + 2;
        await tx.user.update({
          where: { id: referrer.id },
          data: { stars: referrerNewBalance },
        });

        await tx.creditTransaction.create({
          data: {
            userId: referrer.id,
            amount: 2,
            balanceAfter: referrerNewBalance,
            type: TransactionType.TOPUP,
            status: TransactionStatus.SUCCESS,
            metadata: {
              source: 'referral_reward',
              refereeId: newUserId,
              note: 'Reward for referring a new user',
            },
          },
        });

        // Give 1 star to new user
        const refereeNewBalance = newUser.stars + 1;
        await tx.user.update({
          where: { id: newUserId },
          data: { stars: refereeNewBalance },
        });

        await tx.creditTransaction.create({
          data: {
            userId: newUserId,
            amount: 1,
            balanceAfter: refereeNewBalance,
            type: TransactionType.TOPUP,
            status: TransactionStatus.SUCCESS,
            metadata: {
              source: 'referral_bonus',
              referrerId: referrer.id,
              note: 'Welcome bonus for using referral link',
            },
          },
        });

        return { success: true, message: 'Referral rewards applied successfully' };
      });

      return result;
    } catch (error) {
      console.error('Error applying referral reward:', error);
      return { success: false, message: 'Failed to apply referral reward' };
    }
  }
};
