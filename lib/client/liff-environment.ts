export function isLiffEnvironment(userAgent?: string): boolean {
  const ua = (userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();

  if (!ua) {
    return false;
  }

  // LINE in-app browsers typically include `line/` token.
  return ua.includes('line/') || ua.includes('liff');
}
