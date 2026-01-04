import React from 'react';
import { cn } from '@/lib/shared/utils';

interface FloatingBadgeProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  animate?: boolean;
}

export function FloatingBadge({ 
  children, 
  position = 'top-right', 
  className,
  animate = true
}: FloatingBadgeProps) {
  const positionClasses = {
    'top-left': '-top-8 left-4',
    'top-right': '-top-8 right-4',
    'bottom-left': '-bottom-8 left-4',
    'bottom-right': '-bottom-8 right-4',
  };

  return (
    <div className={cn(
      "absolute z-10", 
      positionClasses[position],
      animate && "animate-fade-in"
    )}>
      <div className={cn(
        "bg-surface-card backdrop-blur-md border border-border-subtle rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg",
        className
      )}>
        {children}
      </div>
    </div>
  );
}
