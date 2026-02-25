'use client';

import { CreditCard, QrCode } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

export type PaymentMethod = 'PROMPTPAY' | 'CARD';

interface MethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export function MethodSelector({ selected, onSelect }: MethodSelectorProps) {
  const methods: Array<{
    id: PaymentMethod;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    recommended?: boolean;
  }> = [
    {
      id: 'PROMPTPAY',
      label: 'PromptPay',
      sublabel: 'สแกน QR — ปลอดภัย คืนเงินไม่ได้',
      icon: <QrCode className="w-6 h-6" />,
      recommended: true,
    },
    {
      id: 'CARD',
      label: 'บัตรเครดิต / เดบิต',
      sublabel: 'Visa, Mastercard, JCB',
      icon: <CreditCard className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-medium">เลือกช่องทางชำระเงิน</p>
      <div className="grid grid-cols-1 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              'relative flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-300 text-left',
              'backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              selected === m.id
                ? 'border-primary/60 bg-primary/10 shadow-glow-primary'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
            )}
          >
            {/* Recommended badge */}
            {m.recommended && (
              <span className="absolute top-0 right-3 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                แนะนำ
              </span>
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
                selected === m.id
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-white/10 border-white/10 text-muted-foreground',
              )}
            >
              {m.icon}
            </div>

            {/* Labels */}
            <div className="min-w-0">
              <p
                className={cn(
                  'font-semibold text-base',
                  selected === m.id ? 'text-foreground' : 'text-foreground/80',
                )}
              >
                {m.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.sublabel}</p>
            </div>

            {/* Radio indicator */}
            <div className="ml-auto shrink-0">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                  selected === m.id ? 'border-primary bg-primary/20' : 'border-border-subtle',
                )}
              >
                {selected === m.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
