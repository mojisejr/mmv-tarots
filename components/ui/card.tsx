import React from 'react';
import { cn } from '@/lib/shared/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative backdrop-blur-md bg-surface-card border border-border-subtle shadow-warm rounded-[1.5rem] p-6 text-foreground',
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 rounded-[1.5rem] border-[0.5px] border-border-subtle pointer-events-none opacity-50"></div>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';