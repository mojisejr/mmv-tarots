'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/card';
import { MimiLoadingAvatar } from '../../components/features/avatar/mimi-loading-avatar';
import { Copy, CheckCircle2 } from '../../components/icons';
import { WAITING_STEPS, FUN_FACTS } from '../../constants/waiting-steps';

interface SubmittedPageProps {
  jobId: string;
  onComplete: () => void;
}

export default function SubmittedPage({ jobId, onComplete }: SubmittedPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < WAITING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 3500);

    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 15000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(quoteInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  const copyJobId = () => {
    alert(`Copied Ticket ID: ${jobId}`);
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4 h-full flex flex-col justify-center pb-20">
      <GlassCard className="text-center p-0 overflow-hidden !bg-white/5 !border-white/10">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-1000 ease-linear shadow-[0_0_10px_var(--primary)]"
            style={{ width: `${((currentStepIndex + 1) / WAITING_STEPS.length) * 100}%` }}
          ></div>
        </div>

        <div className="pt-12 pb-8 px-6">
          <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <MimiLoadingAvatar />
            </div>
            <div className="absolute inset-0 bg-[var(--primary)] opacity-30 blur-[60px] rounded-full animate-pulse"></div>
          </div>

          <h2 className="text-2xl font-serif text-white mb-3 drop-shadow-md">Connecting...</h2>
          <div
            className="flex items-center justify-center gap-2 text-xs text-white/60 mb-10 bg-white/5 hover:bg-white/10 py-2 px-5 rounded-full w-fit mx-auto cursor-pointer transition-colors font-mono border border-white/10"
            onClick={copyJobId}
          >
            <span>#{jobId}</span>
            <Copy className="w-3 h-3" />
          </div>

          <div className="space-y-4 text-left w-full max-w-xs mx-auto font-sans">
            {WAITING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 border ${
                  index === currentStepIndex
                    ? 'bg-white/10 border-white/20 text-white scale-105 shadow-lg backdrop-blur-sm'
                    : index < currentStepIndex
                    ? 'border-transparent text-white/40'
                    : 'border-transparent text-white/10'
                }`}
              >
                <div className={`p-2 rounded-full ${index <= currentStepIndex ? 'bg-white/10 text-[var(--primary)]' : 'bg-white/5'}`}>
                  {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : <step.Icon className="w-5 h-5" />}
                </div>
                <span className="font-medium text-sm tracking-wide">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 p-5 border-t border-white/5 mt-4 min-h-[90px] flex items-center justify-center backdrop-blur-sm">
          <p className="text-sm text-white/70 italic animate-fade-in font-serif px-4 leading-relaxed">
            "{FUN_FACTS[quoteIndex]}"
          </p>
        </div>
      </GlassCard>

      <p className="text-center text-[10px] text-white/30 mt-8 font-sans uppercase tracking-widest">
        You can close this window.
      </p>
    </div>
  );
}