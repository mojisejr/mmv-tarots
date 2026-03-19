import { db } from '@/lib/server/db';
import { buildLineOaMessage } from '@/lib/shared/payment-success-presenter';
import type { PaymentSuccessSummary } from '@/lib/shared/payment-success-presenter';

export interface PaymentCreditedNotificationInput {
  userId: string;
  stars: number;
  orderReferenceCode: string;
  packageName: string;
  amountTHB: number;
  creditedAt?: Date;
}

export interface PaymentCreditedNotificationResult {
  sent: boolean;
  reason?: string;
}

export const lineOaNotificationService = {
  async notifyPaymentCredited(
    input: PaymentCreditedNotificationInput
  ): Promise<PaymentCreditedNotificationResult> {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
      return { sent: false, reason: 'LINE_CHANNEL_ACCESS_TOKEN_NOT_CONFIGURED' };
    }

    const account = await db.account.findFirst({
      where: {
        userId: input.userId,
        providerId: {
          contains: 'line',
          mode: 'insensitive',
        },
      },
      select: {
        accountId: true,
      },
    });

    if (!account?.accountId) {
      return { sent: false, reason: 'LINE_ACCOUNT_NOT_FOUND' };
    }

    const summary: PaymentSuccessSummary = {
      referenceCode: input.orderReferenceCode,
      starsGranted: input.stars,
      packageName: input.packageName,
      amountTHB: input.amountTHB,
      creditedAt: input.creditedAt ?? new Date(),
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: account.accountId,
        messages: [
          {
            type: 'text',
            text: buildLineOaMessage(summary),
          },
        ],
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: `LINE_PUSH_FAILED_${response.status}` };
    }

    return { sent: true };
  },
};
