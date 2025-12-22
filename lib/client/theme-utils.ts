/**
 * Theme utilities for accessing CSS custom properties
 */
export const getComputedStyle = (property: string): string => {
  if (typeof window === 'undefined') return '';

  const styles = window.getComputedStyle(document.documentElement);
  return styles.getPropertyValue(property).trim();
};

/**
 * Get a color value with proper fallback
 */
export const getColor = (property: string, fallback: string = ''): string => {
  const value = getComputedStyle(property);
  return value || fallback;
};

/**
 * Get a specific color from the theme
 */
export const getThemeColor = {
  primary: () => getColor('--color-primary', '#F27669'),
  accent: () => getColor('--color-accent', '#FCBD74'),
  background: () => getColor('--color-background', '#2a2a2e'),
  foreground: () => getColor('--color-foreground', '#ffffff'),
  mutedForeground: () => getColor('--color-muted-foreground', '#a0a0a0'),
  success: () => getColor('--color-success', '#06C755'),
};

/**
 * Check if dark mode is active
 */
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return true; // Default to dark for SSR

  return window.matchMedia('(prefers-color-scheme: dark)').matches ||
         document.documentElement.classList.contains('dark');
};