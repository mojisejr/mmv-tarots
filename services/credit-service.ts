import { db } from '@/lib/server/db';

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
   * Deduct 1 star from user's balance
   * Should be called only when prediction is successfully completed
   */
  async deductStar(userId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });

      if (!user || user.stars < 1) {
        throw new Error('Insufficient stars');
      }

      await tx.user.update({
        where: { id: userId },
        data: { stars: { decrement: 1 } },
      });
    });
  },

  /**
   * Add stars to user's balance
   * Used for package purchases
   */
  async addStars(userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    await db.user.update({
      where: { id: userId },
      data: { stars: { increment: amount } },
    });
  },
};
