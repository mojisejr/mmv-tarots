import {
  ReferralEligibilityState,
  ReferralSource,
  ReferralStatus,
} from '@/constants/referral';

export type LegacyReferralRecord = {
  status?: string | null;
  source?: ReferralSource | null;
  referredById?: string | null;
  createdViaClaim?: boolean;
};

export type Phase1BackfillResult = {
  source: ReferralSource | null;
  eligibilityState: ReferralEligibilityState;
  requiresManualReview: boolean;
};

function normalizeLegacyStatus(status?: string | null): ReferralEligibilityState {
  switch (status) {
    case ReferralStatus.GRANTED:
      return ReferralEligibilityState.GRANTED;
    case ReferralStatus.BLOCKED:
      return ReferralEligibilityState.BLOCKED;
    case ReferralEligibilityState.CANCELED:
      return ReferralEligibilityState.CANCELED;
    case ReferralStatus.PENDING:
    default:
      return ReferralEligibilityState.PENDING_FIRST_PREDICTION;
  }
}

function resolveLegacySource(record: LegacyReferralRecord): ReferralSource | null {
  if (record.source) {
    return record.source;
  }

  if (record.createdViaClaim) {
    return ReferralSource.MANUAL_CODE;
  }

  if (record.referredById) {
    return ReferralSource.LINK;
  }

  return null;
}

export function derivePhase1Backfill(record: LegacyReferralRecord): Phase1BackfillResult {
  const source = resolveLegacySource(record);

  return {
    source,
    eligibilityState: normalizeLegacyStatus(record.status),
    requiresManualReview: source === null,
  };
}
