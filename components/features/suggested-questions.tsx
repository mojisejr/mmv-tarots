'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchSuggestedQuestions } from '@/lib/client/api';

interface SuggestedQuestion {
  id: string;
  text: string;
  category: string;
}

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  visible: boolean;
  className?: string;
}

export function SuggestedQuestions({ onSelect, visible, className = '' }: SuggestedQuestionsProps) {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [displayQuestions, setDisplayQuestions] = useState<SuggestedQuestion[]>([]);
  const [isVisible, setIsVisible] = useState(false); // Internal visibility state for animation

  // Fetch questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      const data = await fetchSuggestedQuestions();
      if (data && data.length > 0) {
        setQuestions(data);
      }
    };
    loadQuestions();
  }, []);

  // Shuffle and pick 3-4 questions when becoming visible or when questions load
  useEffect(() => {
    if (visible && questions.length > 0) {
      // Fisher-Yates shuffle
      const shuffled = [...questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Pick 3-4 items (randomly)
      const count = Math.random() > 0.5 ? 4 : 3;
      setDisplayQuestions(shuffled.slice(0, count));
      
      // Delay visibility slightly for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else if (!visible) {
      setIsVisible(false);
    }
  }, [visible, questions]);

  if (!visible && !isVisible) return null;

  return (
    <div 
      className={`w-full max-w-2xl mx-auto mb-4 overflow-x-auto no-scrollbar mask-horizontal-fade transition-all duration-700 ease-out ${
        visible && isVisible 
          ? 'opacity-100 translate-y-0 max-h-[100px]' 
          : 'opacity-0 translate-y-4 max-h-0 pointer-events-none'
      } ${className}`}
    >
      <div className="flex gap-2 px-1 pb-1 flex-nowrap md:flex-wrap md:justify-center min-w-max md:min-w-0">
        {displayQuestions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.text)}
            className={`
              group flex items-center gap-2 px-4 py-2 rounded-full 
              bg-glass-mimi backdrop-blur-md border border-white/10 
              text-xs sm:text-sm font-medium text-foreground/80 whitespace-nowrap
              hover:bg-primary/10 hover:border-primary/30 hover:text-foreground hover:scale-105 hover:shadow-glow-primary
              active:scale-95
              transition-all duration-300
              animate-fade-in-up
            `}
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both' 
            }}
          >
            <Sparkles className="w-3 h-3 text-accent opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>{q.text}</span>
          </button>
        ))}
      </div>
      
      {/* Scroll Hint for Mobile */}
      <div className="md:hidden flex justify-center mt-1">
        <div className="w-8 h-1 bg-white/10 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
