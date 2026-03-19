'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { PromptPayQR } from './PromptPayQR';
import { PaymentReceipt } from './PaymentReceipt';
import { buildToastMessage } from '@/lib/shared/payment-success-presenter';

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 'creating-order' | 'qr-display' | 'failed' | 'receipt';

type PaymentOrderStatus =
  | 'PENDING_PAYMENT'
  | 'SLIP_UPLOADED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CREDITED';

interface OrderSnapshot {
  orderId: string;
  userId: string;
  priceId: string;
  packageName: string;
  stars: number;
  amount: number;
}

interface OrderPayload {
  id: string;
  referenceCode: string;
  status: PaymentOrderStatus;
  amountTHB: number;
  currency: string;
  expiresAt: string;
  promptPayTargetId: string;
  creditedAt?: string | null;
  verificationErrorMessage?: string | null;
}

interface ReceiptData {
  transactionRef: string;
  paidAt: Date;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  userId: string;
  packageName: string;
  stars: number;
  amount: number;
  resumeOrderId?: string | null;
}

const ACTIVE_ORDER_KEY = 'mmv_active_payment_order';

// ── Component ────────────────────────────────────────────────────────────────

export function PaymentModal({
  isOpen,
  onClose,
  priceId,
  userId,
  packageName,
  stars,
  amount,
  resumeOrderId,
}: PaymentModalProps) {
  const amountLabel = amount.toFixed(2);
  const [step, setStep] = useState<Step>('creating-order');
  const [loading,       setLoading] = useState(false);
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [receiptData,   setReceipt] = useState<ReceiptData | null>(null);

  const persistActiveOrder = useCallback((orderId: string) => {
    const snapshot: OrderSnapshot = {
      orderId,
      userId,
      priceId,
      packageName,
      stars,
      amount,
    };
    localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(snapshot));
  }, [amount, packageName, priceId, stars, userId]);

  const clearActiveOrder = useCallback(() => {
    localStorage.removeItem(ACTIVE_ORDER_KEY);
  }, []);

  // ── Reset on close ──────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('creating-order');
    setOrder(null);
    setReceipt(null);
    setFailureMessage(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  const applyOrderState = useCallback((incoming: OrderPayload) => {
    setOrder(incoming);

    if (incoming.status === 'CREDITED') {
      clearActiveOrder();
      setReceipt({
        transactionRef: incoming.referenceCode,
        paidAt: incoming.creditedAt ? new Date(incoming.creditedAt) : new Date(),
      });
      setStep('receipt');
      return;
    }

    if (incoming.status === 'REJECTED' || incoming.status === 'EXPIRED') {
      setFailureMessage(
        incoming.verificationErrorMessage ??
          (incoming.status === 'EXPIRED'
            ? 'คำสั่งชำระเงินหมดอายุ กรุณาสร้าง QR ใหม่'
            : 'ไม่สามารถยืนยันสลิปได้ กรุณาตรวจสอบและลองใหม่')
      );
      setStep('failed');
      return;
    }

    setStep('qr-display');
  }, [clearActiveOrder]);

  const fetchOrderStatus = useCallback(async (orderId: string) => {
    const res = await fetch(`/api/payment/orders/${orderId}/status`, {
      cache: 'no-store',
    });

    const payload = await res.json();
    if (!res.ok || !payload?.order) {
      throw new Error(payload?.error ?? 'ไม่สามารถโหลดสถานะคำสั่งชำระเงินได้');
    }

    const mapped: OrderPayload = {
      id: payload.order.id,
      referenceCode: payload.order.referenceCode,
      status: payload.order.status,
      amountTHB: payload.order.amountTHB,
      currency: payload.order.currency,
      expiresAt: new Date(payload.order.expiresAt).toISOString(),
      promptPayTargetId: payload.order.promptpay?.targetId ?? '',
      creditedAt: payload.order.creditedAt ? new Date(payload.order.creditedAt).toISOString() : null,
      verificationErrorMessage: payload.order.verificationErrorMessage ?? null,
    };

    applyOrderState(mapped);
  }, [applyOrderState]);

  const createOrder = useCallback(async () => {
    const res = await fetch('/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: priceId }),
    });

    const payload = await res.json();
    if (!res.ok || !payload?.order) {
      throw new Error(payload?.error ?? 'ไม่สามารถสร้างคำสั่งชำระเงินได้');
    }

    const created: OrderPayload = {
      id: payload.order.id,
      referenceCode: payload.order.referenceCode,
      status: payload.order.status,
      amountTHB: payload.order.amountTHB,
      currency: payload.order.currency,
      expiresAt: payload.order.expiresAt,
      promptPayTargetId: payload.order.promptpay?.targetId ?? '',
    };

    persistActiveOrder(created.id);
    applyOrderState(created);
  }, [applyOrderState, persistActiveOrder, priceId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLoading(true);
    setFailureMessage(null);
    setReceipt(null);

    const bootstrap = async () => {
      try {
        if (resumeOrderId) {
          await fetchOrderStatus(resumeOrderId);
        } else {
          await createOrder();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        setFailureMessage(message);
        setStep('failed');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [createOrder, fetchOrderStatus, isOpen, resumeOrderId]);

  const handleCredited = useCallback((transactionRef: string) => {
    clearActiveOrder();
    setReceipt({ transactionRef, paidAt: new Date() });
    setStep('receipt');
    toast.success(buildToastMessage({
      referenceCode: transactionRef,
      starsGranted: stars,
      packageName,
      amountTHB: amount,
      creditedAt: new Date(),
    }));
  }, [clearActiveOrder, amount, packageName, stars]);

  // ── Render step titles ───────────────────────────────────────────────────
  const titleMap: Record<Step, string> = {
    'creating-order': `เติม ${stars} Stars · ฿${amountLabel}`,
    'qr-display': `สแกน QR · ฿${amountLabel}`,
    'failed': 'ไม่สามารถดำเนินการชำระเงิน',
    'receipt': 'ใบเสร็จ',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      hideCloseButton={loading || step === 'qr-display'}
      title={titleMap[step]}
    >
      <div className="px-6 py-5 overflow-y-auto max-h-[calc(90dvh-80px)]">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              กำลังเตรียมคำสั่งชำระเงิน...
            </p>
          </div>
        )}

        {!loading && step === 'qr-display' && order && (
          <PromptPayQR
            orderId={order.id}
            referenceCode={order.referenceCode}
            expiresAt={order.expiresAt}
            amount={order.amountTHB}
            promptPayTargetId={order.promptPayTargetId}
            initialStatus={order.status}
            initialErrorMessage={order.verificationErrorMessage ?? null}
            onCredited={handleCredited}
            onExpired={() => {
              setFailureMessage('คำสั่งชำระเงินหมดอายุ กรุณาสร้าง QR ใหม่');
              setStep('failed');
            }}
            onClose={handleClose}
          />
        )}

        {!loading && step === 'failed' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive font-medium">
                {failureMessage ?? 'ไม่สามารถดำเนินการคำสั่งชำระเงินได้'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 bg-primary text-primary-foreground hover:brightness-105"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        )}

        {!loading && step === 'receipt' && receiptData && (
          <PaymentReceipt
            transactionRef={receiptData.transactionRef}
            packageName={packageName}
            stars={stars}
            amount={amount}
            paidAt={receiptData.paidAt}
            onClose={handleClose}
          />
        )}
      </div>
    </Modal>
  );
}
