import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative overflow-hidden px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-sans touch-manipulation group',
  {
    variants: {
      variant: {
        primary: 'bg-primary/90 text-white shadow-glow-primary hover:shadow-lg border border-glass-border hover:bg-primary',
        outline: 'bg-glass-white border-glass-border text-foreground hover:bg-glass-whiteHover hover:border-glass-borderHover hover:shadow-md',
        ghost: 'bg-transparent text-muted-foreground hover:text-white hover:bg-white/5',
        icon: 'p-3.5 rounded-full aspect-square bg-glass-white hover:bg-glass-whiteHover text-foreground border border-white/5',
        line: 'bg-success hover:bg-success-600 text-white border border-success/50 shadow-md hover:shadow-lg',
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