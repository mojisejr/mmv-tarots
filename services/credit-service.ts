import { db } from '@/lib/server/db';
import { TransactionType, TransactionStatus, PaymentChannel, Prisma } from '@prisma/client';
import { REFERRAL_REWARDS } from '@/constants/referral';
import { referralService } from '@/lib/server/services/referral-service';

function resolvePaymentChannel(metadata?: Record<string, unknown>): PaymentChannel | null {
  const channel = metadata?.channel;
  if (channel === 'PROMPTPAY_QR' || channel === 'LINE_ADMIN_MANUAL' || channel === 'SYSTEM') {
    return channel;
  }

  const legacyPaymentMethod = metadata?.paymentMethod;
  if (legacyPaymentMethod === 'PROMPTPAY') {
    return PaymentChannel.PROMPTPAY_QR;
  }
  if (legacyPaymentMethod === 'CARD' || legacyPaymentMethod === 'MANUAL') {
    return PaymentChannel.SYSTEM;
  }

  return null;
}

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
  async deductStar(userId: string, metadata?: any, tx?: Prisma.TransactionClient): Promise<void> {
    const execute = async (prisma: Prisma.TransactionClient) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });

      if (!user || user.stars < 1) {
        throw new Error('Insufficient stars');
      }

      const newBalance = user.stars - 1;

      await prisma.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: -1,
          balanceAfter: newBalance,
          type: TransactionType.PREDICTION,
          status: TransactionStatus.SUCCESS,
          metadata: metadata ?? {},
        },
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await db.$transaction(execute);
    }
  },

  /**
   * Add stars to user's balance with transaction log
   * Used for package purchases
   */
  async addStars(userId: string, amount: number, metadata?: any, tx?: Prisma.TransactionClient): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const execute = async (prisma: Prisma.TransactionClient) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.TOPUP,
          status: TransactionStatus.SUCCESS,
          paymentOrderId: metadata?.paymentOrderId ?? null,
          externalRef: metadata?.externalRef ?? null,
          channel: resolvePaymentChannel(metadata),
          metadata: metadata ?? {},
        },
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await db.$transaction(execute);
    }
  },

  /**
   * Refund stars to user with transaction log
   * Used when system error occurs after deduction
   */
  async refundStar(userId: string, amount: number, reason: string, metadata?: any, tx?: Prisma.TransactionClient): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const execute = async (prisma: Prisma.TransactionClient) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: amount,
          balanceAfter: newBalance,
          type: TransactionType.REFUND,
          status: TransactionStatus.SUCCESS,
          metadata: { ...metadata, reason },
        },
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await db.$transaction(execute);
    }
  },

  /**
   * Grant base onboarding stars to new user (Universal)
   * With Idempotency Check
   */
  async grantOnboardingBonus(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const amount = REFERRAL_REWARDS.ONBOARDING;
    
    const execute = async (prisma: Prisma.TransactionClient) => {
      // Idempotency Check: Has this user already received ONBOARDING bonus?
      const existingTx = await prisma.creditTransaction.findFirst({
        where: {
          userId,
          type: TransactionType.ONBOARDING
        }
      });

      if (existingTx) {
        // Already granted, do nothing
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await prisma.creditTransaction.create({
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
    };

    if (tx) {
      await execute(tx);
    } else {
      await db.$transaction(execute);
    }
  },

  /**
   * Grant bonus stars for signing up with referral (Referral Entry Bonus)
   * With Idempotency Check
   */
  async grantReferralEntryBonus(userId: string, referrerId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const amount = REFERRAL_REWARDS.REFEREE;

    const execute = async (prisma: Prisma.TransactionClient) => {
      // Idempotency Check: Has this user already received REFERRAL bonus?
      const existingTx = await prisma.creditTransaction.findFirst({
        where: {
          userId,
          type: TransactionType.REFERRAL
        }
      });

      if (existingTx) {
        // Already granted, do nothing
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      
      const currentStars = user?.stars ?? 0;
      const newBalance = currentStars + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { stars: newBalance },
      });

      await prisma.creditTransaction.create({
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
    };

    if (tx) {
      await execute(tx);
    } else {
      await db.$transaction(execute);
    }
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
