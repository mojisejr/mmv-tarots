'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: 'TOPUP' | 'PREDICTION' | 'REFUND';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
  metadata?: any;
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

export function TransactionHistoryList() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/credits/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
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

  if (!history?.transactions.length) {
    return (
      <GlassCard className="p-6 text-center text-white/60">
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
              <span className="font-serif font-bold text-white">
                {tx.type === 'TOPUP' ? 'เติมดาว (Package)' : 
                 tx.type === 'PREDICTION' ? 'ทำนายไพ่' : 'คืนดาว (Refund)'}
              </span>
              <StatusBadge status={tx.status as any} />
            </div>
            <span className="text-xs text-white/60">
              {new Date(tx.createdAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${
              tx.amount > 0 ? 'text-success' : 'text-primary'
            }`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount} Stars
            </div>
            <div className="text-xs text-white/40">
              Balance: {tx.balanceAfter}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
