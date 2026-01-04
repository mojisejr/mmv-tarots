'use client';

import React from 'react';
import { MimiLoadingAvatar } from '../features/avatar/mimi-loading-avatar';
import { useNavigation } from '@/lib/client/providers/navigation-provider';

/**
 * Global Loading Overlay
 * Shows a full-page mystical loading state during initial session check
 * and balance fetching to ensure a smooth "Above the Fold" experience.
 */
export function GlobalLoading() {
  const { isInitialLoading } = useNavigation();

  if (!isInitialLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-fade-in">
      <div className="w-48 h-48 md:w-64 md:h-64">
        <MimiLoadingAvatar />
      </div>
      <p className="mt-8 text-lg font-serif text-primary-strong animate-pulse">
        Connecting to the stars...
      </p>
    </div>
  );
}
