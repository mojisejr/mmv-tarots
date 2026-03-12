import { describe, expect, it } from 'vitest';
import { isLiffEnvironment } from '@/lib/client/liff-environment';

describe('liff environment detection', () => {
  it('returns true when user agent contains LINE token', () => {
    const result = isLiffEnvironment('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Line/14.0.0 Mobile');
    expect(result).toBe(true);
  });

  it('returns true when user agent contains LIFF token', () => {
    const result = isLiffEnvironment('Mozilla/5.0 LIFF/2.22.3');
    expect(result).toBe(true);
  });

  it('returns false for regular browser user agent', () => {
    const result = isLiffEnvironment('Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36');
    expect(result).toBe(false);
  });
});
