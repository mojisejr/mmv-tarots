/**
 * Referral system constants
 * These values define the reward amounts for the referral program
 */
export const REFERRAL_REWARDS = {
  /** Number of stars the referrer receives when someone uses their referral code */
  REFERRER: 2,
  /** Number of stars the referee receives when they sign up with a referral code */
  REFEREE: 1,
} as const;
