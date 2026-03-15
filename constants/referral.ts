/**
 * Referral system constants
 * These values define the reward amounts for the referral program
 */
export const REFERRAL_REWARDS = {
  /** Number of stars the referrer receives when someone uses their referral code (Delayed) */
  REFERRER: 2,
  /** Legacy referee bonus amount retained for compatibility in legacy paths */
  REFEREE: 1,
  /** Universal reward on first successful prediction */
  FIRST_PREDICTION: 1,
  /** Referee bonus for manual-code attribution at first successful prediction */
  MANUAL_CLAIM_REFEREE: 2,
  /** Base number of stars every new user receives (Onboarding) */
  ONBOARDING: 1,
} as const;

export const REWARD_POLICY_EVENTS = {
  ACCOUNT_CREATE_BONUS: 'ACCOUNT_CREATE_BONUS',
  ONBOARDING_BONUS: 'ONBOARDING_BONUS',
  LINK_ONBOARDING_BONUS: 'LINK_ONBOARDING_BONUS',
  FIRST_PREDICTION_BONUS: 'FIRST_PREDICTION_BONUS',
  REFERRER_BONUS: 'REFERRER_BONUS',
  MANUAL_CLAIM_REFEREE_BONUS: 'MANUAL_CLAIM_REFEREE_BONUS',
} as const;

export enum ReferralSource {
  LINK = 'LINK',
  MANUAL_CODE = 'MANUAL_CODE',
}

export enum ReferralEligibilityState {
  PENDING_FIRST_PREDICTION = 'PENDING_FIRST_PREDICTION',
  GRANTED = 'GRANTED',
  BLOCKED = 'BLOCKED',
  CANCELED = 'CANCELED',
}

export enum ReferralStatus {
  /** Joined via link, but not verified usage */
  PENDING = 'PENDING',
  /** Reward distributed after first prediction */
  GRANTED = 'GRANTED',
  /** Suspected fraud - reward blocked */
  BLOCKED = 'BLOCKED',
}
