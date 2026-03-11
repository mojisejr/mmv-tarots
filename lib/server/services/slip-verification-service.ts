import { VerificationProvider } from '@prisma/client';

export interface VerifySlipInput {
  paymentOrderId: string;
  slipImageUrl: string;
}

export interface VerifySlipResult {
  success: boolean;
  provider: VerificationProvider;
  externalRef?: string;
  amountTHB?: number;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

export const slipVerificationService = {
  async verify(_input: VerifySlipInput): Promise<VerifySlipResult> {
    // Phase 1 contract only. Provider integration is implemented in Phase 2.
    return {
      success: false,
      provider: VerificationProvider.SLIP_OK,
      errorCode: 'NOT_IMPLEMENTED',
      errorMessage: 'Slip verification is scheduled for Phase 2 implementation.',
    };
  },
};
