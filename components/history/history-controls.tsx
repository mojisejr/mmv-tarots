import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

interface HistoryControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: 'newest' | 'oldest';
  onSortChange: (value: 'newest' | 'oldest') => void;
  className?: string;
}

export function HistoryControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  className,
}: HistoryControlsProps) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 items-center justify-between w-full mb-8", className)}>
      {/* Search Bar */}
      <div className="relative w-full md:max-w-md group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/40 group-focus-within:text-primary/80 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your visions..."
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 sm:text-sm transition-all duration-300 backdrop-blur-sm"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Status Filter */}
        <div className="relative group">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all cursor-pointer hover:bg-white/10"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Status</option>
            <option value="COMPLETED" className="bg-slate-900 text-white">Completed</option>
            <option value="PENDING" className="bg-slate-900 text-white">Pending</option>
            <option value="FAILED" className="bg-slate-900 text-white">Failed</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-3.5 w-3.5 text-white/40 group-hover:text-primary/80 transition-colors" />
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort By */}
        <div className="relative group">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
            className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all cursor-pointer hover:bg-white/10"
          >
            <option value="newest" className="bg-slate-900 text-white">Newest First</option>
            <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-3.5 w-3.5 text-white/40 group-hover:text-primary/80 transition-colors" />
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
