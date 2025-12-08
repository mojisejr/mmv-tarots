import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormattedText } from '../formatted-text';

describe('FormattedText', () => {
  it('should render plain text without formatting', () => {
    render(<FormattedText text="Plain text" />);

    expect(screen.getByText('Plain text')).toBeInTheDocument();
  });

  it('should render bold text wrapped in **', () => {
    render(<FormattedText text="This is **bold** text" />);

    const element = screen.getByText('bold');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('text-[var(--primary)]');
    expect(element).toHaveClass('font-bold');
  });

  it('should handle multiple bold sections', () => {
    render(<FormattedText text="**First** and **second** bold" />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('should preserve non-bold text', () => {
    render(<FormattedText text="Normal **bold** normal" />);

    const container = screen.getByTestId('formatted-text');
    expect(container).toHaveTextContent('Normal bold normal');
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('should handle empty string', () => {
    render(<FormattedText text="" />);

    const container = screen.getByTestId('formatted-text');
    expect(container).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('should handle text without bold markers', () => {
    render(<FormattedText text="No bold here" />);

    expect(screen.getByText('No bold here')).toBeInTheDocument();
    expect(screen.queryByTestId('bold')).not.toBeInTheDocument();
  });

  it('should handle consecutive bold sections', () => {
    render(<FormattedText text="**Bold1****Bold2**" />);

    expect(screen.getByText('Bold1')).toBeInTheDocument();
    expect(screen.getByText('Bold2')).toBeInTheDocument();
  });
});