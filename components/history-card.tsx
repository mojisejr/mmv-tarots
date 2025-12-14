import React from 'react';
import { ChevronRight, Eye } from './icons';
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

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all duration-300"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(prediction.id);
        }
      }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-white font-medium truncate text-base font-sans group-hover:text-[var(--primary)] transition-colors">
            {prediction.question}
          </h3>
          <StatusBadge status={prediction.status as any} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-white/40 font-mono flex items-center gap-2">
            <span>#{prediction.id}</span>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <span>{formatDate(prediction.createdAt)}</span>
          </div>

          {prediction.status === 'COMPLETED' && prediction.selectedCards && (
            <button
              onClick={handleViewDetails}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-[var(--primary)] transition-colors font-medium"
              aria-label="View details"
            >
              <Eye data-testid="eye-icon" className="w-3.5 h-3.5" />
              <span>{prediction.selectedCards.length} ใบ</span>
              <span className="hidden sm:inline">ดูผลการทำนาย</span>
            </button>
          )}
        </div>
      </div>

      <ChevronRight
        data-testid="chevron-icon"
        className="w-5 h-5 text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all flex-shrink-0"
      />
    </div>
  );
}