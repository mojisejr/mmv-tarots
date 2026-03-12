import { db } from '@/lib/server/db';

export interface PaymentCreditedNotificationInput {
  userId: string;
  stars: number;
  orderReferenceCode: string;
}

export interface PaymentCreditedNotificationResult {
  sent: boolean;
  reason?: string;
}

function buildPaymentSuccessMessage(input: PaymentCreditedNotificationInput): string {
  return [
    'Payment completed successfully.',
    `Stars added: +${input.stars}`,
    `Reference: ${input.orderReferenceCode}`,
  ].join('\n');
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
            text: buildPaymentSuccessMessage(input),
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
