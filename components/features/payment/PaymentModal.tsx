'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { MethodSelector, type PaymentMethod } from './MethodSelector';
import { CardForm } from './CardForm';
import { PromptPayQR } from './PromptPayQR';
import { PaymentReceipt } from './PaymentReceipt';

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 'method-select' | 'card-form' | 'qr-display' | '3ds-redirect' | 'receipt';

interface QrData {
  chargeId:   string;
  qrImageUrl: string;
  expiresAt:  string;
}

interface ReceiptData {
  chargeId: string;
  paidAt:   Date;
}

export interface PaymentModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  priceId:     string;
  userId:      string;
  packageName: string;
  stars:       number;
  amount:      number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PaymentModal({
  isOpen, onClose, priceId, userId, packageName, stars, amount,
}: PaymentModalProps) {
  const [step,          setStep]    = useState<Step>('method-select');
  const [method,        setMethod]  = useState<PaymentMethod | null>(null);
  const [loading,       setLoading] = useState(false);
  const [qrData,        setQrData]  = useState<QrData | null>(null);
  const [receiptData,   setReceipt] = useState<ReceiptData | null>(null);

  // ── Reset on close ──────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('method-select');
    setMethod(null);
    setQrData(null);
    setReceipt(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  // ── PromptPay: call API → get QR ────────────────────────────────────────
  const startPromptPay = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/omise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          priceId,
          userId,
          paymentMethod: 'PROMPTPAY',
          ownerName:     'Mimi Divination',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'ไม่สามารถสร้าง QR ได้');
        return;
      }

      setQrData({
        chargeId:   data.chargeId,
        qrImageUrl: data.qrImageUrl ?? '',
        expiresAt:  data.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      setStep('qr-display');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  }, [priceId, userId]);

  // ── Card: receive token from CardForm → call API ─────────────────────────
  const handleCardToken = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/checkout/omise', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            priceId,
            userId,
            paymentMethod: 'CARD',
            token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error ?? 'การชำระเงินล้มเหลว');
          return;
        }

        // 3DS redirect
        if (data.requires3DS && data.authorizeUri) {
          setStep('3ds-redirect');
          // Give user a moment to see the message, then redirect
          setTimeout(() => {
            window.location.href = data.authorizeUri as string;
          }, 1500);
          return;
        }

        // Direct success (no 3DS)
        if (data.chargeStatus === 'successful' || data.success) {
          setReceipt({ chargeId: data.chargeId, paidAt: new Date() });
          setStep('receipt');
          return;
        }

        toast.error('การชำระเงินไม่สำเร็จ กรุณาตรวจสอบข้อมูลบัตร');
      } catch {
        toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    },
    [priceId, userId],
  );

  // ── Method selection confirmed ───────────────────────────────────────────
  const handleMethodConfirm = useCallback(async () => {
    if (!method) {
      toast.error('กรุณาเลือกช่องทางชำระเงิน');
      return;
    }
    if (method === 'PROMPTPAY') {
      await startPromptPay();
    } else {
      setStep('card-form');
    }
  }, [method, startPromptPay]);

  // ── PromptPay polling success ────────────────────────────────────────────
  const handleQrSuccess = useCallback((chargeId: string) => {
    setReceipt({ chargeId, paidAt: new Date() });
    setStep('receipt');
    toast.success('ชำระเงินสำเร็จ! ดาวเพิ่มเข้าบัญชีแล้ว 🌟');
  }, []);

  // ── Render step titles ───────────────────────────────────────────────────
  const titleMap: Record<Step, string> = {
    'method-select':  `เติม ${stars} Stars · ฿${amount}`,
    'card-form':      'กรอกข้อมูลบัตร',
    'qr-display':     `สแกน QR · ฿${amount}`,
    '3ds-redirect':   'กำลังส่งต่อไปยังธนาคาร...',
    'receipt':        'ใบเสร็จ',
  };

  return (
    <>
      {/* Load Omise.js once when modal is opened */}
      {isOpen && (
        <Script
          src="https://cdn.omise.co/omise.js"
          strategy="lazyOnload"
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        hideCloseButton={step === 'qr-display' || step === '3ds-redirect'}
        title={titleMap[step]}
      >
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90dvh-80px)]">
          {/* ── Step: Method Select ────────────────────────────────────────── */}
          {step === 'method-select' && (
            <div className="space-y-5">
              <MethodSelector selected={method} onSelect={setMethod} />

              <button
                type="button"
                onClick={handleMethodConfirm}
                disabled={!method || loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 bg-primary text-primary-foreground hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-primary"
              >
                {loading ? 'กำลังเตรียม...' : 'ถัดไป →'}
              </button>

              <p className="text-center text-[10px] text-muted-foreground/60">
                For entertainment purposes only · ขับเคลื่อนโดย Omise
              </p>
            </div>
          )}

          {/* ── Step: Card Form ────────────────────────────────────────────── */}
          {step === 'card-form' && (
            <CardForm
              onToken={handleCardToken}
              onBack={() => setStep('method-select')}
              loading={loading}
            />
          )}

          {/* ── Step: PromptPay QR ─────────────────────────────────────────── */}
          {step === 'qr-display' && qrData && (
            <PromptPayQR
              chargeId={qrData.chargeId}
              qrImageUrl={qrData.qrImageUrl}
              expiresAt={qrData.expiresAt}
              amount={amount}
              onSuccess={handleQrSuccess}
              onExpired={() => {
                toast.error('QR หมดอายุ กรุณาลองใหม่');
                setStep('method-select');
                setQrData(null);
              }}
              onBack={() => setStep('method-select')}
            />
          )}

          {/* ── Step: 3DS Redirect ─────────────────────────────────────────── */}
          {step === '3ds-redirect' && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                กำลังส่งต่อไปยังหน้ายืนยันธนาคาร (3D Secure)...
              </p>
            </div>
          )}

          {/* ── Step: Receipt ──────────────────────────────────────────────── */}
          {step === 'receipt' && receiptData && (
            <PaymentReceipt
              chargeId={receiptData.chargeId}
              packageName={packageName}
              stars={stars}
              amount={amount}
              method={method!}
              paidAt={receiptData.paidAt}
              onClose={handleClose}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
