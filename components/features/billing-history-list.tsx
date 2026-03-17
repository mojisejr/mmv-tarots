'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlassButton } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type BillingStatus =
  | 'PENDING_PAYMENT'
  | 'SLIP_UPLOADED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CREDITED';

interface BillingItem {
  id: string;
  referenceCode: string;
  status: BillingStatus;
  amountTHB: number;
  createdAt: string;
  verifiedAt: string | null;
  creditedAt: string | null;
  verificationErrorCode: string | null;
  verificationErrorMessage: string | null;
  package: {
    id: string;
    name: string;
    stars: number;
  };
}

interface BillingResponse {
  success: boolean;
  data: {
    items: BillingItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

const STATUS_META: Record<BillingStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: 'รอชำระเงิน',
    className: 'bg-amber-500/10 text-amber-700 border border-amber-500/30',
  },
  SLIP_UPLOADED: {
    label: 'ส่งสลิปแล้ว',
    className: 'bg-sky-500/10 text-sky-700 border border-sky-500/30',
  },
  VERIFYING: {
    label: 'กำลังตรวจสอบ',
    className: 'bg-blue-500/10 text-blue-700 border border-blue-500/30',
  },
  VERIFIED: {
    label: 'ยืนยันแล้ว',
    className: 'bg-violet-500/10 text-violet-700 border border-violet-500/30',
  },
  REJECTED: {
    label: 'ไม่ผ่านการตรวจสอบ',
    className: 'bg-rose-500/10 text-rose-700 border border-rose-500/30',
  },
  EXPIRED: {
    label: 'หมดเวลา',
    className: 'bg-orange-500/10 text-orange-700 border border-orange-500/30',
  },
  CREDITED: {
    label: 'เครดิตเข้าแล้ว',
    className: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30',
  },
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shouldShowSupportCTA(status: BillingStatus): boolean {
  return status === 'REJECTED' || status === 'EXPIRED' || status === 'VERIFYING';
}

function buildSupportMessage(item: BillingItem): string {
  const statusLabel = STATUS_META[item.status].label;
  const parts = [
    'สวัสดีทีมงาน MMV,',
    '',
    'ต้องการให้ช่วยตรวจสอบรายการเติมเครดิตนี้ครับ',
    `Reference: ${item.referenceCode}`,
    `Status: ${statusLabel} (${item.status})`,
    `Package: ${item.package.name} (${item.package.stars} Stars)`,
    `Amount: ${item.amountTHB} THB`,
    `CreatedAt: ${item.createdAt}`,
  ];

  if (item.verificationErrorCode || item.verificationErrorMessage) {
    parts.push(
      `VerificationErrorCode: ${item.verificationErrorCode || '-'}`,
      `VerificationErrorMessage: ${item.verificationErrorMessage || '-'}`
    );
  }

  return parts.join('\n');
}

export function BillingHistoryList() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch('/api/payment/orders/me?page=1&pageSize=20');
        if (!res.ok) {
          setError('ไม่สามารถโหลดประวัติการชำระเงินได้ในขณะนี้');
          return;
        }

        const payload = (await res.json()) as BillingResponse;
        setItems(payload.data?.items ?? []);
      } catch (fetchError) {
        console.error('Failed to fetch billing history:', fetchError);
        setError('ไม่สามารถโหลดประวัติการชำระเงินได้ในขณะนี้');
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

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

  if (!hasItems) {
    return (
      <GlassCard className="p-6 text-center text-muted-foreground">
        <p>ยังไม่มีประวัติการเติมเครดิต</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const createdAt = formatDate(item.createdAt);
        const verifiedAt = formatDate(item.verifiedAt);
        const creditedAt = formatDate(item.creditedAt);
        const statusMeta = STATUS_META[item.status];

        return (
          <GlassCard key={item.id} className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-serif text-foreground text-base sm:text-lg">{item.package.name}</p>
                <p className="text-xs text-muted-foreground">Ref: {item.referenceCode}</p>
                <p className="text-sm text-muted-foreground">{item.package.stars} Stars</p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-lg font-semibold text-foreground">{item.amountTHB.toFixed(2)} THB</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <p>สร้างรายการ: {createdAt || '-'}</p>
              <p>ตรวจสอบแล้ว: {verifiedAt || '-'}</p>
              <p>เครดิตเข้า: {creditedAt || '-'}</p>
            </div>

            {(item.verificationErrorCode || item.verificationErrorMessage) && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-700">
                <p className="font-medium">รายละเอียดข้อผิดพลาด</p>
                <p>Code: {item.verificationErrorCode || '-'}</p>
                <p>Message: {item.verificationErrorMessage || '-'}</p>
              </div>
            )}

            {shouldShowSupportCTA(item.status) && (
              <div className="pt-1">
                <GlassButton
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `Billing Support: ${item.referenceCode} (${item.status})`
                    );
                    const body = encodeURIComponent(buildSupportMessage(item));
                    window.location.href = `mailto:support@mmv-tarots.com?subject=${subject}&body=${body}`;
                  }}
                >
                  ติดต่อทีมงานพร้อมข้อมูลรายการนี้
                </GlassButton>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}