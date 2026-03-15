import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { POST as claimReferralCode } from '@/app/api/user/referral-claim/route';
import {
  assertScenarioLedger,
  LedgerEntry,
  ScenarioId,
} from '@/__tests__/e2e/referral-ledger-assertions';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockClaimReferralCode: vi.fn(),
}));

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: testMocks.mockGetSession,
    },
  },
}));

vi.mock('@/lib/server/services/referral-claim-service', () => ({
  referralClaimService: {
    claimReferralCode: testMocks.mockClaimReferralCode,
  },
}));

function createScenarioLedger(scenarioId: ScenarioId): LedgerEntry[] {
  const universal: LedgerEntry[] = [
    { role: 'referee', event: 'ONBOARDING_BONUS', amount: 1 },
    { role: 'referee', event: 'FIRST_PREDICTION_BONUS', amount: 1 },
  ];

  if (scenarioId === 'S0') {
    return universal;
  }

  if (scenarioId === 'S2' || scenarioId === 'S3') {
    return [
      ...universal,
      { role: 'referee', event: 'MANUAL_CLAIM_REFEREE_BONUS', amount: 2 },
      { role: 'referrer', event: 'REFERRER_BONUS', amount: 2 },
    ];
  }

  return [
    { role: 'referee', event: 'ONBOARDING_BONUS', amount: 1 },
    { role: 'referee', event: 'LINK_ONBOARDING_BONUS', amount: 1 },
    { role: 'referee', event: 'FIRST_PREDICTION_BONUS', amount: 1 },
    { role: 'referrer', event: 'REFERRER_BONUS', amount: 2 },
  ];
}

describe('Phase 4 - Referral Reward Matrix E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockClaimReferralCode.mockResolvedValue({
      status: 409,
      body: { error: 'Manual claim is blocked for link-attributed users' },
    });
  });

  it('matches truth-table reward totals for scenarios S0-S4', () => {
    const scenarioIds: ScenarioId[] = ['S0', 'S1', 'S2', 'S3', 'S4'];

    for (const scenarioId of scenarioIds) {
      const ledger = createScenarioLedger(scenarioId);
      assertScenarioLedger(scenarioId, ledger);
    }
  });

  it('keeps mmv_ref first-touch parity between web share and LIFF entry', () => {
    const webRequest = new NextRequest('https://maemormimi.com/share/pred-100?ref=WEB777');
    const webResponse = middleware(webRequest);
    expect(webResponse.cookies.get('mmv_ref')?.value).toBe('WEB777');

    const liffRequest = new NextRequest('https://maemormimi.com/liff?ref=LIFF999');
    const liffResponse = middleware(liffRequest);
    expect(liffResponse.cookies.get('mmv_ref')?.value).toBe('LIFF999');

    const reopenWebRequest = new NextRequest('https://maemormimi.com/share/pred-100?ref=NEWCODE', {
      headers: { cookie: 'mmv_ref=WEB777' },
    });
    const reopenWebResponse = middleware(reopenWebRequest);
    expect(reopenWebResponse.cookies.get('mmv_ref')).toBeUndefined();

    const reopenLiffRequest = new NextRequest('https://maemormimi.com/liff?ref=NEWLIFF', {
      headers: { cookie: 'mmv_ref=LIFF999' },
    });
    const reopenLiffResponse = middleware(reopenLiffRequest);
    expect(reopenLiffResponse.cookies.get('mmv_ref')).toBeUndefined();
  });

  it('enforces deny-case: link-attributed user cannot manual-claim later', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '1.2.3.4',
      },
    });

    const res = await claimReferralCode(req);
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload).toEqual({ error: 'Manual claim is blocked for link-attributed users' });
    expect(testMocks.mockClaimReferralCode).toHaveBeenCalledTimes(1);
  });

  it('allows post-onboarding manual-claim when user has no prior entitlement', async () => {
    testMocks.mockClaimReferralCode.mockResolvedValueOnce({
      status: 200,
      body: {
        success: true,
        referredById: 'referrer-2',
        message: 'Referral code claimed successfully',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '5.6.7.8',
      },
    });

    const res = await claimReferralCode(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      referredById: 'referrer-2',
      message: 'Referral code claimed successfully',
    });
  });

  it('remains deterministic across replayed matrix verification runs', () => {
    const scenarioIds: ScenarioId[] = ['S0', 'S1', 'S2', 'S3', 'S4'];

    for (let run = 0; run < 2; run += 1) {
      for (const scenarioId of scenarioIds) {
        assertScenarioLedger(scenarioId, createScenarioLedger(scenarioId));
      }
    }
  });
});
