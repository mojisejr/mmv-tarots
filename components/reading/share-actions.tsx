'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link as LinkIcon, Check, Facebook, Twitter, Copy } from 'lucide-react';
import { GlassCard } from '@/components';
import { toast } from 'sonner';
import { useSession } from '@/lib/client/auth-client';
import { ReferralUtils } from '@/lib/referral-utils';
import { cn } from '@/lib/shared/utils';

interface ShareActionsProps {
  predictionId: string;
  cardName: string; // Used for pre-filled text
  className?: string;
  variant?: 'minimal' | 'card'; // minimal = just icon, card = big CTA
}

interface UserWithReferral {
  referralCode?: string | null;
}

// Custom TikTok Icon because Lucide doesn't have it
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

export function ShareActions({ predictionId, cardName, className = '', variant = 'minimal' }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const { data: session } = useSession();

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const user = session?.user as unknown as UserWithReferral;
    // Always append user's referral code if available
    return ReferralUtils.generateLink(window.location.origin, user?.referralCode || undefined, `/share/${predictionId}`);
  };

  const getShareText = () => {
    return ReferralUtils.shareText.prediction(cardName);
  }

  const handleFacebookShare = () => {
    const url = getShareUrl();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const url = getShareUrl();
    const text = getShareText();
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleTikTokShare = () => {
    // TikTok web doesn't support direct share intent well, so we copy the link
    // and guide the user to paste it.
    handleCopyLink();
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('คัดลอกลิงก์แล้ว! นำไปวางใน TikTok หรือแอปอื่นได้เลย', {
        duration: 3000
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const SocialButton = ({ 
    icon: Icon, 
    onClick, 
    label, 
    colorClass,
    delay = 0 
  }: { 
    icon: React.ComponentType<{ className?: string }>, 
    onClick: () => void, 
    label: string, 
    colorClass: string,
    delay?: number
  }) => (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex flex-col items-center gap-2 group relative",
        "focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-xl p-2",
        "min-w-[64px]", // Ensure touch target
        className
      )}
      aria-label={`Share to ${label}`}
      title={label}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-sm border border-white/20",
        "transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1",
        colorClass
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] text-black/50 font-medium group-hover:text-accent-300 transition-colors uppercase tracking-wider drop-shadow-sm">
        {label === 'Copy Link' ? 'Copy' : label}
      </span>
    </motion.button>
  );

  const buttonList = (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <SocialButton 
        icon={Facebook} 
        onClick={handleFacebookShare} 
        label="Facebook" 
        colorClass="bg-[#1877F2]/80 hover:bg-[#1877F2] shadow-blue-500/20" 
        delay={0.1}
      />
      <SocialButton 
        icon={Twitter} 
        onClick={handleTwitterShare} 
        label="X" 
        colorClass="bg-black/80 hover:bg-black shadow-gray-500/20" 
        delay={0.2}
      />
      <SocialButton 
        icon={TikTokIcon} 
        onClick={handleTikTokShare} 
        label="TikTok" 
        colorClass="bg-gradient-to-br from-[#00f2ea] to-[#ff0050] opacity-90 hover:opacity-100 shadow-pink-500/20" 
        delay={0.3}
      />
      <SocialButton
        icon={copied ? Check : Copy}
        onClick={handleCopyLink}
        label="Copy"
        colorClass={copied 
          ? "bg-green-500/90 shadow-green-500/20" 
          : "bg-gradient-to-br from-[#d4af37] to-[#b58d28] shadow-accent-500/30 hover:shadow-accent-500/50 hover:brightness-110 opacity-100"
        }
        delay={0.4}
      />
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${className}`}>
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
        {buttonList}
      </div>
    </GlassCard>
  );
}
