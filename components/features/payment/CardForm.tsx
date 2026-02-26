'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, CreditCard, Lock } from 'lucide-react';
import { GlassButton } from '@/components';
import { cn } from '@/lib/shared/utils';

const CardSchema = z.object({
  name:             z.string().min(2, 'กรุณากรอกชื่อบนบัตร'),
  number:           z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'เลขบัตรไม่ถูกต้อง'),
  expiration_month: z.string().regex(/^(0[1-9]|1[0-2])$/, 'เดือนไม่ถูกต้อง'),
  expiration_year:  z.string().regex(/^\d{4}$/, 'ปีไม่ถูกต้อง'),
  security_code:    z.string().min(3, 'CVV ไม่ถูกต้อง').max(4),
});

type CardFormData = z.infer<typeof CardSchema>;

interface CardFormProps {
  onToken:  (token: string) => Promise<void>;
  onBack:   () => void;
  loading:  boolean;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function CardForm({ onToken, onBack, loading }: CardFormProps) {
  const [tokenizing, setTokenizing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CardFormData>({ resolver: zodResolver(CardSchema) });

  const onSubmit = useCallback(
    async (data: CardFormData) => {
      if (!window.Omise) {
        return;
      }

      setTokenizing(true);
      const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY ?? '';
      window.Omise.setPublicKey(publicKey);

      window.Omise.createToken(
        'card',
        {
          name:             data.name,
          number:           data.number.replace(/\s/g, ''),
          expiration_month: Number(data.expiration_month),
          expiration_year:  Number(data.expiration_year),
          security_code:    data.security_code,
        },
        async (statusCode, response) => {
          const tokenId =
            response.id ??
            (typeof response.object === 'object' ? response.object.id : undefined);

          if (statusCode !== 200 || !tokenId) {
            setTokenizing(false);
            return;
          }
          try {
            await onToken(tokenId);
          } finally {
            setTokenizing(false);
          }
        },
      );
    },
    [onToken],
  );

  const isBusy = loading || tokenizing;

  const inputCls = cn(
    'w-full rounded-xl border bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-foreground',
    'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40',
    'transition-colors duration-200 border-white/10 hover:border-white/20',
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">กรอกข้อมูลบัตร</p>
        </div>
        <Lock className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
      </div>

      {/* Card Number */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">หมายเลขบัตร</label>
        <input
          {...register('number')}
          className={inputCls}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          onChange={(e) => setValue('number', formatCardNumber(e.target.value))}
          autoComplete="cc-number"
          inputMode="numeric"
        />
        {errors.number && (
          <p className="text-xs text-destructive mt-1">{errors.number.message}</p>
        )}
      </div>

      {/* Name on card */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">ชื่อบนบัตร</label>
        <input
          {...register('name')}
          className={inputCls}
          placeholder="FIRSTNAME LASTNAME"
          autoComplete="cc-name"
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Expiry + CVV Row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">เดือน</label>
          <input
            {...register('expiration_month')}
            className={inputCls}
            placeholder="MM"
            maxLength={2}
            inputMode="numeric"
            autoComplete="cc-exp-month"
          />
          {errors.expiration_month && (
            <p className="text-xs text-destructive mt-1">{errors.expiration_month.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">ปี</label>
          <input
            {...register('expiration_year')}
            className={inputCls}
            placeholder="YYYY"
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-exp-year"
          />
          {errors.expiration_year && (
            <p className="text-xs text-destructive mt-1">{errors.expiration_year.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
          <input
            {...register('security_code')}
            className={inputCls}
            placeholder="123"
            maxLength={4}
            inputMode="numeric"
            type="password"
            autoComplete="cc-csc"
          />
          {errors.security_code && (
            <p className="text-xs text-destructive mt-1">{errors.security_code.message}</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
        <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <p className="text-[11px] text-emerald-700">
          ข้อมูลบัตรถูกเข้ารหัสโดย Omise (PCI DSS Level 1) — เราไม่เก็บข้อมูลบัตรของคุณ
        </p>
      </div>

      <GlassButton
        type="submit"
        disabled={isBusy}
        variant="primary"
        className="w-full py-5 font-bold text-base"
      >
        {isBusy ? 'กำลังประมวลผล...' : 'ชำระเงิน'}
      </GlassButton>
    </form>
  );
}
