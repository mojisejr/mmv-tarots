import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from './icons';

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-300',
          borderColor: 'border-yellow-500/30',
          message: 'รอคิว...',
          icon: Clock,
          testId: 'status-icon-pending',
        };
      case 'PROCESSING':
        return {
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-500/30',
          message: 'กำลังทำนาย...',
          icon: Loader2,
          testId: 'status-icon-processing',
        };
      case 'COMPLETED':
        return {
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-300',
          borderColor: 'border-green-500/30',
          message: 'ทำนายเสร็จแล้ว',
          icon: CheckCircle2,
          testId: 'status-icon-completed',
        };
      case 'FAILED':
        return {
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-500/30',
          message: 'ไม่สามารถทำนายได้',
          icon: AlertCircle,
          testId: 'status-icon-failed',
        };
      default:
        return {
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-500/30',
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