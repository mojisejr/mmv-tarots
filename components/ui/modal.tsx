'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassCard } from './card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl h-auto max-h-[90dvh] sm:max-h-[85vh] flex flex-col"
          >
            <GlassCard className="flex flex-col h-full p-0 overflow-hidden border-white/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-white/5 flex-shrink-0">
                <h2 className="text-lg sm:text-2xl font-serif text-foreground line-clamp-1">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar overscroll-contain">
                {children}
                {/* Safe area spacer for small screens */}
                <div className="h-8 sm:hidden" />
              </div>
            </GlassCard>
          </motion.div>


        </div>
      )}
    </AnimatePresence>
  );
}
