import React from 'react';
import { ChevronRight } from './icons';
import { StatusBadge } from './status-badge';

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
      className="group bg-glass-white hover:bg-glass-whiteHover border border-glass-border hover:border-glass-borderHover rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all duration-300 backdrop-blur-xl"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(prediction.id);
        }
      }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-medium truncate text-base mb-1 font-sans text-foreground group-hover:text-primary transition-colors">
          {prediction.question}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono flex items-center gap-2 text-muted-foreground">
            <span>#{prediction.id}</span>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <span>{formatDate(prediction.createdAt)}</span>
          </div>
          <StatusBadge status={prediction.status as any} />
        </div>
      </div>

      <ChevronRight
        data-testid="chevron-icon"
        className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all flex-shrink-0"
      />
    </div>
  );
}