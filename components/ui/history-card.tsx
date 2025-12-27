import React from 'react';
import { ChevronRight, Sparkles } from './icons';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/shared/utils';

interface HistoryCardProps {
  prediction: {
    id: string;
    question: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    selectedCards?: any[];
  };
  onClick: (id: string) => void;
}

export function HistoryCard({ prediction, onClick }: HistoryCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(prediction.id);
  };

  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      data-testid="history-card"
      role="button"
      tabIndex={0}
      aria-label={`Prediction: ${prediction.question}`}
      className="group relative flex flex-col h-full min-h-[280px] bg-glass-white hover:bg-glass-whiteHover border border-glass-border hover:border-primary/30 rounded-[1.5rem] p-6 cursor-pointer transition-all duration-500 backdrop-blur-xl hover:-translate-y-1 hover:shadow-glass-hover overflow-hidden"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(prediction.id);
        }
      }}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Top Row: Status & Date */}
      <div className="relative flex justify-between items-start mb-4 z-10">
        <StatusBadge status={prediction.status as any} />
        <span className="text-xs font-mono text-white/40 group-hover:text-white/60 transition-colors">
          {formatDate(prediction.createdAt)}
        </span>
      </div>

      {/* Center: Card Visual (Abstract) */}
      <div className="relative flex-1 flex items-center justify-center py-6 z-10">
        <div className="w-20 h-32 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500 transform group-hover:scale-110 shadow-lg shadow-black/20">
          <Sparkles className="w-6 h-6 text-white/20 group-hover:text-primary/60 transition-colors" />
        </div>
        {/* Decorative cards behind */}
        <div className="absolute w-20 h-32 rounded-lg border border-white/5 bg-white/5 rotate-6 translate-x-2 translate-y-1 -z-10 opacity-50" />
        <div className="absolute w-20 h-32 rounded-lg border border-white/5 bg-white/5 -rotate-6 -translate-x-2 translate-y-1 -z-10 opacity-50" />
      </div>

      {/* Bottom: Question */}
      <div className="relative z-10 mt-auto">
        <h3 className="font-serif text-lg leading-snug text-white/90 group-hover:text-primary transition-colors line-clamp-2 mb-3 min-h-[3.5rem]">
          {prediction.question}
        </h3>
        <div className="flex items-center justify-between text-xs font-mono text-white/30 border-t border-white/5 pt-3">
          <span>#{prediction.id.slice(0, 8)}</span>
          <div className="flex items-center gap-1 text-primary/0 group-hover:text-primary/80 transition-all transform translate-x-2 group-hover:translate-x-0">
            <span className="uppercase tracking-wider text-[10px]">View</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}