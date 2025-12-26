'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast notification provider using Sonner
 * Place this in the root layout to enable toast notifications app-wide
 */
export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'bg-black/80 backdrop-blur-xl border border-white/10 text-white',
          title: 'text-white font-medium',
          description: 'text-white/70',
          actionButton: 'bg-primary text-white',
          cancelButton: 'bg-white/10 text-white',
          closeButton: 'bg-white/10 text-white hover:bg-white/20',
        },
      }}
      richColors
    />
  );
}
