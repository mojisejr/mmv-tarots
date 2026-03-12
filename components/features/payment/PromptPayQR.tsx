'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Clock, RefreshCw } from 'lucide-react';
import generatePromptPayPayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { GlassButton } from '@/components';
import { cn } from '@/lib/shared/utils';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 150; // ~10 minutes

interface StatusResponse {
  order: {
    id: string;
    referenceCode: string;
    status:
      | 'PENDING_PAYMENT'
      | 'SLIP_UPLOADED'
      | 'VERIFYING'
      | 'VERIFIED'
      | 'REJECTED'
      | 'EXPIRED'
      | 'CREDITED';
    verificationErrorMessage: string | null;
  };
}

interface PromptPayQRProps {
  orderId: string;
  referenceCode: string;
  expiresAt: string;
  amount: number;
  promptPayTargetId: string;
  initialStatus: StatusResponse['order']['status'];
  initialErrorMessage?: string | null;
  onCredited: (transactionRef: string) => void;
  onExpired: () => void;
  onClose: () => void;
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
  orderId,
  referenceCode,
  expiresAt,
  amount,
  promptPayTargetId,
  initialStatus,
  initialErrorMessage,
  onCredited,
  onExpired,
  onClose,
}: PromptPayQRProps) {
  const [pollCount, setPollCount] = useState(0);
  const [status, setStatus] = useState<StatusResponse['order']['status']>(initialStatus);
  const [error, setError] = useState<string | null>(initialErrorMessage ?? null);
  const [slipImageUrl, setSlipImageUrl] = useState('');
  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const successFiredRef = useRef(false);
  const { remaining, label: timer } = useCountdown(expiresAt);

  useEffect(() => {
    const run = async () => {
      if (!promptPayTargetId) {
        setError('ยังไม่ได้ตั้งค่า PromptPay ID ของระบบ');
        return;
      }

      try {
        const payload = generatePromptPayPayload(promptPayTargetId, { amount });
        const dataUrl = await QRCode.toDataURL(payload, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        setQrImageUrl(dataUrl);
      } catch {
        setError('ไม่สามารถสร้าง QR ได้ กรุณาลองใหม่อีกครั้ง');
      }
    };

    void run();
  }, [amount, promptPayTargetId]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/orders/${orderId}/status`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return;
      }
      const data: StatusResponse = await res.json();
      const currentStatus = data.order.status;

      setStatus(currentStatus);
      setError(data.order.verificationErrorMessage);

      if (currentStatus === 'CREDITED' && !successFiredRef.current) {
        successFiredRef.current = true;
        onCredited(data.order.referenceCode);
        return;
      }

      if (currentStatus === 'REJECTED') {
        setError(data.order.verificationErrorMessage ?? 'สลิปไม่ผ่านการยืนยัน');
      }

      if (currentStatus === 'EXPIRED') {
        onExpired();
      }
    } catch {
      // Network error — keep polling
    }
  }, [onCredited, onExpired, orderId]);

  const submitSlip = useCallback(async () => {
    const normalizedUrl = slipImageUrl.trim();
    if (!normalizedUrl) {
      toast.error('กรุณากรอก URL ของสลิป');
      return;
    }

    setSubmittingSlip(true);
    try {
      const res = await fetch(`/api/payment/orders/${orderId}/slip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slipImageUrl: normalizedUrl }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.status ?? 'REJECTED');
        setError(payload.errorMessage ?? payload.error ?? 'การยืนยันสลิปไม่สำเร็จ');
        if (payload.status === 'EXPIRED') {
          onExpired();
        }
        return;
      }

      setStatus(payload.status ?? 'VERIFYING');
      setError(null);
      setPollCount(0);
      toast.success('ส่งสลิปแล้ว ระบบกำลังตรวจสอบ');
      await poll();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการส่งสลิป');
    } finally {
      setSubmittingSlip(false);
    }
  }, [onExpired, orderId, poll, slipImageUrl]);

  // Start polling
  useEffect(() => {
    if (status === 'CREDITED' || status === 'EXPIRED' || status === 'REJECTED') {
      return;
    }

    if (pollCount >= MAX_POLLS) { onExpired(); return; }
    if (Date.now() >= new Date(expiresAt).getTime()) { onExpired(); return; }

    const id = setTimeout(async () => {
      await poll();
      setPollCount((p) => p + 1);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(id);
  }, [poll, pollCount, status, onExpired, expiresAt]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired();
    }
  }, [remaining, onExpired]);

  const statusLabel =
    status === 'PENDING_PAYMENT'
      ? 'รอส่งสลิปเพื่อยืนยันยอด'
      : status === 'SLIP_UPLOADED'
        ? 'รับสลิปแล้ว กำลังจัดคิวตรวจสอบ'
        : status === 'VERIFYING' || status === 'VERIFIED'
          ? 'กำลังตรวจสอบสลิปกับธนาคาร'
          : status === 'REJECTED'
            ? 'สลิปไม่ผ่านการยืนยัน'
            : 'กำลังรอการยืนยัน';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
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
          <p className="text-2xl font-bold text-foreground">฿{amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">เปิด Mobile Banking แล้วสแกน QR ด้านบน</p>
          <p className="text-[11px] text-muted-foreground/80 font-mono">
            Ref: {referenceCode}
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className={cn(
        'flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors',
        (status === 'PENDING_PAYMENT' || status === 'SLIP_UPLOADED' || status === 'VERIFYING' || status === 'VERIFIED') &&
          'border-primary/20 bg-primary/5 text-primary',
        status === 'REJECTED' && 'border-destructive/30 bg-destructive/5 text-destructive',
      )}>
        {(status === 'PENDING_PAYMENT' || status === 'SLIP_UPLOADED' || status === 'VERIFYING' || status === 'VERIFIED') && (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{statusLabel}</span>
          </>
        )}
        {status === 'REJECTED' && (
          <span>{error ?? 'การยืนยันสลิปล้มเหลว'}</span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slip-url" className="text-xs text-muted-foreground">
          แนบลิงก์รูปสลิป (URL)
        </label>
        <input
          id="slip-url"
          type="url"
          value={slipImageUrl}
          onChange={(event) => setSlipImageUrl(event.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-200 border-white/10 hover:border-white/20"
        />
        <GlassButton
          onClick={submitSlip}
          disabled={submittingSlip || !slipImageUrl.trim()}
          variant="primary"
          className="w-full"
        >
          {submittingSlip ? 'กำลังส่งสลิป...' : 'ส่งสลิปเพื่อยืนยัน'}
        </GlassButton>
      </div>

      {error && status !== 'REJECTED' && (
        <p className="text-center text-xs text-destructive">{error}</p>
      )}

      <GlassButton onClick={onClose} variant="outline" className="w-full">
        ปิดหน้าต่างชำระเงิน
      </GlassButton>

      <p className="text-center text-[10px] text-muted-foreground/60">
        QR Code จะหมดอายุเมื่อตัวนับถอยหลังถึง 0 · ระบบยืนยันผ่าน SlipOK
      </p>
    </div>
  );
}
