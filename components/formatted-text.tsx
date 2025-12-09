import React from 'react';

export interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span className={className} data-testid="formatted-text">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={index} className="text-[var(--primary)] font-bold">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};