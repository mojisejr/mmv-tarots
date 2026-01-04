import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from './icons';

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SUCCESS';
  message?: string;
}

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-500/20',
          glowColor: 'shadow-[0_0_10px_rgba(245,158,11,0.1)]',
          message: message || 'รอคิว...',
          icon: Clock,
          testId: 'status-icon-pending',
        };
      case 'PROCESSING':
        return {
          bgColor: 'bg-indigo-500/10',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-500/20',
          glowColor: 'shadow-[0_0_10px_rgba(99,102,241,0.1)]',
          message: message || 'กำลังทำนาย...',
          icon: Loader2,
          testId: 'status-icon-processing',
        };
      case 'COMPLETED':
      case 'SUCCESS':
        return {
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-500/20',
          glowColor: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]',
          message: message || (status === 'SUCCESS' ? 'สำเร็จ' : 'ทำนายเสร็จแล้ว'),
          icon: CheckCircle2,
          testId: 'status-icon-completed',
        };
      case 'FAILED':
        return {
          bgColor: 'bg-rose-500/10',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-500/20',
          glowColor: 'shadow-[0_0_10px_rgba(244,63,94,0.1)]',
          message: message || 'ไม่สำเร็จ',
          icon: AlertCircle,
          testId: 'status-icon-failed',
        };
      default:
        return {
          bgColor: 'bg-slate-500/10',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-500/20',
          glowColor: '',
          message: 'ไม่ทราบสถานะ',
          icon: AlertCircle,
          testId: 'status-icon-unknown',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      data-testid="status-badge"
      role="status"
      aria-label={`สถานะ: ${config.message}`}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider font-medium backdrop-blur-md transition-all duration-500 ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.glowColor} group-hover:scale-105`}
    >
      <Icon
        data-testid={config.testId}
        className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`}
      />
      <span>{config.message}</span>
    </div>
  );
}