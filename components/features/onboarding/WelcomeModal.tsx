'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/card';
import { GlassButton } from '@/components/ui/button';
import { MimiLoadingAvatar } from '@/components/features/avatar/mimi-loading-avatar';
import { Star, Clock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COVENANT_ACCEPTANCE_LABEL,
  COVENANT_POLICY_LINKS,
  COVENANT_SUMMARY_ITEMS,
} from '@/constants/covenant-summary';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  isError?: boolean;
  hasReferral?: boolean;
}

type Step = 'greeting' | 'rules' | 'gift' | 'covenant';

export function WelcomeModal({ 
  isOpen, 
  onClose, 
  isLoading, 
  isError = false,
  hasReferral = false 
}: WelcomeModalProps) {
  const [step, setStep] = useState<Step>('greeting');
  const [covenantAccepted, setCovenantAccepted] = useState(false);
  
  // Hard Gate Protocol: Prevent closing by accidental clicks or ESC
  const handleNoOpClose = () => {
    // Intentionally empty to prevent closing via backdrop or standard methods
    // We only allow closing via the explicit completion action
  };

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
              ยินดีต้อนรับ นี่คือ Mimi Guide มีมี่
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed font-secondary">
                "มีมี่พร้อมต้อนรับคุณสู่เส้นทางการสะท้อนใจ... <br/>
                ทุกคำถามของคุณมีพื้นที่สำหรับคำแนะนำที่อ่อนโยนเสมอ"
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
              <h3 className="text-xl font-bold text-foreground">พลังงานการใช้งาน (Stars)</h3>
              <p className="text-sm text-foreground/70">ค่าใช้จ่าย และการทำงานของระบบเบื้องต้น</p>
            </div>

            <div className="grid gap-4 w-full">
              <GlassCard className="p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-full bg-accent/10 text-accent-500">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">การแลกเปลี่ยน</h4>
                  <p className="text-xs text-foreground/70">1 คำแนะนำส่วนบุคคล แลกเปลี่ยนด้วย 1 ดวงดาว</p>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">การรอคอย</h4>
                  <p className="text-xs text-foreground/70">ต้องพัก 30 วินาที ระหว่างการรับคำแนะนำ</p>
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
                {hasReferral ? (
                  <div className="flex gap-1 justify-center">
                     <Star className="w-12 h-12 text-accent-500 fill-accent-500 animate-pulse delay-75" />
                     <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 animate-pulse" />
                  </div>
                ) : (
                  <Star className="w-16 h-16 text-accent-500 fill-accent-500 animate-pulse" />
                )}
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
                {hasReferral ? '+2 Free Stars' : '+1 Free Star'}
              </h2>
              {isError ? (
                <p className="text-sm text-destructive font-medium animate-pulse">
                  เกิดข้อขัดแย้งในการทำพิธี กรุณาลองใหม่อีกครั้งครับ
                </p>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed max-w-xs mx-auto">
                  {hasReferral 
                    ? "ยินดีด้วย! คุณได้รับ 1 ดาวจากมีมี่ และอีก 1 ดาวจากคำแนะนำของเพื่อน... ขอให้สนุกกับการสำรวจตัวเอง"
                    : "พลังงานแห่งการเริ่มต้นกำลังนำทางคุณแล้ว... ขอให้คำแนะนำแรกช่วยเติมความชัดเจนในใจคุณ"}
                </p>
              )}
            </div>

            <GlassButton 
              disabled={isLoading}
              onClick={() => setStep('covenant')}
              variant={isError ? "outline" : "line"}
              className={`w-full max-w-xs transition-transform ${!isError && 'shadow-glow-primary hover:scale-[1.02]'}`}
            >
              ต่อไป
            </GlassButton>
          </motion.div>
        );

      case 'covenant':
        return (
          <motion.div
            key="covenant"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col text-left space-y-4"
          >
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground">พันธสัญญาแห่งดวงดาว</h3>
              <p className="text-xs text-foreground/70">โปรดอ่านสรุปข้อตกลงก่อนเริ่มใช้งาน</p>
            </div>

            <GlassCard className="p-4 max-h-[220px] overflow-y-auto space-y-3">
              {COVENANT_SUMMARY_ITEMS.map((item) => (
                <div key={item.key} className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                  <p className="text-xs leading-relaxed text-foreground/70">{item.description}</p>
                </div>
              ))}
            </GlassCard>

            <div className="flex flex-wrap gap-2 justify-center">
              {COVENANT_POLICY_LINKS.map((policy) => (
                <Link
                  key={policy.key}
                  href={policy.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs rounded-full border border-white/20 bg-white/40 px-3 py-1.5 text-foreground/80 hover:text-foreground transition-colors"
                >
                  {policy.label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCovenantAccepted((prev) => !prev)}
              className="w-full rounded-xl border border-white/20 bg-white/40 p-3 text-left text-xs text-foreground/80 hover:border-primary/40 transition-colors"
            >
              <span className="inline-flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    covenantAccepted
                      ? 'border-primary bg-primary text-white'
                      : 'border-foreground/30 bg-transparent text-transparent'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <span>{COVENANT_ACCEPTANCE_LABEL}</span>
              </span>
            </button>

            {isError && (
              <p className="text-center text-xs text-destructive font-medium">
                เกิดข้อขัดข้องในการบันทึกการยอมรับ กรุณาลองอีกครั้ง
              </p>
            )}

            <GlassButton
              disabled={!covenantAccepted || isLoading}
              onClick={onClose}
              variant={isError ? 'outline' : 'line'}
              className="w-full max-w-xs mx-auto"
            >
              {isLoading ? 'กำลังทำพิธี...' : isError ? 'ลองใหม่อีกครั้ง' : 'เริ่มรับคำแนะนำ'}
            </GlassButton>
          </motion.div>
        );
    }
  };

  return (
    <Modal 
       isOpen={isOpen} 
       onClose={handleNoOpClose} 
       title="ยินดีต้อนรับสู่ MimiVibe: Your Persona Guidance"
       hideCloseButton={true} // @ts-ignore - Will implement in Modal next
    >
      <div className="p-2 sm:p-4 min-h-[400px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
        
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {(['greeting', 'rules', 'gift', 'covenant'] as Step[]).map((s, i) => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === s ? 'w-8 bg-primary' : 
                (['greeting', 'rules', 'gift', 'covenant'].indexOf(step) > i) ? 'w-2 bg-primary/50' : 'w-2 bg-border-medium'
              }`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
