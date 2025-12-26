'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { FloatingBadge } from './floating-badge';

export interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  minCharacters?: number;
  maxCharacters?: number;
  maxRows?: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  isSubmitting?: boolean;
}

const MIN_TEXTAREA_HEIGHT = 56; // Increased for better touch target and spacing
const DEFAULT_PLACEHOLDER = 'Ask Mimi...';
const MIN_CHARACTERS = 5;
const MAX_CHARACTERS_DEFAULT = 180;

/**
 * Auto-resizing textarea component for question input
 * Features:
 * - Auto-resize based on content
 * - Submit on Enter (Shift+Enter for new line)
 * - Visual feedback for focus and validation
 * - Glassmorphism design
 * - Character counter and limits
 */
export function QuestionInput({
  value,
  onChange,
  onSubmit,
  placeholder = DEFAULT_PLACEHOLDER,
  minCharacters = MIN_CHARACTERS,
  maxCharacters = MAX_CHARACTERS_DEFAULT,
  maxRows = 6, // Increased to accommodate 180 chars comfortably
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
    const lineHeight = 28; // Increased line height for better readability
    const maxHeight = singleLineHeight + (lineHeight * (maxRows - 1));
    const newHeight = Math.min(Math.max(textarea.scrollHeight, singleLineHeight), maxHeight);

    // Set the height
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Handle textarea value changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  const isValid = value.length >= minCharacters && value.length <= maxCharacters;

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isValid) {
          onSubmit(value);
        }
      }
    },
    [value, isValid, onSubmit]
  );

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (isValid) {
      onSubmit(value);
    }
  }, [isValid, value, onSubmit]);

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

  const showHint = !isFocused && value.length === 0;
  const characterCount = value.length;

  return (
    <div className="w-full relative" data-testid="question-input-container">
      {/* Focus Mode Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-none z-[-1] ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Character Counter Badge (Top Left) */}
      {(isFocused || characterCount > 0) && (
        <FloatingBadge position="top-left" animate={false}>
          <span className={`text-[10px] font-bold tracking-tighter ${
            characterCount > maxCharacters ? 'text-red-400' : 'text-white/60'
          }`}>
            {characterCount}/{maxCharacters}
          </span>
        </FloatingBadge>
      )}

      {/* Ready Status Badge (Top Right) */}
      {isValid && !isFocused && (
        <FloatingBadge position="top-right">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Ready to Ask</span>
        </FloatingBadge>
      )}

      <div className="flex items-end gap-3">
        <div
          className={`flex-1 relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-white/15 hover:border-white/30 ${
            isFocused ? 'bg-white/20 border-white/40 shadow-xl ring-1 ring-white/20' : ''
          }`}
        >
          <style jsx>{`
            textarea::-webkit-scrollbar {
              display: none;
            }
            textarea {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
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
              maxHeight: `${MIN_TEXTAREA_HEIGHT + (28 * (maxRows - 1))}px`,
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
              ? 'bg-white/5 text-white/20 cursor-not-allowed scale-90 grayscale pointer-events-none'
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