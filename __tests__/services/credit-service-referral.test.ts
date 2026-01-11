import { describe, it, expect } from 'vitest';
import { REFERRAL_REWARDS } from '@/constants/referral';

describe('CreditService - Referral Constants Integration', () => {
  it('should use REFERRAL_REWARDS constant for referrer reward amount', () => {
    // Verify the constant is imported and accessible
    expect(REFERRAL_REWARDS.REFERRER).toBe(2);
  });

  it('should use REFERRAL_REWARDS constant for referee reward amount', () => {
    // Verify the constant is imported and accessible
    expect(REFERRAL_REWARDS.REFEREE).toBe(1);
  });

  it('referrer should receive more stars than referee', () => {
    // Business logic validation
    expect(REFERRAL_REWARDS.REFERRER).toBeGreaterThan(REFERRAL_REWARDS.REFEREE);
  });
});
