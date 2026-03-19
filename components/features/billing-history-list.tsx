'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GlassButton } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { PaymentErrorCategory } from '@/lib/shared/payment-error-semantics';

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
  errorCategory: PaymentErrorCategory;
  retryAfterMinutes: number | null;
  delayMinutes: number | null;
  package: {
    id: string;
    name: string;
    stars: number;
  };
  latestVerificationLog: {
    id: string;
    provider: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
  } | null;
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
    filters: {
      status: BillingStatus[];
      showAll: boolean;
    };
  };
}

const MEANINGFUL_FILTER_OPTIONS: Array<{ value: 'ALL' | BillingStatus; label: string }> = [
  { value: 'ALL', label: 'รายการชำระเงินจริง' },
  { value: 'SLIP_UPLOADED', label: 'ส่งสลิปแล้ว' },
  { value: 'VERIFYING', label: 'กำลังตรวจสอบ' },
  { value: 'VERIFIED', label: 'ยืนยันแล้ว' },
  { value: 'REJECTED', label: 'ไม่ผ่านการตรวจสอบ' },
  { value: 'CREDITED', label: 'เครดิตเข้าแล้ว' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

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

function getErrorGuidance(item: BillingItem): string | null {
  if (item.errorCategory === 'RECEIVER_MISMATCH') {
    return 'บัญชีปลายทางไม่ตรงกับบัญชีร้าน กรุณาตรวจสอบบัญชีผู้รับแล้วชำระใหม่';
  }

  if (item.errorCategory === 'DELAYED_RECHECK') {
    const delay = item.delayMinutes ?? item.retryAfterMinutes ?? 15;
    return `ธนาคารยังประมวลผลไม่เสร็จ กรุณารอประมาณ ${delay} นาที แล้วตรวจสอบอีกครั้ง`;
  }

  if (item.errorCategory === 'TEMPORARY') {
    const retry = item.retryAfterMinutes ?? 15;
    return `ระบบธนาคารขัดข้องชั่วคราว แนะนำให้รอ ${retry} นาที แล้วลองใหม่อีกครั้ง`;
  }

  if (item.errorCategory === 'AMOUNT_MISMATCH') {
    return 'ยอดเงินในสลิปไม่ตรงกับยอดคำสั่งซื้อ กรุณาตรวจสอบจำนวนเงินก่อนส่งสลิป';
  }

  if (item.errorCategory === 'DUPLICATE') {
    return 'สลิปนี้ถูกใช้งานไปแล้ว กรุณาใช้สลิปรายการใหม่ที่ยังไม่เคยส่ง';
  }

  return null;
}

function buildSupportMessage(item: BillingItem): string {
  const statusLabel = STATUS_META[item.status].label;
  const guidance = getErrorGuidance(item);
  const parts = [
    'สวัสดีทีมงาน MMV,',
    '',
    'ต้องการให้ช่วยตรวจสอบรายการเติมเครดิตนี้ครับ',
    `Reference: ${item.referenceCode}`,
    `Status: ${statusLabel} (${item.status})`,
    `Package: ${item.package.name} (${item.package.stars} Stars)`,
    `Amount: ${item.amountTHB} THB`,
    `CreatedAt: ${item.createdAt}`,
    `ErrorCategory: ${item.errorCategory}`,
  ];

  if (guidance) {
    parts.push(`SuggestedGuidance: ${guidance}`);
  }

  return parts.join('\n');
}

type SupportTicketState = 'idle' | 'submitting' | 'success' | 'error';

async function submitBillingSupportTicket(item: BillingItem): Promise<void> {
  const res = await fetch('/api/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: buildSupportMessage(item),
      context: {
        url: '/billing',
      },
      billing: {
        referenceCode: item.referenceCode,
        status: item.status,
        packageName: item.package.name,
        amountTHB: item.amountTHB,
        errorCategory: item.errorCategory,
        verificationErrorCode: item.verificationErrorCode,
        verificationErrorMessage: item.verificationErrorMessage,
        latestLogStatus: item.latestVerificationLog?.status ?? null,
        latestLogProvider: item.latestVerificationLog?.provider ?? null,
        latestLogAt: item.latestVerificationLog?.createdAt ?? null,
      },
    }),
  });

  if (!res.ok) {
    throw new Error('Support ticket submission failed');
  }
}

