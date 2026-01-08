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
  cooldownRemaining?: number;
  concentration?: { active: number; total: number; nextRefillIn: number } | null;
  onFocus?: () => void;
  onBlur?: () => void;
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
  cooldownRemaining = 0,
  concentration,
  onFocus,
  onBlur,
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
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Resize textarea when value changes
  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const showHint = !isFocused && value.length === 0;
  const characterCount = value.length;

  return (
    <div className="w-full relative" data-testid="question-input-container">
      {/* Character Counter Badge (Top Left) */}
      {(isFocused || characterCount > 0) && (
        <FloatingBadge position="top-left" animate={false}>
          <span className={`text-[10px] font-bold tracking-tighter ${
            characterCount > maxCharacters ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            {characterCount}/{maxCharacters}
          </span>
        </FloatingBadge>
      )}

      {/* Ready Status Badge (Top Right) */}
      {isValid && !isFocused && (
        <FloatingBadge position="top-right">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-tighter">Ready to Ask</span>
        </FloatingBadge>
      )}

      {/* Concentration/Quota Badge (Bottom Left) */}
      {concentration && !isFocused && (
        <FloatingBadge position="bottom-left" animate={false}>
          <div className="flex gap-1 items-center px-1">
            {Array.from({ length: concentration.total }).map((_, i) => (
              <span 
                key={i} 
                className={`text-xs transition-opacity duration-500 transform ${
                  i < concentration.active ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-90'
                }`}
                role="img" 
                aria-label="Crystal Ball"
              >
                🔮
              </span>
            ))}
          </div>
        </FloatingBadge>
      )}

      <div className="flex items-end gap-3">
        <div
          className={`flex-1 relative bg-glass-mimi backdrop-blur-2xl border border-primary/20 rounded-[2rem] shadow-warm transition-all duration-300 hover:bg-primary/5 hover:border-primary/30 ${
            isFocused ? 'bg-primary/10 border-primary/40 shadow-xl ring-1 ring-primary/20' : ''
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
            className="w-full bg-transparent border-none text-foreground placeholder-foreground/30 focus:ring-0 focus:outline-none resize-none py-4 px-6 font-sans text-lg leading-relaxed tracking-wide"
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
              ? 'bg-black/5 text-foreground/20 cursor-not-allowed scale-90 grayscale pointer-events-none'
              : 'bg-gradient-to-br from-primary to-accent text-foreground scale-100 hover:scale-105 active:scale-95 shadow-glow-primary'
          }`}
        >
          {cooldownRemaining > 0 ? (
            <span className="text-xs font-bold font-mono">
              {Math.floor(cooldownRemaining / 60)}:{(cooldownRemaining % 60).toString().padStart(2, '0')}
            </span>
          ) : (
            <ArrowUp className={`w-6 h-6 transition-transform duration-500 ${isSubmitting ? 'animate-bounce' : ''}`} />
          )}
        </button>
      </div>

      <p
        id="question-hint"
        className={`text-center text-[11px] text-muted-foreground/40 mt-4 font-sans tracking-wider uppercase transition-opacity duration-300 hidden md:block ${
          showHint || cooldownRemaining > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showHint && cooldownRemaining <= 0}
      >
        {cooldownRemaining > 0 ? (
          <span className="text-accent/80 animate-pulse font-medium flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            แม่หมอกำลังรวบรวมสมาธิ... อีก {cooldownRemaining} วินาที
          </span>
        ) : (
          'Press Enter to send'
        )}
      </p>
    </div>
  );
}