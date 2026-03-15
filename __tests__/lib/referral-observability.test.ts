import { describe, expect, it } from 'vitest';
import { detectReferralRewardAnomalies } from '@/lib/server/referral-observability';

describe('referral observability anomaly detector', () => {
  it('returns no anomalies for contract-compliant LINK payout', () => {
    const anomalies = detectReferralRewardAnomalies({
      referralHistoryId: 'history-link',
      refereeId: 'referee-1',
      referrerId: 'referrer-1',
      source: 'LINK',
      referrerReward: 2,
      refereeReward: 0,
    });

    expect(anomalies).toEqual([]);
  });

  it('flags impossible combo when LINK source receives manual referee bonus', () => {
    const anomalies = detectReferralRewardAnomalies({
      referralHistoryId: 'history-link-bad',
      refereeId: 'referee-2',
      referrerId: 'referrer-2',
      source: 'LINK',
      referrerReward: 2,
      refereeReward: 2,
    });

    expect(anomalies.map((item) => item.code)).toContain('MANUAL_BONUS_ON_LINK_SOURCE');
  });

  it('flags invalid payout shapes including missing referrer bonus', () => {
    const anomalies = detectReferralRewardAnomalies({
      referralHistoryId: 'history-bad-shape',
      refereeId: 'referee-3',
      referrerId: 'referrer-3',
      source: 'MANUAL_CODE',
      referrerReward: 0,
      refereeReward: 2,
    });

    const anomalyCodes = anomalies.map((item) => item.code);
    expect(anomalyCodes).toContain('MANUAL_BONUS_WITHOUT_REFERRER');
    expect(anomalyCodes).toContain('REFERRER_BONUS_MISMATCH');
  });
});
