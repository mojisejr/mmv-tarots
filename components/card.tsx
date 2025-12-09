import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative backdrop-blur-xl bg-glass-white border-glass-border shadow-glass rounded-[1.5rem] p-6 text-foreground',
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 rounded-[1.5rem] border border-white/5 pointer-events-none"></div>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';