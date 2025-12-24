'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

export interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  minCharacters?: number;
  maxRows?: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  isSubmitting?: boolean;
}

const MIN_TEXTAREA_HEIGHT = 44; // pixels
const DEFAULT_PLACEHOLDER = 'Ask Mimi...';
const MIN_CHARACTERS = 5;

/**
 * Auto-resizing textarea component for question input
 * Features:
 * - Auto-resize based on content
 * - Submit on Enter (Shift+Enter for new line)
 * - Visual feedback for focus and validation
 * - Glassmorphism design
 */
export function QuestionInput({
  value,
  onChange,
  onSubmit,
  placeholder = DEFAULT_PLACEHOLDER,
  minCharacters = MIN_CHARACTERS,
  maxRows = 4,
  textareaRef: externalTextareaRef,
  disabled = false,
  isSubmitting = false,
}: QuestionInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalTextareaRef;

  // Auto-resize textarea based on content
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height
    const singleLineHeight = MIN_TEXTAREA_HEIGHT;
    const lineHeight = 24; // Approximate line height for text-xl
    const maxHeight = singleLineHeight + (lineHeight * (maxRows - 1));
    const newHeight = Math.min(Math.max(textarea.scrollHeight, singleLineHeight), maxHeight);

    // Set the height
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Handle textarea value changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.length >= minCharacters) {
          onSubmit(value);
        }
      }
    },
    [value, minCharacters, onSubmit]
  );

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (value.length >= minCharacters) {
      onSubmit(value);
    }
  }, [value, minCharacters, onSubmit]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Resize textarea when value changes
  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const isValid = value.length >= minCharacters;
  const showHint = !isFocused && value.length === 0;

  return (
    <div className="w-full relative" data-testid="question-input-container">
      {/* Focus Mode Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-none z-[-1] ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Floating Status Badge */}
      {isValid && !isFocused && (
        <div className="absolute -top-8 right-4 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Ready to Ask</span>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div
          className={`flex-1 relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-white/15 hover:border-white/30 ${
            isFocused ? 'bg-white/20 border-white/40 shadow-xl ring-1 ring-white/20' : ''
          }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={1}
            autoFocus
            disabled={disabled}
            inputMode="text"
            enterKeyHint="send"
            data-testid="question-textarea"
            className="w-full bg-transparent border-none text-white placeholder-white/30 focus:ring-0 focus:outline-none resize-none py-4 px-6 font-sans text-lg leading-relaxed tracking-wide"
            style={{
              minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
              maxHeight: `${MIN_TEXTAREA_HEIGHT + (24 * (maxRows - 1))}px`,
            }}
            aria-label="Question input"
            aria-describedby={showHint ? 'question-hint' : undefined}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || disabled}
          aria-label={disabled ? 'Submitting question' : (isValid ? 'Submit question' : 'Question too short')}
          className={`p-4 rounded-full transition-all duration-500 flex items-center justify-center shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[56px] min-w-[56px] ${
            disabled || !isValid
              ? 'bg-white/5 text-white/20 cursor-not-allowed scale-90 grayscale'
              : 'bg-gradient-to-br from-primary to-accent text-white scale-100 hover:scale-105 active:scale-95 shadow-glow-primary'
          }`}
        >
          <ArrowUp className={`w-6 h-6 transition-transform duration-500 ${isSubmitting ? 'animate-bounce' : ''}`} />
        </button>
      </div>

      <p
        id="question-hint"
        className={`text-center text-[11px] text-white/40 mt-4 font-sans tracking-wider uppercase transition-opacity duration-300 hidden md:block ${
          showHint ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showHint}
      >
        Press Enter to send
      </p>
    </div>
  );
}