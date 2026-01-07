'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Link as LinkIcon, Check, Facebook, Twitter } from 'lucide-react';
import { GlassButton, GlassCard } from '@/components';
import { toast } from 'sonner';
import { useSession } from '@/lib/client/auth-client';

interface ShareActionsProps {
  predictionId: string;
  cardName: string; // Used for pre-filled text
  className?: string;
  variant?: 'minimal' | 'card'; // minimal = just icon, card = big CTA
}

export function ShareActions({ predictionId, cardName, className = '', variant = 'minimal' }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const { data: session } = useSession();

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = `${window.location.origin}/share/${predictionId}`;
    
    // Append referral code if user is logged in
    const referralCode = (session?.user as any)?.referralCode;
    if (referralCode) {
      return `${baseUrl}?ref=${referralCode}`;
    }
    
    return baseUrl;
  };

  const handleShare = async () => {
    const url = getShareUrl();
    const shareData = {
      title: 'MimiVibe Tarot Prediction',
      text: `ฉันได้รับไพ่ "${cardName}" มาดูคำทำนายของฉันและเปิดไพ่ของคุณได้ที่นี่ ✨`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback if share dialog is closed or fails
    }
  };

  const copyToClipboard = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('คัดลอกลิงก์แล้ว ส่งให้เพื่อนได้เลย!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleShare}
        className={`p-2 rounded-full bg-accent/5 border border-accent/10 hover:bg-accent/10 text-accent transition-all ${className}`}
        aria-label="Share prediction"
      >
        <Share2 className="w-4 h-4" />
      </button>
    );
  }

  // Card Variant (CTA)
  return (
    <GlassCard className={`p-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden relative ${className}`}>
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 text-white">
            <Share2 className="w-6 h-6" />
        </div>
        
        <h3 className="text-xl font-serif text-foreground mb-2">
          แชร์ความเฮงให้เพื่อน
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          ส่งต่อคำทำนายดีๆ หรือชวนเพื่อนมาเปิดไพ่ด้วยกัน
        </p>

        <div className="flex gap-3 w-full justify-center max-w-md">
            <GlassButton 
                onClick={handleShare}
                className="flex-1 bg-primary/20 hover:bg-primary/30 border-primary/30 text-foreground py-3"
            >
                <span className="flex items-center gap-2 justify-center">
                    <Share2 className="w-5 h-5" />
                    แชร์คำทำนาย
                </span>
            </GlassButton>
            
            <button
                onClick={copyToClipboard}
                className="p-3 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 text-foreground/80 transition-all flex items-center justify-center"
                title="Copy Link"
            >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <LinkIcon className="w-5 h-5" />}
            </button>
        </div>
      </div>
    </GlassCard>
  );
}
