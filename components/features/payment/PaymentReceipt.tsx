'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassButton } from '@/components';
import {
  buildPrimaryAction,
  getSecondaryAction,
} from '@/lib/shared/payment-success-presenter';
import type { SuccessAction } from '@/lib/shared/payment-success-presenter';

interface PaymentReceiptProps {
  transactionRef: string;
  packageName: string;
  stars: number;
  amount: number;
  paidAt: Date;
  onClose: () => void;
  returnTo?: string;
}

export function PaymentReceipt({
  transactionRef,
  packageName,
  stars,
  amount,
  paidAt,
  onClose,
  returnTo,
}: PaymentReceiptProps) {
  const router = useRouter();

  const primary: SuccessAction = buildPrimaryAction(returnTo);
  const secondary: SuccessAction = getSecondaryAction();

  const rows: Array<{ label: string; value: string }> = [
    { label: 'แพ็กเกจ',        value: packageName },
    { label: 'จำนวนดาว',       value: `+${stars} ดวง` },
    { label: 'ยอดชำระ',        value: `฿${amount.toFixed(0)}` },
    { label: 'ช่องทาง',        value: 'PromptPay QR' },
    { label: 'วันที่',          value: paidAt.toLocaleString('th-TH') },
    { label: 'สถานะ',          value: 'สำเร็จ ✓' },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Success icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xl font-serif font-bold text-foreground">เติมดาวสำเร็จ!</h3>
        <p className="text-sm text-muted-foreground">
          ดาว <span className="font-semibold text-primary">{stars}</span> ดวงได้รับการเพิ่มเข้าบัญชีแล้ว
        </p>
      </div>

      {/* Digital Receipt */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm divide-y divide-white/5 overflow-hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-start px-4 py-2.5 gap-3">
            <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
            <span className="text-xs text-foreground text-right font-mono break-all">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Reference - secondary prominence */}
      <p className="text-[10px] text-muted-foreground/60 font-mono break-all text-center">
        Ref: {transactionRef}
      </p>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-center">
        <p className="text-[11px] text-emerald-700">
          บริการ Digital Token ส่งมอบทันทีเมื่อชำระเงิน · ไม่สามารถคืนเงินได้
        </p>
      </div>

      <GlassButton
        onClick={() => {
          onClose();
          router.push(primary.href);
        }}
        variant="primary"
        className="w-full py-5 font-bold text-base"
      >
        {primary.label} →
      </GlassButton>

      <button
        type="button"
        onClick={() => {
          onClose();
          router.push(secondary.href);
        }}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {secondary.label}
      </button>
    </div>
  );
}
