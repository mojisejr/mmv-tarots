import { describe, expect, it } from 'vitest';
import {
  ReferralEligibilityState,
  ReferralSource,
  ReferralStatus,
} from '@/constants/referral';
import { derivePhase1Backfill } from '@/lib/server/referral/referral-phase1-domain';

describe('Phase 1 referral legacy backfill mapping', () => {
  it('maps legacy link referral to LINK + pending-first-prediction by default', () => {
    const result = derivePhase1Backfill({
      status: ReferralStatus.PENDING,
      referredById: 'referrer-1',
    });

    expect(result).toEqual({
      source: ReferralSource.LINK,
      eligibilityState: ReferralEligibilityState.PENDING_FIRST_PREDICTION,
      requiresManualReview: false,
    });
  });

  it('maps claim-audited rows to MANUAL_CODE deterministically', () => {
    const result = derivePhase1Backfill({
      status: ReferralStatus.PENDING,
      createdViaClaim: true,
    });

    expect(result).toEqual({
      source: ReferralSource.MANUAL_CODE,
      eligibilityState: ReferralEligibilityState.PENDING_FIRST_PREDICTION,
      requiresManualReview: false,
    });
  });

  it('maps granted and blocked statuses to new eligibility states', () => {
    const granted = derivePhase1Backfill({
      status: ReferralStatus.GRANTED,
      referredById: 'referrer-1',
    });

    const blocked = derivePhase1Backfill({
      status: ReferralStatus.BLOCKED,
      referredById: 'referrer-1',
    });

    expect(granted.eligibilityState).toBe(ReferralEligibilityState.GRANTED);
    expect(blocked.eligibilityState).toBe(ReferralEligibilityState.BLOCKED);
  });

  it('marks unknown legacy rows for manual review', () => {
    const result = derivePhase1Backfill({
      status: ReferralStatus.PENDING,
      referredById: null,
      createdViaClaim: false,
    });

    expect(result).toEqual({
      source: null,
      eligibilityState: ReferralEligibilityState.PENDING_FIRST_PREDICTION,
      requiresManualReview: true,
    });
  });

  it('respects explicit source value when already present', () => {
    const result = derivePhase1Backfill({
      source: ReferralSource.MANUAL_CODE,
      status: ReferralStatus.GRANTED,
      referredById: 'referrer-1',
    });

    expect(result).toEqual({
      source: ReferralSource.MANUAL_CODE,
      eligibilityState: ReferralEligibilityState.GRANTED,
      requiresManualReview: false,
    });
  });
});
