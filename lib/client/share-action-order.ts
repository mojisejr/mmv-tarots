export type ShareActionId = 'facebook' | 'x' | 'tiktok' | 'copy-link' | 'copy-message' | 'copy-code';

export function resolveShareActionOrder(isLiff: boolean, hasReferralCode: boolean): ShareActionId[] {
  const base: ShareActionId[] = isLiff
    ? ['copy-code', 'copy-message', 'copy-link', 'facebook', 'x', 'tiktok']
    : ['copy-link', 'copy-message', 'facebook', 'x', 'tiktok', 'copy-code'];

  if (!hasReferralCode) {
    return base.filter((action) => action !== 'copy-code');
  }

  return base;
}
