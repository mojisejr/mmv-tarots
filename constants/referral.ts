export const REFERRAL_REWARDS = {
  REFERRER: 2,
  REFEREE: 1,
} as const;

export enum ReferralStatus {
  PENDING = 'PENDING', // Joined via link, but not verified usage
  GRANTED = 'GRANTED', // Reward distributed
  BLOCKED = 'BLOCKED', // Suspected fraud
}
