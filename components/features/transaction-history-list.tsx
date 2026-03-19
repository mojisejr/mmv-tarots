'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: 'TOPUP' | 'PREDICTION' | 'REFUND' | 'REFERRAL' | 'ONBOARDING';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
  externalRef?: string | null;
  paymentOrderId?: string | null;
  channel?: 'PROMPTPAY_QR' | 'LINE_ADMIN_MANUAL' | 'SYSTEM' | null;
  metadata?: {
    amountTHB?: number;
    paymentOrderId?: string;
    creditedVia?: string;
  } | null;
}

interface HistoryResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getTransactionLabel(type: Transaction['type']): string {
  if (type === 'TOPUP') {
    return 'เติมดาว (Package)';
  }

  if (type === 'PREDICTION') {
    return 'ทำนายไพ่';
  }

  if (type === 'REFERRAL') {
    return 'โบนัสแนะนำเพื่อน';
  }

  if (type === 'ONBOARDING') {
    return 'โบนัสเริ่มต้น';
  }

  return 'คืนดาว (Refund)';
}

function getPaymentChannelLabel(channel: Transaction['channel']): string | null {
  if (channel === 'PROMPTPAY_QR') {
    return 'PromptPay QR';
  }

  if (channel === 'LINE_ADMIN_MANUAL') {
    return 'LINE Admin';
  }

  if (channel === 'SYSTEM') {
    return 'System';
  }

  return null;
}

function formatPaidAmount(amountTHB: number | undefined): string | null {
  if (typeof amountTHB !== 'number' || !Number.isFinite(amountTHB)) {
    return null;
  }

  return `${amountTHB.toFixed(2)} THB`;
}

export function TransactionHistoryList() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/credits/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        } else {
          setError('ไม่สามารถโหลดประวัติได้ในขณะนี้');
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
        setError('ไม่สามารถโหลดประวัติได้ในขณะนี้');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 text-center text-muted-foreground">
        <p>{error}</p>
      </GlassCard>
    );
  }

  if (!history?.transactions.length) {
    return (
      <GlassCard className="p-6 text-center text-muted-foreground">
        <p>ไม่พบประวัติการทำรายการ</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {history.transactions.map((tx) => (
        <GlassCard key={tx.id} className="flex items-center justify-between p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-foreground">
                {getTransactionLabel(tx.type)}
              </span>
              <StatusBadge status={tx.status as any} />
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(tx.createdAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {tx.type === 'TOPUP' && (tx.externalRef || tx.paymentOrderId || tx.metadata?.amountTHB || tx.channel) ? (
              <div className="space-y-0.5 text-xs text-muted-foreground">
                {tx.externalRef ? <p>อ้างอิงการชำระเงิน: {tx.externalRef}</p> : null}
                {!tx.externalRef && tx.paymentOrderId ? <p>ออเดอร์ชำระเงิน: {tx.paymentOrderId}</p> : null}
                {formatPaidAmount(tx.metadata?.amountTHB) ? (
                  <p>ยอดที่ชำระ: {formatPaidAmount(tx.metadata?.amountTHB)}</p>
                ) : null}
                {getPaymentChannelLabel(tx.channel) ? (
                  <p>ช่องทาง: {getPaymentChannelLabel(tx.channel)}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${
              tx.amount > 0 ? 'text-success' : 'text-primary'
            }`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount} Stars
            </div>
            <div className="text-xs text-muted-foreground/60">
              Balance: {tx.balanceAfter}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
