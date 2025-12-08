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
          'relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-[1.5rem] p-6 text-[var(--foreground)]',
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