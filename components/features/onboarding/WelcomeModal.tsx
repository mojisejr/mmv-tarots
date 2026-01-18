'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/card';
import { GlassButton } from '@/components/ui/button';
import { MimiLoadingAvatar } from '@/components/features/avatar/mimi-loading-avatar';
import { Star, Clock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

type Step = 'greeting' | 'rules' | 'gift';

export function WelcomeModal({ isOpen, onClose, isLoading }: WelcomeModalProps) {
  const [step, setStep] = useState<Step>('greeting');

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const renderContent = () => {
    switch (step) {
      case 'greeting':
        return (
          <motion.div
            key="greeting"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
              <MimiLoadingAvatar />
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <h2 className="text-2xl font-bold text-foreground">
              ยินดีตต้อนรับนี่คือแม่หมอมีมี่
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-secondary">
                "แม่หมอมีมี่รอคอยที่จะได้พบคุณ... <br/>
                จักรวาลมีคำตอบสำหรับทุกคำถามของคุณเสมอ"
              </p>
            </div>

            <GlassButton 
              onClick={() => setStep('rules')}
              className="w-full max-w-xs group"
            >
              <span className="mr-2">เริ่มต้น</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
          </motion.div>
        );

      case 'rules':
        return (
          <motion.div
            key="rules"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">ข้อคำถาม (Stars)</h3>
              <p className="text-sm text-foreground/70">ค่าใช้จ่าย และ การทำงานของระบบเบื้องต้น</p>
            </div>

            <div className="grid gap-4 w-full">
              <GlassCard className="p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-full bg-accent/10 text-accent-500">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">การแลกเปลี่ยน</h4>
                  <p className="text-xs text-foreground/70">1 คำทำนาย แลกเปลี่ยนด้วย 1 ดวงดาว</p>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">การรอคอย</h4>
                  <p className="text-xs text-foreground/70">ต้องพัก 30 วินาที ระหว่างคำทำนาย</p>
                </div>
              </GlassCard>
            </div>

            <GlassButton 
              variant="line"
              onClick={() => setStep('gift')}
              className="w-full max-w-xs mt-4"
            >
              <span className="mr-2">เข้าใจแล้ว</span>
              <Sparkles className="w-4 h-4" />
            </GlassButton>
          </motion.div>
        );

      case 'gift':
        return (
          <motion.div
            key="gift"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
              <div className="relative p-6 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full border border-white/20 shadow-glow-accent">
                <Star className="w-16 h-16 text-accent-500 fill-accent-500 animate-pulse" />
              </div>
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-2 -right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>ได้รับแล้ว</span>
              </motion.div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-500 to-primary-600 bg-clip-text text-transparent">
                +1 Free Star
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed max-w-xs mx-auto">
                ดวงดาวแห่งการเริ่มต้นถูกประดับในดวงชะตาของคุณแล้ว... ขอให้คำทำนายแรกนำทางแสงสว่างมาสู่คุณ
              </p>
            </div>

            <GlassButton 
              disabled={isLoading}
              onClick={onClose}
              className="w-full max-w-xs shadow-glow-primary hover:scale-[1.02] transition-transform"
            >
              {isLoading ? 'กำลังโหลด...' : 'ไปดูดวง'}
            </GlassButton>
          </motion.div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="ยินดีต้อนรับสู่ MimiVibe Tarot">
      <div className="p-2 sm:p-4 min-h-[400px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
        
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {(['greeting', 'rules', 'gift'] as Step[]).map((s, i) => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === s ? 'w-8 bg-primary' : 
                (['greeting', 'rules', 'gift'].indexOf(step) > i) ? 'w-2 bg-primary/50' : 'w-2 bg-border-medium'
              }`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
