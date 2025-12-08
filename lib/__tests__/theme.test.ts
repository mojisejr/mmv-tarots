import { describe, it, expect, vi } from 'vitest';
import { getThemeColor, getColor, isDarkMode } from '../theme-utils';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Theme Configuration', () => {
  it('should return primary color correctly', () => {
    const color = getThemeColor.primary();
    expect(color).toBe('#F27669');
  });

  it('should return accent color correctly', () => {
    const color = getThemeColor.accent();
    expect(color).toBe('#FCBD74');
  });

  it('should return background color correctly', () => {
    const color = getThemeColor.background();
    expect(color).toBe('#2a2a2e');
  });

  it('should return foreground color correctly', () => {
    const color = getThemeColor.foreground();
    expect(color).toBe('#ffffff');
  });

  it('should return muted foreground color correctly', () => {
    const color = getThemeColor.mutedForeground();
    expect(color).toBe('#a0a0a0');
  });

  it('should return success color correctly', () => {
    const color = getThemeColor.success();
    expect(color).toBe('#06C755');
  });

  it('should handle missing CSS property gracefully', () => {
    const color = getColor('--non-existent', '#fallback');
    expect(color).toBe('#fallback');
  });

  it('should check dark mode status', () => {
    const isDark = isDarkMode();
    expect(typeof isDark).toBe('boolean');
  });
});