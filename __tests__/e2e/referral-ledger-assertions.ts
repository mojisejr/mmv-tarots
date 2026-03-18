import { REFERRAL_REWARDS } from '@/constants/referral';
import { expect } from 'vitest';

export type RewardEvent =
  | 'ONBOARDING_BONUS'
  | 'LINK_ONBOARDING_BONUS'
  | 'FIRST_PREDICTION_BONUS'
  | 'REFERRER_BONUS'
  | 'MANUAL_CLAIM_REFEREE_BONUS';

export type RewardRole = 'referee' | 'referrer';

export type LedgerEntry = {
  role: RewardRole;
  event: RewardEvent;
  amount: number;
};

export type ScenarioId = 'S0' | 'S1' | 'S2' | 'S3' | 'S4';

export type ScenarioExpectation = {
  refereeTotal: number;
  referrerTotal: number;
  refereeEvents: RewardEvent[];
  referrerEvents: RewardEvent[];
};

const UNIVERSAL_REFEREE_EVENTS: RewardEvent[] = [
  'ONBOARDING_BONUS',
  'FIRST_PREDICTION_BONUS',
];

const SCENARIO_EXPECTATIONS: Record<ScenarioId, ScenarioExpectation> = {
  S0: {
    refereeTotal: 2,
    referrerTotal: 0,
    refereeEvents: UNIVERSAL_REFEREE_EVENTS,
    referrerEvents: [],
  },
  S1: {
    refereeTotal: 3,
    referrerTotal: REFERRAL_REWARDS.REFERRER,
    refereeEvents: ['ONBOARDING_BONUS', 'LINK_ONBOARDING_BONUS', 'FIRST_PREDICTION_BONUS'],
    referrerEvents: ['REFERRER_BONUS'],
  },
  S2: {
    refereeTotal: 3,
    referrerTotal: REFERRAL_REWARDS.REFERRER,
    refereeEvents: ['ONBOARDING_BONUS', 'MANUAL_CLAIM_REFEREE_BONUS'],
    referrerEvents: ['REFERRER_BONUS'],
  },
  S3: {
    refereeTotal: 3,
    referrerTotal: REFERRAL_REWARDS.REFERRER,
    refereeEvents: ['ONBOARDING_BONUS', 'MANUAL_CLAIM_REFEREE_BONUS'],
    referrerEvents: ['REFERRER_BONUS'],
  },
  S4: {
    refereeTotal: 3,
    referrerTotal: REFERRAL_REWARDS.REFERRER,
    refereeEvents: ['ONBOARDING_BONUS', 'LINK_ONBOARDING_BONUS', 'FIRST_PREDICTION_BONUS'],
    referrerEvents: ['REFERRER_BONUS'],
  },
};

function sumByRole(entries: LedgerEntry[], role: RewardRole): number {
  return entries
    .filter((entry) => entry.role === role)
    .reduce((total, entry) => total + entry.amount, 0);
}

function eventsByRole(entries: LedgerEntry[], role: RewardRole): RewardEvent[] {
  return entries
    .filter((entry) => entry.role === role)
    .map((entry) => entry.event);
}

function countEvent(entries: LedgerEntry[], role: RewardRole, event: RewardEvent): number {
  return entries.filter((entry) => entry.role === role && entry.event === event).length;
}

export function getScenarioExpectation(scenarioId: ScenarioId): ScenarioExpectation {
  return SCENARIO_EXPECTATIONS[scenarioId];
}

export function assertScenarioLedger(
  scenarioId: ScenarioId,
  entries: LedgerEntry[]
): void {
  const expected = getScenarioExpectation(scenarioId);
  const shouldIncludeFirstPrediction = expected.refereeEvents.includes('FIRST_PREDICTION_BONUS');
  const shouldIncludeManualRefereeBonus = expected.refereeEvents.includes('MANUAL_CLAIM_REFEREE_BONUS');

  expect(sumByRole(entries, 'referee')).toBe(expected.refereeTotal);
  expect(sumByRole(entries, 'referrer')).toBe(expected.referrerTotal);

  expect(eventsByRole(entries, 'referee')).toEqual(expected.refereeEvents);
  expect(eventsByRole(entries, 'referrer')).toEqual(expected.referrerEvents);

  expect(countEvent(entries, 'referee', 'FIRST_PREDICTION_BONUS')).toBe(
    shouldIncludeFirstPrediction ? 1 : 0
  );
  expect(countEvent(entries, 'referee', 'ONBOARDING_BONUS')).toBe(1);
  expect(countEvent(entries, 'referee', 'LINK_ONBOARDING_BONUS')).toBeLessThanOrEqual(1);
  expect(countEvent(entries, 'referrer', 'REFERRER_BONUS')).toBeLessThanOrEqual(1);
  expect(countEvent(entries, 'referee', 'MANUAL_CLAIM_REFEREE_BONUS')).toBe(
    shouldIncludeManualRefereeBonus ? 1 : 0
  );
}
