import { describe, expect, it } from 'vitest';
import {
  buildLineOaMessage,
  buildPrimaryAction,
  buildToastMessage,
  getSecondaryAction,
} from '@/lib/shared/payment-success-presenter';
import type { PaymentSuccessSummary } from '@/lib/shared/payment-success-presenter';

const baseSummary: PaymentSuccessSummary = {
  referenceCode: 'pay_123_abc',
  starsGranted: 10,
  packageName: 'Starter Pack',
  amountTHB: 99,
  creditedAt: new Date('2026-03-19T15:00:00Z'),
};

describe('payment-success-presenter', () => {
  describe('buildLineOaMessage', () => {
    it('produces Thai-friendly copy with stars and reference', () => {
      const message = buildLineOaMessage(baseSummary);

      expect(message).toContain('เติมดาวสำเร็จ');
      expect(message).toContain('+10 ดวง');
      expect(message).toContain('pay_123_abc');
      expect(message).toContain('Starter Pack');
      expect(message).toContain('฿99');
    });

    it('works with zero stars', () => {
      const message = buildLineOaMessage({ ...baseSummary, starsGranted: 0 });
      expect(message).toContain('+0 ดวง');
    });
  });

  describe('buildToastMessage', () => {
    it('includes star count', () => {
      const message = buildToastMessage(baseSummary);
      expect(message).toContain('+10 ดวง');
      expect(message).toContain('สำเร็จ');
    });
  });

  describe('buildPrimaryAction', () => {
    it('returns default home action when no returnTo', () => {
      const action = buildPrimaryAction();
      expect(action.href).toBe('/');
      expect(action.label).toContain('ดูดวง');
    });

    it('returns continuation action for valid returnTo path', () => {
      const action = buildPrimaryAction('/question/abc');
      expect(action.href).toBe('/question/abc');
      expect(action.label).toContain('ดำเนินการ');
    });

    it('returns default for invalid returnTo (not starting with /)', () => {
      const action = buildPrimaryAction('https://evil.com');
      expect(action.href).toBe('/');
    });
  });

  describe('getSecondaryAction', () => {
    it('returns billing path', () => {
      const action = getSecondaryAction();
      expect(action.href).toBe('/billing');
    });
  });
});
