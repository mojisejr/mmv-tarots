// lib/server/services/user-service.ts
import { db } from '@/lib/server/db';

/**
 * Marks the user's onboarding as completed.
 * @param userId The ID of the user.
 */
export async function completeOnboarding(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return await db.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
}

/**
 * Checks if the user has completed onboarding.
 * @param userId The ID of the user.
 */
export async function hasCompletedOnboarding(userId: string) {
  if (!userId) {
    return false;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  return user?.onboardingCompleted ?? false;
}
