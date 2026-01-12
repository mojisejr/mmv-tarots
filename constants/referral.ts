/**
 * Referral system constants
 * These values define the reward amounts for the referral program
 */
export const REFERRAL_REWARDS = {
  /** Number of stars the referrer receives when someone uses their referral code (Delayed) */
  REFERRER: 2,
  /** Number of stars the referee receives when they sign up with a referral code (Bonus) */
  REFEREE: 1,
  /** Base number of stars every new user receives (Onboarding) */
  ONBOARDING: 1,
} as const;

export enum ReferralStatus {
  /** Joined via link, but not verified usage */
  PENDING = 'PENDING',
  /** Reward distributed after first prediction */
  GRANTED = 'GRANTED',
  /** Suspected fraud - reward blocked */
  BLOCKED = 'BLOCKED',
}
