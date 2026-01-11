import { describe, it, expect } from 'vitest';
import { REFERRAL_REWARDS } from '@/constants/referral';

describe('Referral Constants', () => {
  it('should have correct referral reward values', () => {
    expect(REFERRAL_REWARDS.REFERRER).toBe(2);
    expect(REFERRAL_REWARDS.REFEREE).toBe(1);
  });

  it('should be a constant object', () => {
    expect(typeof REFERRAL_REWARDS).toBe('object');
    expect(REFERRAL_REWARDS).toBeDefined();
  });

  it('should have numeric values for both rewards', () => {
    expect(typeof REFERRAL_REWARDS.REFERRER).toBe('number');
    expect(typeof REFERRAL_REWARDS.REFEREE).toBe('number');
  });

  it('should have positive values', () => {
    expect(REFERRAL_REWARDS.REFERRER).toBeGreaterThan(0);
    expect(REFERRAL_REWARDS.REFEREE).toBeGreaterThan(0);
  });
});
