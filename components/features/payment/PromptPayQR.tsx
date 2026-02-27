'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, Clock, RefreshCw } from 'lucide-react';
import { GlassButton } from '@/components';
import { cn } from '@/lib/shared/utils';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS        = 150; // ~10 minutes

interface StatusResponse {
  chargeId:   string;
  status:     'pending' | 'successful' | 'failed' | 'expired';
  paid:       boolean;
  amount:     number;
  currency:   string;
  credited:   boolean;
  failureMsg: string | null;
}

interface PromptPayQRProps {
  chargeId:    string;
  qrImageUrl:  string;
  expiresAt:   string;
  amount:      number;
  onSuccess:   (chargeId: string) => void;
  onExpired:   () => void;
  onBack:      () => void;
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((p) => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { remaining, label: `${mm}:${ss}` };
}

export function PromptPayQR({
  chargeId, qrImageUrl, expiresAt, amount, onSuccess, onExpired, onBack,
}: PromptPayQRProps) {
  const [pollCount, setPollCount]   = useState(0);
  const [status, setStatus]         = useState<StatusResponse['status']>('pending');
  const [error, setError]           = useState<string | null>(null);
  const successFiredRef             = useRef(false);
  const { remaining, label: timer } = useCountdown(expiresAt);

  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`/api/checkout/omise/status?chargeId=${chargeId}`);
      if (!res.ok) {
        return;
      }
      const data: StatusResponse = await res.json();

      setStatus(data.status);

      if (data.status === 'successful' && !successFiredRef.current) {
        successFiredRef.current = true;
        onSuccess(chargeId);
        return;
      }
      if (data.status === 'failed') {
        setError(data.failureMsg ?? 'การชำระเงินล้มเหลว');
      }
      if (data.status === 'expired') {
        onExpired();
      }
    } catch {
      // Network error — keep polling
    }
  }, [chargeId, onSuccess, onExpired]);

  // Start polling
  useEffect(() => {
    if (status !== 'pending') return;
    if (pollCount >= MAX_POLLS) { onExpired(); return; }
    if (Date.now() >= new Date(expiresAt).getTime()) { onExpired(); return; }

    const id = setTimeout(async () => {
      await poll();
      setPollCount((p) => p + 1);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(id);
  }, [poll, pollCount, status, onExpired, expiresAt]);

  useEffect(() => {
    if (status === 'pending' && remaining <= 0) {
      onExpired();
    }
  }, [remaining, status, onExpired]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-foreground">สแกน QR PromptPay</p>
        <div className={cn(
          'ml-auto flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full border',
          remaining > 60
            ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
            : 'border-destructive/30 text-destructive bg-destructive/5',
        )}>
          <Clock className="w-3 h-3" />
          {timer}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/15 bg-white p-3 shadow-glass">
          {qrImageUrl ? (
            <Image
              src={qrImageUrl}
              alt="PromptPay QR Code"
              fill
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              ไม่พบ QR Code
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-foreground">฿{amount.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">เปิด Mobile Banking แล้วสแกน QR ด้านบน</p>
        </div>
      </div>

      {/* Status indicator */}
      <div className={cn(
        'flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors',
        status === 'pending' && 'border-primary/20 bg-primary/5 text-primary',
        status === 'failed'  && 'border-destructive/30 bg-destructive/5 text-destructive',
      )}>
        {status === 'pending' && (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>รอการยืนยันการชำระเงิน...</span>
          </>
        )}
        {status === 'failed' && (
          <span>{error ?? 'การชำระเงินล้มเหลว'}</span>
        )}
      </div>

      {status === 'failed' && (
        <GlassButton onClick={onBack} variant="outline" className="w-full">
          ลองใหม่อีกครั้ง
        </GlassButton>
      )}

      <p className="text-center text-[10px] text-muted-foreground/60">
        QR Code จะหมดอายุเมื่อตัวนับถอยหลังถึง 0 · ขับเคลื่อนโดย Omise
      </p>
    </div>
  );
}
