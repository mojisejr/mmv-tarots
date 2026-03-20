import { describe, expect, it } from 'vitest';
import { mapPaymentErrorSemantics } from '@/lib/shared/payment-error-semantics';

describe('payment-error-semantics', () => {
  it('maps 1010 to delayed recheck and extracts delay minutes', () => {
    const result = mapPaymentErrorSemantics({
      verificationErrorCode: '1010',
      verificationErrorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 9 นาที',
    });

    expect(result.errorCategory).toBe('DELAYED_RECHECK');
    expect(result.retryAfterMinutes).toBe(9);
    expect(result.delayMinutes).toBe(9);
  });

  it('maps 1014 to receiver mismatch without retry metadata', () => {
    const result = mapPaymentErrorSemantics({
      verificationErrorCode: '1014',
      verificationErrorMessage: 'บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน',
    });

    expect(result.errorCategory).toBe('RECEIVER_MISMATCH');
    expect(result.retryAfterMinutes).toBeNull();
    expect(result.delayMinutes).toBeNull();
  });

  it('returns unknown when no error code is available', () => {
    const result = mapPaymentErrorSemantics({
      verificationErrorCode: null,
      verificationErrorMessage: null,
    });

    expect(result.errorCategory).toBe('UNKNOWN');
    expect(result.retryAfterMinutes).toBeNull();
    expect(result.delayMinutes).toBeNull();
  });
});