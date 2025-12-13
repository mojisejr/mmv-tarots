'use client';

import { useState } from 'react';
import { GlassCard } from '../../components/card';
import { GlassButton } from '../../components/button';
import { Search, ChevronRight } from '../../components/icons';

interface Prediction {
  id: string;
  date: string;
  query: string;
}

interface HistoryPageProps {
  predictions?: Prediction[];
  onCheckStatus: (jobId: string) => void;
}

export default function HistoryPage({ predictions = [], onCheckStatus }: HistoryPageProps) {
  const [inputJobId, setInputJobId] = useState('');

  const handleSearch = () => {
    if (inputJobId.trim()) {
      onCheckStatus(inputJobId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePredictionClick = (predictionId: string) => {
    onCheckStatus(predictionId);
  };

  // Filter predictions based on search
  const filteredPredictions = predictions.filter(prediction =>
    prediction.id.toLowerCase().includes(inputJobId.toLowerCase()) ||
    prediction.query.toLowerCase().includes(inputJobId.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
      <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">Your Journey</h2>

      <GlassCard className="mb-8 p-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 font-sans">Find Ticket</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputJobId}
            onChange={(e) => setInputJobId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="#12345"
            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-lg placeholder-white/20 transition-all"
          />
          <GlassButton variant="icon" onClick={handleSearch} disabled={!inputJobId.trim()}>
            <Search className="w-5 h-5" />
          </GlassButton>
        </div>
      </GlassCard>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 font-sans px-2">Recent Visions</h3>
        <div className="space-y-3 pb-4">
          {filteredPredictions.map((item) => (
            <div
              key={item.id}
              className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all duration-300"
              onClick={() => handlePredictionClick(item.id)}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-white font-medium truncate text-base mb-1 font-sans group-hover:text-[var(--primary)] transition-colors">
                  {item.query}
                </div>
                <div className="text-xs text-white/40 font-mono flex items-center gap-2">
                  <span>#{item.id}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>{item.date}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}