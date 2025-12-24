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
          bgColor: 'bg-warning/20',
          textColor: 'text-warning',
          borderColor: 'border-warning/30',
          message: message || 'รอคิว...',
          icon: Clock,
          testId: 'status-icon-pending',
        };
      case 'PROCESSING':
        return {
          bgColor: 'bg-info/20',
          textColor: 'text-info',
          borderColor: 'border-info/30',
          message: message || 'กำลังทำนาย...',
          icon: Loader2,
          testId: 'status-icon-processing',
        };
      case 'COMPLETED':
      case 'SUCCESS':
        return {
          bgColor: 'bg-success/20',
          textColor: 'text-success',
          borderColor: 'border-success/30',
          message: message || (status === 'SUCCESS' ? 'สำเร็จ' : 'ทำนายเสร็จแล้ว'),
          icon: CheckCircle2,
          testId: 'status-icon-completed',
        };
      case 'FAILED':
        return {
          bgColor: 'bg-destructive/20',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/30',
          message: message || 'ไม่สำเร็จ',
          icon: AlertCircle,
          testId: 'status-icon-failed',
        };
      default:
        return {
          bgColor: 'bg-muted/20',
          textColor: 'text-muted-foreground',
          borderColor: 'border-muted/30',
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
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium backdrop-blur-sm transition-all duration-300 ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon
        data-testid={config.testId}
        className={`w-3.5 h-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`}
      />
      <span>{config.message}</span>
    </div>
  );
}