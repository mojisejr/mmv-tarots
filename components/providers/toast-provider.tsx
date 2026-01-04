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
          toast: 'bg-white/80 backdrop-blur-xl border border-primary/20 text-foreground',
          title: 'text-foreground font-medium',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-foreground',
          cancelButton: 'bg-primary/10 text-foreground',
          closeButton: 'bg-primary/10 text-foreground hover:bg-primary/20',
        },
      }}
      richColors
    />
  );
}