export function BillingHistoryList() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BillingStatus>('ALL');
  const [showAll, setShowAll] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketStates, setTicketStates] = useState<Record<string, SupportTicketState>>({});

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });

        if (statusFilter !== 'ALL') {
          params.set('status', statusFilter);
        } else if (showAll) {
          params.set('showAll', 'true');
        }

        const res = await fetch(`/api/payment/orders/me?${params.toString()}`);
        if (!res.ok) {
          setError('ไม่สามารถโหลดประวัติการชำระเงินได้ในขณะนี้');
          setItems([]);
          return;
        }

        const payload = (await res.json()) as BillingResponse;
        setItems(payload.data?.items ?? []);
        setTotalPages(payload.data?.pagination?.totalPages ?? 0);
        setTotalItems(payload.data?.pagination?.total ?? 0);
      } catch (fetchError) {
        console.error('Failed to fetch billing history:', fetchError);
        setError('ไม่สามารถโหลดประวัติการชำระเงินได้ในขณะนี้');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [page, pageSize, statusFilter, showAll]);

  const handleSupportTicket = useCallback(async (item: BillingItem) => {
    setTicketStates((prev) => ({ ...prev, [item.id]: 'submitting' }));
    try {
      await submitBillingSupportTicket(item);
      setTicketStates((prev) => ({ ...prev, [item.id]: 'success' }));
    } catch {
      setTicketStates((prev) => ({ ...prev, [item.id]: 'error' }));
    }
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
      <GlassCard className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm text-muted-foreground flex flex-col gap-1.5">
            สถานะ
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as 'ALL' | BillingStatus);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {MEANINGFUL_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted-foreground flex flex-col gap-1.5">
            จำนวนต่อหน้า
            <select
              value={String(pageSize)}
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size} className="bg-slate-900 text-slate-100">
                  {size} รายการ
                </option>
              ))}
            </select>
          </label>

          <div className="text-sm text-muted-foreground flex flex-col justify-end gap-1">
            <p>ทั้งหมด: {totalItems} รายการ</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(event) => {
                  setPage(1);
                  setShowAll(event.target.checked);
                  if (event.target.checked) {
                    setStatusFilter('ALL');
                  }
                }}
                className="h-3.5 w-3.5 rounded border-border-subtle"
              />
              <span className="text-xs">ดูรายการทั้งหมด (รวม QR ที่ยังไม่ได้ชำระ)</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {items.map((item) => {
        const createdAt = formatDate(item.createdAt);
        const verifiedAt = formatDate(item.verifiedAt);
        const creditedAt = formatDate(item.creditedAt);
        const statusMeta = STATUS_META[item.status];
        const guidance = getErrorGuidance(item);

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
                <p>Category: {item.errorCategory}</p>
                {item.retryAfterMinutes ? <p>Retry After: {item.retryAfterMinutes} นาที</p> : null}
                {item.delayMinutes ? <p>Delay: {item.delayMinutes} นาที</p> : null}
                {guidance ? <p className="font-medium">คำแนะนำ: {guidance}</p> : null}
              </div>
            )}

            {shouldShowSupportCTA(item.status) && (
              <div className="pt-1">
                {ticketStates[item.id] === 'success' ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    ส่งคำขอช่วยเหลือเรียบร้อยแล้ว ทีมงานจะตรวจสอบโดยเร็ว
                  </p>
                ) : ticketStates[item.id] === 'error' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-rose-600">ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง</p>
                    <GlassButton
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => handleSupportTicket(item)}
                    >
                      ลองส่งอีกครั้ง
                    </GlassButton>
                  </div>
                ) : (
                  <GlassButton
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={ticketStates[item.id] === 'submitting'}
                    onClick={() => handleSupportTicket(item)}
                  >
                    {ticketStates[item.id] === 'submitting'
                      ? 'กำลังส่ง...'
                      : 'ติดต่อทีมงานพร้อมข้อมูลรายการนี้'}
                  </GlassButton>
                )}
              </div>
            )}
          </GlassCard>
        );
      })}

      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <GlassButton
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            หน้าก่อนหน้า
          </GlassButton>

          <p className="text-xs text-muted-foreground">
            หน้า {page} / {totalPages > 0 ? totalPages : 1}
          </p>

          <GlassButton
            variant="outline"
            disabled={loading || totalPages <= 0 || page >= totalPages}
            onClick={() => setPage((prev) => (totalPages > 0 ? Math.min(totalPages, prev + 1) : prev + 1))}
          >
            หน้าถัดไป
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}