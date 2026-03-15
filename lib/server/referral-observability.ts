import * as Sentry from '@sentry/nextjs';

type EventPayload = Record<string, string | number | boolean | null | undefined>;

type RewardAnomalyCode =
  | 'MANUAL_BONUS_WITHOUT_REFERRER'
  | 'MANUAL_BONUS_ON_LINK_SOURCE'
  | 'REFERRER_BONUS_MISMATCH'
  | 'NEGATIVE_REWARD_AMOUNT';

export type RewardAnomaly = {
  code: RewardAnomalyCode;
  message: string;
  details: EventPayload;
};

export type ReferralRewardOutcome = {
  referralHistoryId: string;
  refereeId: string;
  referrerId: string;
  source: 'LINK' | 'MANUAL_CODE';
  referrerReward: number;
  refereeReward: number;
};

function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage =
      (error as { message?: unknown }).message ??
      (error as { error?: { message?: unknown } }).error?.message;
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      return new Error(maybeMessage);
    }
  }

  return new Error(typeof error === 'string' ? error : 'Unknown referral error');
}

function stringifyPayload(payload: EventPayload): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return '{"serialization":"failed"}';
  }
}

export function emitReferralEvent(event: string, payload: EventPayload): void {
  const timestamp = new Date().toISOString();
  console.info(`[ReferralEvent] ${event} ${timestamp} ${stringifyPayload(payload)}`);
}

export function captureReferralException(
  operation: string,
  error: unknown,
  context: EventPayload = {}
): void {
  const normalizedError = asError(error);

  Sentry.withScope((scope) => {
    scope.setTag('domain', 'referral');
    scope.setTag('operation', operation);

    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(normalizedError);
  });

  emitReferralEvent('referral.exception', {
    operation,
    message: normalizedError.message,
    ...context,
  });
}

export async function notifyReferralAlert(params: {
  title: string;
  severity?: 'info' | 'warning' | 'critical';
  details: EventPayload;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  const colorMap: Record<'info' | 'warning' | 'critical', number> = {
    info: 0x2ecc71,
    warning: 0xf39c12,
    critical: 0xe74c3c,
  };

  const severity = params.severity ?? 'warning';
  const fields = Object.entries(params.details)
    .filter(([, value]) => value !== undefined)
    .slice(0, 12)
    .map(([name, value]) => ({
      name,
      value: String(value ?? 'null'),
      inline: true,
    }));

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'MMV Referral Guard',
        embeds: [
          {
            title: params.title,
            color: colorMap[severity],
            timestamp: new Date().toISOString(),
            fields,
          },
        ],
      }),
    });
  } catch (error: unknown) {
    const normalizedError = asError(error);
    console.error('[ReferralAlert] Discord notification failed:', normalizedError.message);
  }
}

export function detectReferralRewardAnomalies(
  outcome: ReferralRewardOutcome
): RewardAnomaly[] {
  const anomalies: RewardAnomaly[] = [];

  if (outcome.referrerReward < 0 || outcome.refereeReward < 0) {
    anomalies.push({
      code: 'NEGATIVE_REWARD_AMOUNT',
      message: 'Referral reward amounts must never be negative.',
      details: {
        referralHistoryId: outcome.referralHistoryId,
        referrerReward: outcome.referrerReward,
        refereeReward: outcome.refereeReward,
      },
    });
  }

  if (outcome.refereeReward > 0 && outcome.referrerReward <= 0) {
    anomalies.push({
      code: 'MANUAL_BONUS_WITHOUT_REFERRER',
      message: 'Manual referee bonus detected without corresponding referrer bonus.',
      details: {
        referralHistoryId: outcome.referralHistoryId,
        refereeReward: outcome.refereeReward,
        referrerReward: outcome.referrerReward,
      },
    });
  }

  if (outcome.source === 'LINK' && outcome.refereeReward > 0) {
    anomalies.push({
      code: 'MANUAL_BONUS_ON_LINK_SOURCE',
      message: 'Referee manual bonus should not be granted for LINK attribution.',
      details: {
        referralHistoryId: outcome.referralHistoryId,
        source: outcome.source,
        refereeReward: outcome.refereeReward,
      },
    });
  }

  if (outcome.referrerReward !== 2) {
    anomalies.push({
      code: 'REFERRER_BONUS_MISMATCH',
      message: 'Referrer bonus mismatch from expected +2 contract.',
      details: {
        referralHistoryId: outcome.referralHistoryId,
        referrerReward: outcome.referrerReward,
      },
    });
  }

  return anomalies;
}
