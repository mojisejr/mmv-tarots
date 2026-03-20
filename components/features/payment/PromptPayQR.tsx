'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Clock, Download, RefreshCw } from 'lucide-react';
import generatePromptPayPayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { GlassButton } from '@/components';
import { cn } from '@/lib/shared/utils';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 150; // ~10 minutes
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.webp,.jfif,image/jpeg,image/png,image/webp';
const ACCEPTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'jfif']);
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

function validateSlipFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)';
  }

  const extension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (!ACCEPTED_MIME_TYPES.has(mimeType) && !ACCEPTED_EXTENSIONS.has(extension)) {
    return 'รองรับเฉพาะไฟล์ภาพ JPG, PNG, WEBP เท่านั้น';
  }

  return null;
}

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'การยืนยันสลิปไม่สำเร็จ';
  }

  const candidate = payload as {
    errorMessage?: unknown;
    error?: unknown;
    message?: unknown;
  };

  if (typeof candidate.errorMessage === 'string' && candidate.errorMessage.trim()) {
    return candidate.errorMessage;
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  if (
    candidate.error &&
    typeof candidate.error === 'object' &&
    'message' in candidate.error &&
    typeof candidate.error.message === 'string' &&
    candidate.error.message.trim()
  ) {
    return candidate.error.message;
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  return 'การยืนยันสลิปไม่สำเร็จ';
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
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const successFiredRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { remaining, label: timer } = useCountdown(expiresAt);

  useEffect(() => {
    if (!slipFile) {
      setSlipPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(slipFile);
    setSlipPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [slipFile]);

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
    if (!slipFile) {
      toast.error('กรุณาเลือกไฟล์รูปสลิป');
      return;
    }

    const validationError = validateSlipFile(slipFile);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmittingSlip(true);
    try {
      const formData = new FormData();
      formData.append('slipFile', slipFile);

      const res = await fetch(`/api/payment/orders/${orderId}/slip`, {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.status ?? 'REJECTED');
        setError(extractErrorMessage(payload));
        if (payload.status === 'EXPIRED') {
          onExpired();
        }
        return;
      }

      setStatus(payload.status ?? 'VERIFYING');
      setError(extractErrorMessage(payload) === 'การยืนยันสลิปไม่สำเร็จ' ? null : extractErrorMessage(payload));
      setPollCount(0);
      toast.success('ส่งสลิปแล้ว ระบบกำลังตรวจสอบ');
      await poll();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการส่งสลิป');
    } finally {
      setSubmittingSlip(false);
    }
  }, [onExpired, orderId, poll, slipFile]);

  const handleFileSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      return;
    }

    const validationError = validateSlipFile(nextFile);
    if (validationError) {
      setSlipFile(null);
      setError(validationError);
      event.target.value = '';
      toast.error(validationError);
      return;
    }

    setSlipFile(nextFile);
    setError(null);
    if (status === 'REJECTED') {
      setStatus('PENDING_PAYMENT');
    }
  }, [status]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveQR = useCallback(async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `promptpay-${referenceCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      toast.success('บันทึก QR แล้ว');
    } catch {
      window.open(qrImageUrl, '_blank');
      toast.info('กดค้างที่รูป QR เพื่อบันทึกลงเครื่อง');
    }
  }, [qrImageUrl, referenceCode]);

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
      ? 'เลือกสลิปแล้วกดส่งเพื่อยืนยันยอด'
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
          <p className="text-xs text-muted-foreground">สแกน QR ด้านบน หรือบันทึกไว้เปิดในแอปธนาคาร</p>
          <p className="text-[11px] text-muted-foreground/80 font-mono">
            Ref: {referenceCode}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveQR}
          disabled={!qrImageUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-white/25 hover:bg-white/15 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          บันทึก QR
        </button>
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

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="slip-file" className="text-xs text-muted-foreground">
            อัปโหลดรูปสลิปการโอน
          </label>
          <p className="text-[11px] text-muted-foreground/70">
            รองรับ JPG, PNG, WEBP, JFIF สูงสุด 10MB และควรโอนตามยอด ฿{amount.toFixed(2)} ให้ตรงกับ QR
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="slip-file"
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileSelection}
          className="sr-only"
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-white/25 hover:bg-white/15"
            >
              {slipFile ? 'เปลี่ยนรูปสลิป' : 'เลือกไฟล์สลิป'}
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {slipFile ? slipFile.name : 'ยังไม่ได้เลือกไฟล์'}
              </p>
              <p className="text-xs text-muted-foreground">
                {slipFile ? `${formatFileSize(slipFile.size)} · พร้อมส่งยืนยัน` : 'เลือกจากมือถือหรือคอมพิวเตอร์ได้ทันที'}
              </p>
            </div>
          </div>

          {slipPreviewUrl && slipFile && (
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/10">
              <img
                src={slipPreviewUrl}
                alt={`ตัวอย่างสลิป ${slipFile.name}`}
                className="h-48 w-full object-cover"
              />
            </div>
          )}
        </div>

        <GlassButton
          onClick={submitSlip}
          disabled={submittingSlip || !slipFile}
          variant="primary"
          className="w-full"
        >
          {submittingSlip ? 'กำลังส่งสลิป...' : 'ส่งสลิปเพื่อยืนยัน'}
        </GlassButton>
      </div>

      {error && status !== 'REJECTED' && (
        <p className={cn(
          'text-center text-xs',
          status === 'VERIFYING' || status === 'VERIFIED' ? 'text-primary' : 'text-destructive',
        )}>
          {error}
        </p>
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
