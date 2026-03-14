'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Check, Copy, Link2 } from 'lucide-react';
import { GlassCard } from '@/components';
import { toast } from 'sonner';
import { useSession } from '@/lib/client/auth-client';
import { ReferralUtils } from '@/lib/referral-utils';
import { cn } from '@/lib/shared/utils';
import { isLiffEnvironment } from '@/lib/client/liff-environment';
import { resolveShareActionOrder, type ShareActionId } from '@/lib/client/share-action-order';

interface ShareActionsProps {
  predictionId: string;
  cardName: string; // Used for pre-filled text
  className?: string;
  variant?: 'minimal' | 'card'; // minimal = just icon, card = big CTA
}

interface UserWithReferral {
  referralCode?: string | null;
}

export function ShareActions({ predictionId, cardName, className = '', variant = 'minimal' }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { data: session } = useSession();
  const isLiff = isLiffEnvironment();

  const getSharePayload = () => {
    if (typeof window === 'undefined') return '';
    const user = session?.user as unknown as UserWithReferral;
    return ReferralUtils.composePredictionPayload(
      window.location.origin,
      predictionId,
      cardName,
      user?.referralCode || undefined
    );
  };

  const getReferralCode = () => {
    const payload = getSharePayload();
    if (typeof payload === 'string') return undefined;
    return payload.code;
  };

  const handleCopyLink = () => {
    const payload = getSharePayload();
    if (typeof payload === 'string') return;
    const url = payload.url;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('คัดลอกลิงก์แล้ว! นำไปแชร์ได้ทันที', {
        duration: 3000
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyMessage = () => {
    const payload = getSharePayload();
    if (typeof payload === 'string') return;

    navigator.clipboard.writeText(payload.message).then(() => {
      setCopiedMessage(true);
      toast.success('คัดลอกข้อความแชร์แล้ว! (ลิงก์ + รหัสแนะนำ)', {
        duration: 3000,
      });
      setTimeout(() => setCopiedMessage(false), 2000);
    });
  };

  const handleCopyCode = () => {
    const referralCode = getReferralCode();
    if (!referralCode) return;

    navigator.clipboard.writeText(referralCode).then(() => {
      setCopiedCode(true);
      toast.success('คัดลอกรหัสแนะนำแล้ว! ส่งในแชท LINE ได้ทันที', {
        duration: 3000,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const ActionButton = ({ 
    icon: Icon, 
    onClick, 
    title,
    description,
    iconClass,
    copiedState,
    delay = 0 
  }: { 
    icon: React.ComponentType<{ className?: string }>, 
    onClick: () => void, 
    title: string,
    description: string,
    iconClass: string,
    copiedState?: boolean,
    delay?: number
  }) => (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-left',
        'backdrop-blur-md transition-all duration-300',
        'hover:border-accent/30 hover:bg-accent/[0.08] hover:shadow-[0_10px_30px_-20px_rgba(255,208,120,0.8)]',
        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-0',
        'min-h-[92px]'
      )}
      aria-label={title}
      title={title}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20',
          copiedState ? 'bg-green-500/20 text-green-300' : iconClass
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-foreground">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.button>
  );

  const actionOrder = resolveShareActionOrder(isLiff, Boolean(getReferralCode()));

  const actionConfig: Record<ShareActionId, {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    title: string;
    description: string;
    iconClass: string;
    copiedState?: boolean;
  }> = {
    'copy-link': {
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
      title: 'คัดลอกลิงก์',
      description: 'ลิงก์สั้น แชร์ได้กับทุกแอปทันที',
      iconClass: 'bg-accent/20 text-accent',
      copiedState: copied,
    },
    'copy-message': {
      icon: copiedMessage ? Check : Share2,
      onClick: handleCopyMessage,
      title: 'คัดลอกข้อความ',
      description: 'ได้ข้อความพร้อมลิงก์และรหัสแนะนำ (ถ้ามี)',
      iconClass: 'bg-primary/20 text-primary-foreground',
      copiedState: copiedMessage,
    },
    'copy-code': {
      icon: copiedCode ? Check : Copy,
      onClick: handleCopyCode,
      title: 'คัดลอกรหัส',
      description: 'ใช้ส่งแยกในแชทเมื่อเพื่อนเข้าลิงก์ไม่ได้',
      iconClass: 'bg-indigo-500/20 text-indigo-300',
      copiedState: copiedCode,
    },
  };

  const buttonList = (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      {actionOrder.map((actionId, index) => {
        const action = actionConfig[actionId];
        return (
          <ActionButton
            key={actionId}
            icon={action.icon}
            onClick={action.onClick}
            title={action.title}
            description={action.description}
            iconClass={action.iconClass}
            copiedState={action.copiedState}
            delay={0.1 + index * 0.1}
          />
        );
      })}
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
        {buttonList}
      </div>
    );
  }

  // Card Variant (High/CTA)
  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <h3 className="text-lg font-serif text-accent/90">
          แบ่งปันคำทำนายของคุณ
        </h3>
        <p className="max-w-xl text-sm text-muted-foreground">
          เลือกวิธีคัดลอกที่สะดวกที่สุด แล้วนำไปแชร์ต่อในช่องทางที่คุณใช้จริง
        </p>
        {buttonList}
      </div>
    </GlassCard>
  );
}
