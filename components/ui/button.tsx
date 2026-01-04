import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/shared/utils';

const buttonVariants = cva(
  'relative overflow-hidden px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-sans touch-manipulation group min-h-[44px] min-w-[44px]',
  {
    variants: {
      variant: {
        primary: 'bg-primary/90 text-primary-foreground shadow-glow-primary hover:shadow-lg border-[0.5px] border-border-subtle hover:bg-primary',
        outline: 'bg-surface-card border-[0.5px] border-border-medium text-foreground hover:bg-surface-hover hover:border-border-subtle hover:shadow-md',
        ghost: 'bg-transparent text-text-muted hover:text-foreground hover:bg-surface-hover',
        icon: 'p-3.5 rounded-full aspect-square bg-surface-card hover:bg-surface-hover text-foreground border-[0.5px] border-border-subtle',
        line: 'bg-success hover:bg-success-600 text-white border-[0.5px] border-success/50 shadow-md hover:shadow-lg',
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
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-surface-hover to-transparent z-0 pointer-events-none"></div>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';