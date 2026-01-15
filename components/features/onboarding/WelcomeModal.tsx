'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Sparkles, Star } from 'lucide-react';
import { GlassButton as Button } from '@/components/ui/button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function WelcomeModal({ isOpen, onClose, isLoading }: WelcomeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="flex flex-col items-center text-center p-6 space-y-6 max-w-sm mx-auto">
        {/* Decorative Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative bg-gradient-to-br from-primary/20 to-purple-500/20 p-4 rounded-full border border-white/10">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-primary to-purple-200 bg-clip-text text-transparent">
            ยินดีต้อนรับสู่ Mimi Tarot
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            ค้นหาคำตอบจากจักรวาล ด้วยพลัง AI อัจฉริยะ
            เราได้เตรียม <span className="text-primary font-bold">1 ดวงดาว</span> สำหรับการทำนายครั้งแรกของคุณไว้แล้ว
          </p>
        </div>

        {/* Reward Visual */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-white">+1 Free Credit</span>
        </div>

        {/* Action Button */}
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold h-12 shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:scale-[1.02]"
        >
          {isLoading ? 'กำลังเริ่มต้น...' : 'รับพรและเริ่มต้นใช้งาน'}
        </Button>
      </div>
    </Modal>
  );
}
