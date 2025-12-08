import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative overflow-hidden px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-sans touch-manipulation group',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)]/90 text-white shadow-[0_0_20px_rgba(242,118,105,0.4)] hover:shadow-[0_0_30px_rgba(242,118,105,0.6)] border border-white/10 hover:bg-[var(--primary)]',
        outline: 'bg-white/5 border border-white/10 text-[var(--foreground)] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
        ghost: 'bg-transparent text-[var(--muted-foreground)] hover:text-white hover:bg-white/5',
        icon: 'p-3.5 rounded-full aspect-square bg-white/5 hover:bg-white/10 text-[var(--foreground)] border border-white/5',
        line: 'bg-[#06C755] hover:bg-[#05b34c] text-white border border-[#06C755]/50 shadow-[0_4px_15px_rgba(6,199,85,0.3)] hover:shadow-[0_6px_25px_rgba(6,199,85,0.5)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 pointer-events-none"></div>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';