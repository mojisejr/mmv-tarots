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
    <div className="w-full" data-testid="question-input-container">
      <div
        className={`relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] p-2 pl-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 ${
          isFocused ? 'bg-white/20 border-white/40 shadow-xl' : ''
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
          data-testid="question-textarea"
          className="w-full bg-transparent border-none text-white placeholder-white/40 focus:ring-0 focus:outline-none resize-none py-4 pr-16 font-sans text-xl leading-relaxed tracking-wide"
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            maxHeight: `${MIN_TEXTAREA_HEIGHT + (24 * (maxRows - 1))}px`,
          }}
          aria-label="Question input"
          aria-describedby={showHint ? 'question-hint' : undefined}
        />

        <div className="absolute right-2 bottom-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid || disabled}
            aria-label={disabled ? 'Submitting question' : (isValid ? 'Submit question' : 'Question too short (minimum 5 characters)')}
            className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20 ${
              disabled || !isValid
                ? 'bg-white/10 text-white/30 cursor-not-allowed scale-95'
                : 'bg-[var(--primary)] text-white scale-100 hover:scale-110 hover:shadow-[0_0_20px_var(--primary)]'
            }`}
          >
            <ArrowUp className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
      </div>

      <p
        id="question-hint"
        className={`text-center text-[11px] text-white/40 mt-4 font-sans tracking-wider uppercase transition-opacity duration-300 ${
          showHint ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showHint}
      >
        Press Enter to send
      </p>
    </div>
  );
}